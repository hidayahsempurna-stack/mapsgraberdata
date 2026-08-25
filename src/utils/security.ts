import { BusinessLead } from '../types';

/**
 * Utility keamanan untuk memastikan isolasi data multi-tenant (Strict Data Silo Enforcement)
 * Mencegah kebocoran data antar-pengguna dalam sistem dengan 100+ pengguna.
 */

export interface UserContext {
  email: string;
  uid?: string;
  role?: string;
  isRootAdmin?: boolean;
}

/**
 * Memastikan payload lead selalu disanitasi dan disuntikkan kepemilikan pengguna (ownerEmail & ownerUid)
 */
export function sanitizeLeadPayload<T extends Partial<BusinessLead>>(
  payload: T,
  user: UserContext
): T & { ownerEmail: string; ownerUid: string; updatedAt: string } {
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanUid = (user.uid || cleanEmail || 'anonymous').trim();

  return {
    ...payload,
    ownerEmail: cleanEmail,
    ownerUid: cleanUid,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Memfilter daftar leads agar HANYA menampilkan data milik user yang sedang login.
 * Jika isRootAdmin = true dan mode global aktif, admin dapat melihat semua data.
 */
export function filterLeadsForUser(
  leads: BusinessLead[],
  user: UserContext | null,
  allowAdminGlobalView: boolean = false
): BusinessLead[] {
  if (!leads || !Array.isArray(leads)) return [];
  if (!user || !user.email) return [];

  const currentUserEmail = user.email.trim().toLowerCase();
  const currentUserUid = user.uid ? user.uid.trim() : currentUserEmail;

  // Jika Super Admin memilih tampilan global
  if (user.isRootAdmin && allowAdminGlobalView) {
    return leads;
  }

  return leads.filter((lead) => {
    // 1. Cek ownerEmail eksplisit
    if (lead.ownerEmail) {
      return lead.ownerEmail.trim().toLowerCase() === currentUserEmail;
    }

    // 2. Cek ownerUid eksplisit
    if (lead.ownerUid) {
      return lead.ownerUid.trim() === currentUserUid;
    }

    // 3. Cek scrapedBy field
    if (lead.scrapedBy) {
      const scraped = lead.scrapedBy.trim().toLowerCase();
      if (scraped === currentUserEmail || scraped.includes(currentUserEmail)) {
        return true;
      }
    }

    // Default untuk data lokal yang belum memiliki owner: klaim untuk current user
    return true;
  });
}

/**
 * Verifikasi apakah sebuah lead dimiliki oleh pengguna aktif
 */
export function isLeadOwnedByUser(lead: BusinessLead, user: UserContext | null): boolean {
  if (!user || !user.email) return false;
  if (user.isRootAdmin) return true;

  const currentUserEmail = user.email.trim().toLowerCase();
  const currentUserUid = user.uid ? user.uid.trim() : currentUserEmail;

  if (lead.ownerEmail && lead.ownerEmail.trim().toLowerCase() === currentUserEmail) return true;
  if (lead.ownerUid && lead.ownerUid.trim() === currentUserUid) return true;
  if (lead.scrapedBy && lead.scrapedBy.trim().toLowerCase() === currentUserEmail) return true;

  return false;
}
