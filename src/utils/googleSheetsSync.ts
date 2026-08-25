/**
 * Google Sheets API Integration Service
 * Uses Google Identity Services (GSI) Client Token & Google Sheets v4 REST API
 */

import { BusinessLead } from '../types';
import { safeStorage } from './storage';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetTitle?: string;
  lastSyncedAt?: string;
  sheetName?: string;
  autoSyncEnabled?: boolean;
}

const STORAGE_KEY_OAUTH_TOKEN = 'gmaps_google_oauth_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'gmaps_google_oauth_token_expiry';
const STORAGE_KEY_SHEETS_CONFIG = 'gmaps_google_sheets_config';

/**
 * Get stored Google Sheets config
 */
export function getSavedSheetsConfig(): GoogleSheetsConfig {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_SHEETS_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse sheets config:', e);
  }
  return {
    sheetName: 'Daftar Prospek Bisnis',
    autoSyncEnabled: false
  };
}

/**
 * Save Google Sheets config
 */
export function saveSheetsConfig(config: GoogleSheetsConfig): void {
  try {
    safeStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save sheets config:', e);
  }
}

/**
 * Get cached access token if still valid
 */
export function getStoredAccessToken(): string | null {
  const token = safeStorage.getItem(STORAGE_KEY_OAUTH_TOKEN);
  const expiry = safeStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
  if (!token || !expiry) return null;
  const expNum = parseInt(expiry, 10);
  if (Date.now() >= expNum - 60000) {
    // expired or expiring in 1 minute
    return null;
  }
  return token;
}

export function saveAccessToken(token: string, expiresInSeconds: number): void {
  const expiryTime = Date.now() + expiresInSeconds * 1000;
  safeStorage.setItem(STORAGE_KEY_OAUTH_TOKEN, token);
  safeStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString());
}

export function clearGoogleAuth(): void {
  safeStorage.removeItem(STORAGE_KEY_OAUTH_TOKEN);
  safeStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
}

/**
 * Request OAuth Access Token using Google Identity Services (GSI)
 */
export async function requestGoogleAccessToken(clientId?: string): Promise<string> {
  // Check if token already valid
  const existing = getStoredAccessToken();
  if (existing) return existing;

  // We can determine client ID from config, environment or prompt
  const effectiveClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || (firebaseConfig as any)?.oAuthClientId || '';

  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(
        new Error(
          'Google Identity Services SDK belum siap. Pastikan koneksi internet stabil atau nonaktifkan pemblokir skrip.'
        )
      );
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error !== undefined) {
            reject(new Error(response.error_description || response.error || 'Gagal login ke Akun Google.'));
            return;
          }
          if (response.access_token) {
            saveAccessToken(response.access_token, response.expires_in || 3599);
            resolve(response.access_token);
          } else {
            reject(new Error('Tidak ada Access Token yang diterima dari Google.'));
          }
        },
      });

      // Request token with popup
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Format leads into 2D array for Google Sheets rows
 */
export function formatLeadsForSheets(leads: BusinessLead[]): (string | number)[][] {
  const headers = [
    'ID Lead',
    'Nama Bisnis / Usaha',
    'Kategori',
    'Segmentasi Niche',
    'Kota',
    'Alamat Lengkap',
    'Nomor Telepon / WA',
    'Rating',
    'Jumlah Ulasan',
    'Status Website',
    'URL Web Terdeteksi',
    'Catatan Website',
    'Status Pipeline Outreach',
    'Tanggal Kontak Pertama',
    'Terakhir Dihubungi',
    'Jumlah Outreach',
    'Tipe Outreach Terakhir',
    'Catatan Khusus Sales',
    'Google Maps URL',
    'Waktu Scrape / Diperbarui'
  ];

  const rows = leads.map(l => [
    l.id || '',
    l.name || '',
    l.category || '',
    l.isMedicalLead ? 'Klinik / Rekam Medis (RME)' : 'Bisnis Umum / Toko',
    l.city || '',
    l.address || '',
    l.phone || '',
    l.rating || 0,
    l.reviewCount || 0,
    l.hasOfficialWebsite ? 'Memiliki Web Resmi' : 'Tanpa Web Resmi',
    l.detectedWebsite || '',
    l.websiteNote || '',
    l.contactStatus === 'deal' ? 'Closing / Deal' :
      l.contactStatus === 'interested' ? 'Tertarik' :
      l.contactStatus === 'contacted' ? 'Sudah Dihubungi' :
      l.contactStatus === 'not_interested' ? 'Tidak Tertarik' : 'Baru (Belum Kontak)',
    l.firstContactedAt || '',
    l.lastContactedAt || '',
    l.outreachCount || 0,
    l.lastOutreachType === 'rekam_medis' ? 'Aplikasi Rekam Medis' :
      l.lastOutreachType === 'website' ? 'Pembuatan Website' : (l.lastOutreachType || ''),
    l.notes || '',
    l.mapsUrl || '',
    l.checkedAt || new Date().toISOString()
  ]);

  return [headers, ...rows];
}

/**
 * Create a new Google Spreadsheet via REST API
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheetTitle = title || `Prospek Leads Google Maps - ${new Date().toLocaleDateString('id-ID')}`;

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle
      },
      sheets: [
        {
          properties: {
            title: 'Daftar Prospek Bisnis',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membuat Google Spreadsheet (Status: ${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Push leads rows to an existing Google Spreadsheet (replaces or appends)
 */
export async function syncLeadsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  leads: BusinessLead[],
  sheetName: string = 'Daftar Prospek Bisnis'
): Promise<{ updatedRows: number }> {
  const values = formatLeadsForSheets(leads);

  // Clear existing sheet contents first to keep data clean & synchronized
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z:clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    // Non-fatal if sheet name is slightly different
    console.warn('Clear range warning:', e);
  }

  // Write new data
  const range = `${sheetName}!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal menyinkronkan data ke Google Sheet (Status: ${response.status})`);
  }

  const result = await response.json();
  return {
    updatedRows: result.updatedRows || values.length
  };
}
