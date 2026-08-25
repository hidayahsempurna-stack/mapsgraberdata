/**
 * Encrypted Database Backup & Restore Utility
 * Uses Web Crypto API (PBKDF2 + AES-GCM-256) for secure client-side encryption.
 */

export interface EncryptedBackupPayload {
  version: number;
  type: 'GMAPS_LEADS_ENCRYPTED_BACKUP';
  createdAt: string;
  app: string;
  leadCount: number;
  salt: string;       // base64
  iv: string;         // base64
  ciphertext: string; // base64
}

/**
 * Derive an AES-GCM-256 key from a password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data and download as a protected JSON backup file
 */
export async function createEncryptedBackupFile(
  data: any,
  password: string,
  filename?: string
): Promise<void> {
  if (!password || password.trim().length < 4) {
    throw new Error('Kata sandi enkripsi minimal 4 karakter.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    plaintext
  );

  const leadCount = Array.isArray(data) ? data.length : (data?.leads?.length || 0);

  const payload: EncryptedBackupPayload = {
    version: 1,
    type: 'GMAPS_LEADS_ENCRYPTED_BACKUP',
    createdAt: new Date().toISOString(),
    app: 'GMaps Lead Scraper & Extractor',
    leadCount,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer)
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `gmaps_leads_backup_${new Date().toISOString().slice(0, 10)}.enc.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Decrypt a backup file payload using password
 */
export async function restoreEncryptedBackup(
  payload: EncryptedBackupPayload | any,
  password: string
): Promise<any> {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.salt) {
    // If it's standard plain JSON (unencrypted backup fallback)
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload.leads && Array.isArray(payload.leads)) {
      return payload.leads;
    }
    throw new Error('Format file backup tidak valid atau rusak.');
  }

  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const ciphertext = base64ToBuffer(payload.ciphertext);

  try {
    const key = await deriveKey(password, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    return JSON.parse(jsonStr);
  } catch (err: any) {
    throw new Error('Kata sandi salah atau berkas backup terkorupsi.');
  }
}
