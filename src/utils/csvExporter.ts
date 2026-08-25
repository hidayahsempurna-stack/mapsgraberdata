import { BusinessLead } from '../types';

export interface CSVExportOptions {
  filterMode?: 'all' | 'no_website_only' | 'with_website_only';
  customFilename?: string;
}

/**
 * Ekspor data hasil scrape ke format CSV dengan opsi semua data atau filter tertentu
 */
export function exportLeadsToCSV(leads: BusinessLead[], options: CSVExportOptions = {}): void {
  const { filterMode = 'all', customFilename } = options;

  if (!leads || leads.length === 0) {
    throw new Error('Tidak ada data prospek untuk diekspor.');
  }

  // Terapkan filter berdasarkan mode ekspor
  let exportData = leads;
  if (filterMode === 'no_website_only') {
    exportData = leads.filter(item => !item.hasOfficialWebsite);
    if (exportData.length === 0) {
      throw new Error('Tidak ada data bisnis tanpa website dalam daftar.');
    }
  } else if (filterMode === 'with_website_only') {
    exportData = leads.filter(item => item.hasOfficialWebsite);
    if (exportData.length === 0) {
      throw new Error('Tidak ada data bisnis yang memiliki website dalam daftar.');
    }
  }

  // Format Kolom CSV Komprehensif
  const headers = [
    'Nama Bisnis',
    'Kategori',
    'Rating',
    'Jumlah Ulasan',
    'Alamat Lengkap',
    'Nomor Telepon',
    'Status Website',
    'URL Website Terdeteksi',
    'Catatan / Analisis Domain',
    'URL Google Maps'
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = exportData.map(lead => {
    const statusLabel = lead.hasOfficialWebsite 
      ? 'Punya Website Resmi Toko' 
      : (lead.detectedWebsite ? 'Tanpa Web Resmi (Link Medsos/Marketplace)' : 'Belum Memiliki Website');

    return [
      escapeCSV(lead.name || '-'),
      escapeCSV(lead.category || '-'),
      escapeCSV(lead.rating || '0'),
      escapeCSV(lead.reviewCount || '0'),
      escapeCSV(lead.address || '-'),
      escapeCSV(lead.phone || '-'),
      escapeCSV(statusLabel),
      escapeCSV(lead.detectedWebsite || '-'),
      escapeCSV(lead.websiteNote || '-'),
      escapeCSV(lead.mapsUrl || '-')
    ].join(',');
  });

  // Tambahkan UTF-8 Byte Order Mark (\uFEFF) untuk kompatibilitas otomatis di Excel & Google Sheets
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const defaultPrefix = filterMode === 'no_website_only' 
    ? 'gmaps_leads_tanpa_website' 
    : (filterMode === 'with_website_only' ? 'gmaps_leads_punya_website' : 'gmaps_semua_hasil_scrape');

  const filename = customFilename || `${defaultPrefix}_${timestamp}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
