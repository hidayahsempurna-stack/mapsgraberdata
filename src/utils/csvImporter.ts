import { BusinessLead } from '../types';
import { isMedicalCategoryOrName } from './whatsappTemplates';

export interface CSVImportResult {
  success: boolean;
  leads: BusinessLead[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicatesCount: number;
  warnings: string[];
  medicalCount: number;
}

/**
 * Deteksi delimiter CSV yang paling sering muncul (koma, titik koma, atau tab)
 */
function detectDelimiter(text: string): string {
  const sampleLines = text.split(/\r\n|\n|\r/).slice(0, 5).join('\n');
  const commaCount = (sampleLines.match(/,/g) || []).length;
  const semicolonCount = (sampleLines.match(/;/g) || []).length;
  const tabCount = (sampleLines.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  return ',';
}

/**
 * Robust CSV parser yang mendukung escaped quotes dan multi-line text
 */
function parseCSVToGrid(csvText: string, delimiter: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, ''); // Hapus UTF-8 BOM jika ada
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote ("")
          currentCell += '"';
          i++; // Lewati quote kedua
        } else {
          // Tutup quotes
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Lewati \n
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  // Sisa sel dan baris terakhir
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalisasi header untuk pencocokan kolom fleksibel
 */
function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const alias of aliases) {
    const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    const idx = normalizedHeaders.findIndex(h => h === normAlias || h.includes(normAlias));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Import dan konversi isi CSV menjadi format BusinessLead[]
 */
export function parseCSVLeads(csvContent: string): CSVImportResult {
  const warnings: string[] = [];
  if (!csvContent || csvContent.trim() === '') {
    return {
      success: false,
      leads: [],
      totalRows: 0,
      validCount: 0,
      errorCount: 0,
      duplicatesCount: 0,
      medicalCount: 0,
      warnings: ['File CSV kosong atau tidak memiliki data.']
    };
  }

  const delimiter = detectDelimiter(csvContent);
  const grid = parseCSVToGrid(csvContent, delimiter);

  if (grid.length < 2) {
    return {
      success: false,
      leads: [],
      totalRows: grid.length,
      validCount: 0,
      errorCount: grid.length,
      duplicatesCount: 0,
      medicalCount: 0,
      warnings: ['CSV harus memiliki minimal 1 baris header dan 1 baris data.']
    };
  }

  const headerRow = grid[0];
  const dataRows = grid.slice(1);

  // Pemetaan kolom fleksibel
  const colName = findColumnIndex(headerRow, ['namabisnis', 'namatoko', 'namausaha', 'nama', 'name', 'businessname', 'title', 'place']);
  const colCategory = findColumnIndex(headerRow, ['kategori', 'kategoribisnis', 'category', 'type', 'jenisusaha', 'tipe', 'sektor']);
  const colRating = findColumnIndex(headerRow, ['rating', 'skor', 'bintang', 'score', 'rate']);
  const colReviews = findColumnIndex(headerRow, ['jumlahulasan', 'ulasan', 'reviews', 'reviewcount', 'review', 'totalreview', 'ratingscount']);
  const colAddress = findColumnIndex(headerRow, ['alamatlengkap', 'alamat', 'address', 'lokasi', 'location', 'formattedaddress']);
  const colPhone = findColumnIndex(headerRow, ['nomortelepon', 'nomorhp', 'telepon', 'phone', 'notelp', 'nohp', 'whatsapp', 'wa', 'mobile', 'kontak']);
  const colStatus = findColumnIndex(headerRow, ['statuswebsite', 'statusweb', 'status', 'website status']);
  const colWebsite = findColumnIndex(headerRow, ['urlwebsite', 'website', 'websiteterdeteksi', 'situs', 'web']);
  const colNote = findColumnIndex(headerRow, ['catatan', 'analisisdomain', 'catatananalisis', 'note', 'notes', 'keterangan']);
  const colMaps = findColumnIndex(headerRow, ['urlgooglemaps', 'linkgooglemaps', 'googlemaps', 'mapsurl', 'mapslink', 'maps', 'linkmaps', 'urlmaps', 'url', 'link']);

  // Validasi kolom minimal: minimal ada Nama
  if (colName === -1 && headerRow.length < 2) {
    warnings.push('Header kolom Nama Bisnis tidak terdeteksi otomatis, menggunakan kolom pertama sebagai nama.');
  }

  const targetColName = colName !== -1 ? colName : 0;
  const leads: BusinessLead[] = [];
  const seenMapsUrl = new Set<string>();
  const seenNameAndPhone = new Set<string>();
  let duplicatesCount = 0;
  let medicalCount = 0;

  dataRows.forEach((row, index) => {
    // Lewati baris yang kosong semua
    if (!row.some(cell => cell.trim().length > 0)) return;

    const name = (row[targetColName] || '').trim();
    if (!name) {
      warnings.push(`Baris ke-${index + 2}: Nama bisnis kosong, baris dilewati.`);
      return;
    }

    const category = colCategory !== -1 ? (row[colCategory] || '').trim() : (row[1] || 'Bisnis Lokal');
    const ratingRaw = colRating !== -1 ? row[colRating] : '0';
    const rating = parseFloat(String(ratingRaw).replace(',', '.')) || 0;
    const reviewsRaw = colReviews !== -1 ? row[colReviews] : '0';
    const reviewCount = parseInt(String(reviewsRaw).replace(/[^0-9]/g, ''), 10) || 0;
    const address = colAddress !== -1 ? (row[colAddress] || '').trim() : (row[4] || '-');
    const phone = colPhone !== -1 ? (row[colPhone] || '').trim() : (row[5] || '-');
    const websiteStatusText = colStatus !== -1 ? (row[colStatus] || '').toLowerCase() : '';
    const detectedWebsite = colWebsite !== -1 ? (row[colWebsite] || '').trim() : '';
    const websiteNote = colNote !== -1 ? (row[colNote] || '').trim() : '';
    const mapsUrl = colMaps !== -1 && row[colMaps] ? row[colMaps].trim() : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;

    // Cek duplikasi
    const namePhoneKey = `${name.toLowerCase()}_${phone.replace(/[^0-9]/g, '')}`;
    if (seenMapsUrl.has(mapsUrl) || (phone.length > 5 && seenNameAndPhone.has(namePhoneKey))) {
      duplicatesCount++;
      return; // Lewati duplikat
    }

    seenMapsUrl.add(mapsUrl);
    if (phone.length > 5) seenNameAndPhone.add(namePhoneKey);

    const hasOfficialWebsite = 
      websiteStatusText.includes('punya') || 
      websiteStatusText.includes('resmi') || 
      websiteStatusText.includes('official') ||
      (detectedWebsite.length > 3 && !detectedWebsite.includes('instagram') && !detectedWebsite.includes('facebook') && !detectedWebsite.includes('shopee') && !detectedWebsite.includes('tokopedia'));

    const isMedical = isMedicalCategoryOrName(name, category);
    if (isMedical) medicalCount++;

    const lead: BusinessLead = {
      id: `imported-lead-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      category: category || 'Bisnis Lokal',
      rating,
      reviewCount,
      address: address || '-',
      phone: phone || '-',
      mapsUrl,
      hasOfficialWebsite,
      websiteStatus: hasOfficialWebsite ? 'HAS_OFFICIAL_WEBSITE' : 'NO_WEBSITE',
      detectedWebsite: detectedWebsite || undefined,
      websiteNote: websiteNote || undefined,
      contactStatus: 'new',
      isMedicalLead: isMedical,
      importedAt: new Date().toISOString()
    };

    leads.push(lead);
  });

  return {
    success: leads.length > 0,
    leads,
    totalRows: dataRows.length,
    validCount: leads.length,
    errorCount: dataRows.length - leads.length - duplicatesCount,
    duplicatesCount,
    medicalCount,
    warnings
  };
}
