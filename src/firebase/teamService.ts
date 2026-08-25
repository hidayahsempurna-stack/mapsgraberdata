import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './config';
import { WhitelistUser, UserRole, MemberStatus, LicenseRequest } from '../types';
import { safeStorage } from '../utils/storage';

export const ROOT_ADMIN_EMAILS = [
  'hidayahsempurna@gmail.com',
  'ekod2022@gmail.com'
];
export const ROOT_ADMIN_EMAIL = 'hidayahsempurna@gmail.com';
export const DEFAULT_ADMIN_WHATSAPP_PHONE = '6281234567890';

const ALLOWED_USERS_COLLECTION = 'allowed_users';
const LICENSE_REQUESTS_COLLECTION = 'license_requests';
const SYSTEM_SETTINGS_COLLECTION = 'system_settings';
const ADMIN_CONFIG_DOC = 'admin_config';

const LOCAL_USERS_CACHE_KEY = 'gmaps_whitelist_users_cache';
const LOCAL_REQUESTS_CACHE_KEY = 'gmaps_license_requests_cache';
const LOCAL_ADMIN_PHONE_KEY = 'gmaps_admin_whatsapp_phone';

const DEFAULT_ROOT_ADMIN: WhitelistUser = {
  email: ROOT_ADMIN_EMAIL.toLowerCase(),
  name: 'Super Admin Master',
  role: 'admin',
  status: 'active',
  licenseKey: 'GMAPS-ROOT-ADMIN-KEY',
  whatsappPhone: DEFAULT_ADMIN_WHATSAPP_PHONE,
  addedBy: 'SYSTEM',
  createdAt: new Date().toISOString(),
  notes: 'Root Project Owner (Akses Penuh Master via Akun Google)'
};

/**
 * Cache whitelist users locally for instant and offline access
 */
function cacheUserLocally(user: WhitelistUser) {
  try {
    const raw = safeStorage.getItem(LOCAL_USERS_CACHE_KEY);
    const users: Record<string, WhitelistUser> = raw ? JSON.parse(raw) : {};
    users[user.email.toLowerCase()] = user;
    safeStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(users));
  } catch {
    // Ignore safe storage errors
  }
}

function getLocallyCachedUser(email: string): WhitelistUser | null {
  try {
    const raw = safeStorage.getItem(LOCAL_USERS_CACHE_KEY);
    if (!raw) return null;
    const users: Record<string, WhitelistUser> = JSON.parse(raw);
    return users[email.toLowerCase()] || null;
  } catch {
    return null;
  }
}

/**
 * Generate a random alphanumeric license key formatted as GMAPS-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `GMAPS-${segment()}-${segment()}-${segment()}`;
}

/**
 * Check if the email belongs to the Root Admin
 */
export function isRootAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ROOT_ADMIN_EMAILS.some(e => e.toLowerCase() === clean);
}

/**
 * Ensure root admin document exists in Firestore
 */
export async function ensureRootAdminInitialized(): Promise<WhitelistUser> {
  const email = ROOT_ADMIN_EMAIL.toLowerCase();
  const docRef = doc(db, ALLOWED_USERS_COLLECTION, email);

  // Cache locally first
  cacheUserLocally(DEFAULT_ROOT_ADMIN);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as WhitelistUser;
      cacheUserLocally(data);
      return data;
    }

    await setDoc(docRef, DEFAULT_ROOT_ADMIN, { merge: true });
    return DEFAULT_ROOT_ADMIN;
  } catch {
    // Return fallback in-memory admin safely
    return DEFAULT_ROOT_ADMIN;
  }
}

/**
 * Verify if an email is whitelisted and active
 */
export async function checkEmailWhitelist(email: string): Promise<{
  isWhitelisted: boolean;
  user?: WhitelistUser;
  reason?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();

  // Root Admin is always whitelisted instantly
  if (isRootAdminEmail(cleanEmail)) {
    ensureRootAdminInitialized().catch(() => {});
    return { isWhitelisted: true, user: DEFAULT_ROOT_ADMIN };
  }

  try {
    const docRef = doc(db, ALLOWED_USERS_COLLECTION, cleanEmail);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      // Check offline cache as backup
      const cached = getLocallyCachedUser(cleanEmail);
      if (cached && cached.status === 'active') {
        return { isWhitelisted: true, user: cached };
      }

      return {
        isWhitelisted: false,
        reason: 'Email Anda belum didaftarkan oleh Administrator. Hubungi admin untuk mendapatkan izin akses.'
      };
    }

    const data = snap.data() as WhitelistUser;
    cacheUserLocally(data);

    if (data.status === 'suspended') {
      return {
        isWhitelisted: false,
        user: data,
        reason: 'Akses akun Anda sedang ditangguhkan (Suspended) oleh Administrator.'
      };
    }

    // Update last login in background
    updateDoc(docRef, {
      lastLoginAt: new Date().toISOString()
    }).catch(() => {});

    return {
      isWhitelisted: true,
      user: data
    };
  } catch (err: any) {
    // Check local cache if network/offline occurs
    const cached = getLocallyCachedUser(cleanEmail);
    if (cached) {
      if (cached.status === 'suspended') {
        return {
          isWhitelisted: false,
          user: cached,
          reason: 'Akses akun Anda sedang ditangguhkan (Suspended) oleh Administrator.'
        };
      }
      return {
        isWhitelisted: true,
        user: cached
      };
    }

    console.warn('Checking email whitelist fallback:', err?.message || err);
    return {
      isWhitelisted: false,
      reason: 'Gagal memverifikasi izin whitelist. Pastikan koneksi internet aktif.'
    };
  }
}

/**
 * Verify by License Key OR Email (used for Chrome extension and Web App login)
 */
export async function verifyLicenseKey(identifier: string, optionalEmail?: string): Promise<{
  isValid: boolean;
  user?: WhitelistUser;
  reason?: string;
}> {
  if (!identifier || !identifier.trim()) {
    return {
      isValid: false,
      reason: 'Masukkan Kunci Lisensi (License Key) atau Alamat Email terdaftar.'
    };
  }

  const rawInput = identifier.trim();
  const cleanKey = rawInput.toUpperCase();
  const cleanEmail = rawInput.toLowerCase();
  const explicitEmail = optionalEmail?.trim().toLowerCase();

  // 1. Root Admin: Allow login with GMAPS-ROOT-ADMIN-KEY or root admin email
  if (
    cleanKey === 'GMAPS-ROOT-ADMIN-KEY' || 
    isRootAdminEmail(cleanEmail) ||
    isRootAdminEmail(explicitEmail)
  ) {
    const rootAdmin = await ensureRootAdminInitialized();
    return { 
      isValid: true, 
      user: {
        ...rootAdmin,
        role: 'admin',
        isRootAdmin: true
      } as any
    };
  }

  // 2. If the user input is an email address format (contains @)
  if (rawInput.includes('@')) {
    const whitelistRes = await checkEmailWhitelist(cleanEmail);
    if (whitelistRes.isWhitelisted && whitelistRes.user) {
      return { isValid: true, user: whitelistRes.user };
    }
    return {
      isValid: false,
      reason: whitelistRes.reason || `Email ${cleanEmail} belum didaftarkan di Whitelist oleh Admin.`
    };
  }

  // 3. The input is a License Key: lookup in Firestore by licenseKey
  try {
    const q = query(
      collection(db, ALLOWED_USERS_COLLECTION),
      where('licenseKey', '==', cleanKey)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data() as WhitelistUser;
      cacheUserLocally(docData);

      if (docData.status === 'suspended') {
        return {
          isValid: false,
          reason: `Lisensi akun ${docData.email} sedang ditangguhkan (Suspended) oleh Administrator.`
        };
      }

      // If user also provided an explicit email, check if it matches
      if (explicitEmail && explicitEmail !== docData.email.toLowerCase()) {
        // If mismatched, inform but still accept if key is authentic
        console.warn(`License ${cleanKey} belongs to ${docData.email}, logging in as ${docData.email}`);
      }

      return {
        isValid: true,
        user: docData
      };
    }

    // 4. Check locally cached users for license key match (offline / quick lookup)
    try {
      const raw = safeStorage.getItem(LOCAL_USERS_CACHE_KEY);
      if (raw) {
        const users: Record<string, WhitelistUser> = JSON.parse(raw);
        const match = Object.values(users).find(u => 
          u.licenseKey?.toUpperCase() === cleanKey || 
          u.email?.toLowerCase() === cleanEmail
        );
        if (match) {
          if (match.status === 'suspended') {
            return { isValid: false, reason: 'Lisensi ini telah ditangguhkan.' };
          }
          return { isValid: true, user: match };
        }
      }
    } catch {
      // Ignore cache lookup errors
    }

    return {
      isValid: false,
      reason: `Kunci lisensi "${cleanKey}" tidak ditemukan di database. Pastikan Anda menyalin kunci lisensi dengan benar atau hubungi Admin (${ROOT_ADMIN_EMAIL}).`
    };
  } catch (err: any) {
    // Check cached fallback if network error
    try {
      const raw = safeStorage.getItem(LOCAL_USERS_CACHE_KEY);
      if (raw) {
        const users: Record<string, WhitelistUser> = JSON.parse(raw);
        const match = Object.values(users).find(u => 
          u.licenseKey?.toUpperCase() === cleanKey || 
          u.email?.toLowerCase() === cleanEmail
        );
        if (match && match.status === 'active') {
          return { isValid: true, user: match };
        }
      }
    } catch {
      // Ignore cache lookup errors
    }

    console.warn('License verification check note:', err?.message || err);
    return {
      isValid: false,
      reason: 'Gagal memvalidasi lisensi ke server database. Periksa koneksi internet.'
    };
  }
}

/**
 * Fetch all registered users in Whitelist (Admin only)
 */
export async function fetchAllWhitelistUsers(): Promise<WhitelistUser[]> {
  try {
    await ensureRootAdminInitialized();
    const querySnapshot = await getDocs(collection(db, ALLOWED_USERS_COLLECTION));
    const users: WhitelistUser[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as WhitelistUser);
    });

    // Ensure root admin is present
    if (!users.some(u => isRootAdminEmail(u.email))) {
      users.unshift({
        email: ROOT_ADMIN_EMAIL,
        name: 'Super Admin Master',
        role: 'admin',
        status: 'active',
        licenseKey: 'GMAPS-ROOT-ADMIN-KEY',
        addedBy: 'SYSTEM',
        createdAt: new Date().toISOString()
      });
    }

    return users.sort((a, b) => {
      if (isRootAdminEmail(a.email)) return -1;
      if (isRootAdminEmail(b.email)) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  } catch (err) {
    console.error('Error fetching whitelist users:', err);
    return [
      {
        email: ROOT_ADMIN_EMAIL,
        name: 'Super Admin Master',
        role: 'admin',
        status: 'active',
        licenseKey: 'GMAPS-ROOT-ADMIN-KEY',
        addedBy: 'SYSTEM',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

/**
 * Add a new user to Whitelist
 */
export async function addWhitelistUser(
  email: string,
  name: string,
  role: UserRole = 'member',
  adminEmail: string = ROOT_ADMIN_EMAIL,
  notes?: string
): Promise<WhitelistUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Alamat email tidak valid.');
  }

  const docRef = doc(db, ALLOWED_USERS_COLLECTION, cleanEmail);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    throw new Error(`Email ${cleanEmail} sudah terdaftar sebelumnya.`);
  }

  const newUser: WhitelistUser = {
    email: cleanEmail,
    name: name.trim() || cleanEmail.split('@')[0],
    role,
    status: 'active',
    licenseKey: generateLicenseKey(),
    addedBy: adminEmail,
    createdAt: new Date().toISOString(),
    notes: notes?.trim() || ''
  };

  cacheUserLocally(newUser);

  try {
    await setDoc(docRef, newUser);
  } catch (err: any) {
    console.warn('Firestore setDoc note:', err);
  }

  return newUser;
}

/**
 * Update user status (active/suspended) or role
 */
export async function updateWhitelistUser(
  email: string,
  updates: Partial<WhitelistUser>
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  if (isRootAdminEmail(cleanEmail) && updates.status === 'suspended') {
    throw new Error('Akun Super Admin Master tidak dapat ditangguhkan.');
  }

  // Update locally first
  const cached = getLocallyCachedUser(cleanEmail);
  if (cached) {
    cacheUserLocally({ ...cached, ...updates });
  }

  const docRef = doc(db, ALLOWED_USERS_COLLECTION, cleanEmail);
  try {
    await updateDoc(docRef, updates);
  } catch (err: any) {
    console.warn('Firestore updateDoc note:', err);
  }
}

/**
 * Remove user from Whitelist
 */
export async function deleteWhitelistUser(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  if (isRootAdminEmail(cleanEmail)) {
    throw new Error('Akun Super Admin Master tidak dapat dihapus.');
  }

  try {
    const raw = safeStorage.getItem(LOCAL_USERS_CACHE_KEY);
    if (raw) {
      const users: Record<string, WhitelistUser> = JSON.parse(raw);
      delete users[cleanEmail];
      safeStorage.setItem(LOCAL_USERS_CACHE_KEY, JSON.stringify(users));
    }
  } catch {}

  const docRef = doc(db, ALLOWED_USERS_COLLECTION, cleanEmail);
  try {
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn('Firestore deleteDoc note:', err);
  }
}

/**
 * Regenerate license key for user
 */
export async function regenerateUserLicenseKey(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  const newKey = generateLicenseKey();

  const cached = getLocallyCachedUser(cleanEmail);
  if (cached) {
    cacheUserLocally({ ...cached, licenseKey: newKey });
  }

  const docRef = doc(db, ALLOWED_USERS_COLLECTION, cleanEmail);
  try {
    await updateDoc(docRef, { licenseKey: newKey });
  } catch (err: any) {
    console.warn('Firestore update license note:', err);
  }

  return newKey;
}

/**
 * Submit a request for license / forgot license key with WhatsApp Phone number
 */
export async function submitLicenseRequest(params: {
  email: string;
  name: string;
  whatsappPhone: string;
  reason?: string;
}): Promise<LicenseRequest> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPhone = params.whatsappPhone.trim().replace(/[^0-9+]/g, '');
  const id = `req_${cleanEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

  const newRequest: LicenseRequest = {
    id,
    email: cleanEmail,
    name: params.name.trim() || cleanEmail.split('@')[0],
    whatsappPhone: cleanPhone,
    reason: params.reason?.trim() || 'Permintaan Kunci Lisensi / Lupa Kode',
    requestedAt: new Date().toISOString(),
    status: 'pending'
  };

  // Cache locally
  try {
    const raw = safeStorage.getItem(LOCAL_REQUESTS_CACHE_KEY);
    const requests: Record<string, LicenseRequest> = raw ? JSON.parse(raw) : {};
    requests[id] = newRequest;
    safeStorage.setItem(LOCAL_REQUESTS_CACHE_KEY, JSON.stringify(requests));
  } catch {}

  // Save to Firestore
  try {
    const docRef = doc(db, LICENSE_REQUESTS_COLLECTION, id);
    await setDoc(docRef, newRequest);
  } catch (err) {
    console.warn('Firestore submitLicenseRequest note:', err);
  }

  return newRequest;
}

/**
 * Fetch all pending and processed license requests (for Admin)
 */
export async function fetchAllLicenseRequests(): Promise<LicenseRequest[]> {
  try {
    const q = collection(db, LICENSE_REQUESTS_COLLECTION);
    const snap = await getDocs(q);
    const list: LicenseRequest[] = [];
    snap.forEach((d) => {
      list.push(d.data() as LicenseRequest);
    });

    // Merge with local cache
    try {
      const raw = safeStorage.getItem(LOCAL_REQUESTS_CACHE_KEY);
      if (raw) {
        const cachedMap: Record<string, LicenseRequest> = JSON.parse(raw);
        Object.values(cachedMap).forEach((req) => {
          if (!list.some(l => l.id === req.id)) {
            list.push(req);
          }
        });
      }
    } catch {}

    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch {
    // Fallback local cache
    try {
      const raw = safeStorage.getItem(LOCAL_REQUESTS_CACHE_KEY);
      if (raw) {
        return Object.values(JSON.parse(raw));
      }
    } catch {}
    return [];
  }
}

/**
 * Update request status (approved / rejected)
 */
export async function updateLicenseRequestStatus(
  id: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  try {
    const docRef = doc(db, LICENSE_REQUESTS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      resolvedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Firestore updateLicenseRequestStatus note:', err);
  }

  try {
    const raw = safeStorage.getItem(LOCAL_REQUESTS_CACHE_KEY);
    if (raw) {
      const cachedMap: Record<string, LicenseRequest> = JSON.parse(raw);
      if (cachedMap[id]) {
        cachedMap[id].status = status;
        cachedMap[id].resolvedAt = new Date().toISOString();
        safeStorage.setItem(LOCAL_REQUESTS_CACHE_KEY, JSON.stringify(cachedMap));
      }
    }
  } catch {}
}

/**
 * Get locally cached Admin WhatsApp phone number (synchronous fallback)
 */
export function getAdminWhatsAppPhoneSync(): string {
  try {
    const cached = safeStorage.getItem(LOCAL_ADMIN_PHONE_KEY);
    if (cached && cached.trim().length >= 8) {
      return cached.trim();
    }
    const rootUser = getLocallyCachedUser(ROOT_ADMIN_EMAIL);
    if (rootUser && rootUser.whatsappPhone) {
      return rootUser.whatsappPhone;
    }
  } catch {}
  return DEFAULT_ADMIN_WHATSAPP_PHONE;
}

/**
 * Fetch current Admin WhatsApp Phone from Firestore settings
 */
export async function fetchAdminWhatsAppPhone(): Promise<string> {
  try {
    // 1. Try system settings doc
    const settingsRef = doc(db, SYSTEM_SETTINGS_COLLECTION, ADMIN_CONFIG_DOC);
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.whatsappPhone) {
        const phone = data.whatsappPhone.trim();
        safeStorage.setItem(LOCAL_ADMIN_PHONE_KEY, phone);
        return phone;
      }
    }

    // 2. Try root admin user doc
    const adminDocRef = doc(db, ALLOWED_USERS_COLLECTION, ROOT_ADMIN_EMAIL.toLowerCase());
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists()) {
      const data = adminSnap.data() as WhitelistUser;
      if (data && data.whatsappPhone) {
        const phone = data.whatsappPhone.trim();
        safeStorage.setItem(LOCAL_ADMIN_PHONE_KEY, phone);
        return phone;
      }
    }
  } catch (err) {
    console.warn('fetchAdminWhatsAppPhone error fallback:', err);
  }

  return getAdminWhatsAppPhoneSync();
}

/**
 * Update Super Admin WhatsApp phone number in Firestore and local caches
 */
export async function updateAdminWhatsAppPhone(newPhone: string): Promise<{
  success: boolean;
  formattedPhone: string;
  error?: string;
}> {
  if (!newPhone || !newPhone.trim()) {
    return {
      success: false,
      formattedPhone: '',
      error: 'Nomor WhatsApp tidak boleh kosong.'
    };
  }

  // Format phone to international format: e.g. 0812 -> 62812, +62 -> 62
  let cleaned = newPhone.trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  if (cleaned.length < 9 || cleaned.length > 16) {
    return {
      success: false,
      formattedPhone: cleaned,
      error: 'Format nomor WhatsApp tidak valid (contoh: 081234567890 atau 6281234567890).'
    };
  }

  // Save to local cache immediately
  safeStorage.setItem(LOCAL_ADMIN_PHONE_KEY, cleaned);

  try {
    // 1. Update system settings doc
    const settingsRef = doc(db, SYSTEM_SETTINGS_COLLECTION, ADMIN_CONFIG_DOC);
    await setDoc(settingsRef, {
      whatsappPhone: cleaned,
      updatedAt: new Date().toISOString(),
      updatedBy: ROOT_ADMIN_EMAIL
    }, { merge: true });

    // 2. Update root admin doc
    const adminDocRef = doc(db, ALLOWED_USERS_COLLECTION, ROOT_ADMIN_EMAIL.toLowerCase());
    await setDoc(adminDocRef, {
      whatsappPhone: cleaned,
      notes: 'Root Project Owner (Akses Penuh Master via Akun Google)'
    }, { merge: true });

    // Update memory cache of root admin
    const cachedRoot = getLocallyCachedUser(ROOT_ADMIN_EMAIL) || DEFAULT_ROOT_ADMIN;
    cachedRoot.whatsappPhone = cleaned;
    cacheUserLocally(cachedRoot);

    return {
      success: true,
      formattedPhone: cleaned
    };
  } catch (err: any) {
    console.warn('updateAdminWhatsAppPhone partial failure:', err);
    // Even if firestore offline, local cache is saved
    return {
      success: true,
      formattedPhone: cleaned
    };
  }
}

