export type WebsiteStatusType = 'NO_WEBSITE' | 'HAS_OFFICIAL_WEBSITE' | 'THIRD_PARTY_LINK';

export type LeadContactStatus = 'new' | 'contacted' | 'interested' | 'not_interested' | 'deal';

export type OutreachType = 'website' | 'katalog_wa' | 'booking_jasa' | 'resto_menu' | 'rekam_medis' | 'custom';

export interface OutreachRecord {
  id: string;
  timestamp: string;
  templateName: string;
  type: OutreachType;
  phone: string;
  senderName?: string;
}

export interface BusinessLead {
  id: string;
  name: string;
  category: string;
  rating: number | string;
  reviewCount: number | string;
  address: string;
  phone: string;
  mapsUrl: string;
  hasOfficialWebsite: boolean;
  websiteStatus: 'NO_WEBSITE' | 'HAS_OFFICIAL_WEBSITE';
  detectedWebsite?: string;
  websiteNote?: string;
  checkedAt?: string;
  placeId?: string;
  contactStatus?: LeadContactStatus;
  notes?: string;
  isMedicalLead?: boolean;
  importedAt?: string;
  city?: string;
  firstContactedAt?: string;
  lastContactedAt?: string;
  outreachCount?: number;
  lastOutreachType?: OutreachType;
  outreachHistory?: OutreachRecord[];
  scrapedBy?: string;
  ownerEmail?: string;
  ownerUid?: string;
  lat?: number;
  lng?: number;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: OutreachType;
  description: string;
  template: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface ScraperStats {
  checked: number;
  hasWebsite: number;
  noWebsite: number;
  maxLimit: number;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed';
  statusMessage: string;
  currentBusinessName?: string;
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail?: string;
}

export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export type UserRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'suspended';

export interface LicenseRequest {
  id: string;
  email: string;
  name: string;
  whatsappPhone: string;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
}

export interface WhitelistUser {
  email: string;
  name: string;
  role: UserRole;
  status: MemberStatus;
  licenseKey: string;
  whatsappPhone?: string;
  addedBy?: string;
  createdAt?: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface AuthUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: MemberStatus;
  licenseKey: string;
  isRootAdmin: boolean;
}

