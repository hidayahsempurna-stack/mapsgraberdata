import { BusinessLead, WhatsAppTemplate, OutreachType } from '../types';
import { safeStorage } from './storage';

export const DEFAULT_WA_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl_website_standard',
    name: 'Penawaran Website Bisnis Lokal (Standar & Elegan)',
    type: 'website',
    description: 'Pesan penawaran website profesional & company profile untuk aneka usaha lokal',
    template: `Halo {name}, salam kenal.\n\nSaya melihat profil bisnis Anda di Google Maps ({category}) dengan reputasi dan rating yang sangat bagus ({rating_text}).\n\nSaya perhatikan saat ini usaha Anda belum memiliki website profil resmi. Apakah Anda tertarik memiliki website profesional untuk:\n1. Meningkatkan kepercayaan dan kredibilitas di mata pelanggan baru\n2. Muncul di peringkat teratas Google Search & Google Maps lokal\n3. Memudahkan calon pembeli melihat katalog, layanan & tombol chat WhatsApp langsung\n\nKami ada paket pembuatan website instan siap pakai (sudah termasuk domain .com/.co.id, hosting kilat, dan desain responsif HP). Apakah boleh saya kirimkan contoh portofolio & demonya?\n\nTerima kasih,\n{sender_name}`,
    isCustom: false
  },
  {
    id: 'tpl_katalog_wa',
    name: 'Penawaran Website Katalog Produk & Toko Online',
    type: 'katalog_wa',
    description: 'Cocok untuk Toko Retail, Butik, Toko Kue/Oleh-oleh, Fashion, Toko Bangunan, Distributor',
    template: `Halo Tim {name},\n\nSemoga bisnis {category} Anda semakin lancar.\n\nKami perhatikan {name} memiliki banyak ulasan positif di Google Maps ({rating_text}). Agar pelanggan semakin mudah memesan produk tanpa antre atau tanya bolak-balik, kami menyediakan pembuatan Website Katalog Digital / Toko Online yang terintegrasi langsung ke WhatsApp Kasir/Admin Anda.\n\nFitur Website:\n✓ Katalog Produk Rapi & Foto HD\n✓ Tombol "Order via WhatsApp" otomatis menyusun rincian pesanan\n✓ Tampil cepat & ringan di smartphone pelanggan\n✓ Siap pakai dalam 3 hari kerja\n\nBoleh kami kirimkan contoh tampilan website katalog yang cocok untuk {name}?\n\nSalam sukses,\n{sender_name}`,
    isCustom: false
  },
  {
    id: 'tpl_booking_jasa',
    name: 'Penawaran Website Jasa, Servis & Booking Online',
    type: 'booking_jasa',
    description: 'Cocok untuk Bengkel, Salon & Barbershop, Servis AC, Kontraktor, Cuci Mobil/Motor, Interior',
    template: `Selamat siang {name},\n\nSalam kenal, saya {sender_name}. Saya menemukan usaha {category} Anda melalui Google Maps di area sekitar.\n\nBanyak pelanggan saat ini mencari jasa profesional lewat Google dan lebih percaya pada usaha yang memiliki website resmi portofolio dan jadwal booking online.\n\nKami siap membantu membuatkan Website Profil & Booking Layanan untuk {name} lengkap dengan:\n✓ Daftar Paket Layanan & Pricelist Transparan\n✓ Formulir Booking Jadwal / Reservasi langsung ke WhatsApp\n✓ Galeri Foto Hasil Pengerjaan / Portofolio Proyek\n✓ Integrasi Peta Google Maps & Tombol Telepon Darurat/Konsultasi\n\nApakah berkenan jika kami kirimkan preview desain website untuk usaha Anda?\n\nTerima kasih atas waktunya.`,
    isCustom: false
  },
  {
    id: 'tpl_resto_menu',
    name: 'Penawaran Website Resto, Cafe & Menu Digital QR',
    type: 'resto_menu',
    description: 'Cocok untuk Restoran, Cafe, Warung Modern, Rumah Makan, Katering',
    template: `Halo Manajemen {name},\n\nSalam kenal dari {sender_name}.\n\nKami melihat kuliner {category} Anda di Google Maps sangat diminati ({rating_text}). Kami ingin menawarkan pembuatan Website Profil Resto & Buku Menu Digital interaktif yang bisa diakses via Google Maps ataupun Scan QR di meja.\n\nKeunggulan:\n✓ Menu Makanan & Minuman dengan Foto Menarik & Harga Up-to-date\n✓ Pelanggan bisa langsung Reservasi Meja / Pesan Katering via WhatsApp\n✓ Hemat biaya cetak buku menu fisik\n✓ Terhubung ke Google Maps untuk navigasi rute ke resto\n\nBoleh kami buatkan demo preview menu digital untuk {name} secara gratis?\n\nSalam hangat,\n{sender_name}`,
    isCustom: false
  },
  {
    id: 'tpl_website_promo',
    name: 'Penawaran Website Kilat (Promo Khusus)',
    type: 'website',
    description: 'Pendekatan promosi cepat dengan penawaran gratis konsultasi/diskon',
    template: `Selamat siang {name},\n\nSemoga bisnis {category} Anda semakin sukses. Kami dari tim web developer sedang ada penawaran khusus pembuatan website kilat (3-5 hari jadi) untuk pelaku usaha lokal di area Anda.\n\nWebsite akan dilengkapi tombol chat WA langsung, peta lokasi terhubung Google Maps, dan desain elegan ramah HP. Sangat cocok untuk mengonversi pengunjung Google Maps menjadi pelanggan setia.\n\nBoleh kami kirimkan beberapa contoh desain website yang cocok untuk {name}?\n\nSalam,\n{sender_name}`,
    isCustom: false
  },
  {
    id: 'tpl_rekam_medis_rme',
    name: 'Penawaran Aplikasi Rekam Medis (RME & SIMKlinik)',
    type: 'rekam_medis',
    description: 'Penawaran Software Rekam Medis Elektronik Terintegrasi SATUSEHAT untuk Klinik / Faskes / Dokter',
    template: `Yth. Manajemen / Pimpinan {name},\n\nPerkenalkan saya {sender_name}. Kami menyediakan Aplikasi Rekam Medis Elektronik (RME / SIMKlinik) modern yang siap pakai & telah disesuaikan dengan regulasi Kemenkes (Bridging SATUSEHAT & BPJS).\n\nFitur unggulan sistem kami:\n✓ Rekam Medis Digital Lengkap (SOAP, ICD-10/ICD-9-CM)\n✓ Pendaftaran Pasien & Antrean Online via WhatsApp\n✓ Modul Farmasi / Apotek, Stok Obat & Kasir/Billing\n✓ Laporan Pendapatan & Kunjungan Real-time\n✓ Akses Fleksibel (Cloud Web, Tanpa Install Server Rumit)\n\nApakah kami dapat menjadwalkan Presentasi & Demo Gratis secara online/offline untuk faskes {name} minggu ini?\n\nTerima kasih atas perhatian dan waktunya.`,
    isCustom: false
  }
];

const TEMPLATES_STORAGE_KEY = 'gmaps_wa_templates_v2';

/**
 * Mengambil daftar template WhatsApp dari storage atau default
 */
export function getSavedWhatsAppTemplates(): WhatsAppTemplate[] {
  try {
    const raw = safeStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return DEFAULT_WA_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_WA_TEMPLATES;
  } catch {
    return DEFAULT_WA_TEMPLATES;
  }
}

/**
 * Menyimpan daftar template WhatsApp
 */
export function saveWhatsAppTemplates(templates: WhatsAppTemplate[]): void {
  try {
    safeStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates', e);
  }
}

/**
 * Reset template ke bawaan
 */
export function resetWhatsAppTemplates(): WhatsAppTemplate[] {
  saveWhatsAppTemplates(DEFAULT_WA_TEMPLATES);
  return DEFAULT_WA_TEMPLATES;
}

/**
 * Ekstraksi nama kota dari alamat Indonesia
 */
export function extractCityFromAddress(address: string = ''): string {
  if (!address || address === '-') return 'Kota Tidak Diketahui';

  const clean = address.trim();

  // Pattern pencarian Kota / Kabupaten di Indonesia
  const cityPatterns = [
    /Jakarta\s+(?:Selatan|Barat|Pusat|Timur|Utara)/i,
    /Kota\s+([A-Za-z\s]+?)(?:,|\s*\d{5}|$)/i,
    /Kabupaten\s+([A-Za-z\s]+?)(?:,|\s*\d{5}|$)/i,
    /Kab\.\s*([A-Za-z\s]+?)(?:,|\s*\d{5}|$)/i,
    /\b(Jakarta|Bandung|Surabaya|Medan|Semarang|Makassar|Palembang|Tangerang|Depok|Bekasi|Bogor|Yogyakarta|Jogja|Malang|Solo|Surakarta|Denpasar|Batam|Pekanbaru|Bandar Lampung|Padang|Pontianak|Banjarmasin|Manado|Balikpapan|Samarinda|Cimahi|Cirebon|Serang|Tangerang Selatan|Tasikmalaya|Sukabumi|Magelang|Salatiga|Pekalongan|Tegal|Kediri|Blitar|Madiun|Probolinggo|Pasuruan|Batu|Mataram|Kupang|Ambon|Jayapura)\b/i
  ];

  for (const pattern of cityPatterns) {
    const match = clean.match(pattern);
    if (match) {
      const cityFound = match[0].trim();
      // Format capitalization
      return cityFound
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Fallback: ambil segmen kedua terakhir jika dipisah koma
  const parts = clean.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    if (candidate.length > 2 && candidate.length < 30 && !/\d/.test(candidate)) {
      return candidate;
    }
  }

  return 'Lainnya';
}

/**
 * Deteksi apakah sebuah bisnis berkemungkinan merupakan fasilitas kesehatan atau medis
 */
export function isMedicalCategoryOrName(name: string = '', category: string = ''): boolean {
  const text = `${name} ${category}`.toLowerCase();
  const medicalKeywords = [
    'klinik', 'clinic', 'dokter', 'doctor', 'dr.', 'drg.', 'drg', 'dr ', 'drsp',
    'rekam medis', 'medis', 'medika', 'medical', 'hospital', 'rumah sakit', 'rs ', 'rsia', 'rsu',
    'puskesmas', 'apotek', 'apotik', 'pharmacy', 'farmasi', 'laboratorium', 'lab ', 'diagnostik',
    'fisioterapi', 'bidan', 'kebidanan', 'praktek dokter', 'praktik dokter', 'gigi', 'dental',
    'optik', 'spesialis', 'terapi', 'akupunktur', 'estetika', 'beauty clinic', 'klinik kecantikan',
    'hewan', 'vet', 'animal clinic'
  ];

  return medicalKeywords.some(keyword => text.includes(keyword));
}

/**
 * Format nomor telepon Indonesia menjadi format internasional WhatsApp (628xxx)
 */
/**
  * Membersihkan dan memformat nomor telepon agar sesuai format WhatsApp internasional (cth: 62812xxx)
  */
export function normalizeWhatsAppNumber(phone: string): {
  valid: boolean;
  formatted: string;
  raw: string;
} {
  return cleanPhoneNumberForWhatsApp(phone);
}

export function cleanPhoneNumberForWhatsApp(phone: string): { valid: boolean; formatted: string; raw: string } {
  if (!phone || phone === '-' || phone.trim() === '') {
    return { valid: false, formatted: '', raw: phone || '' };
  }

  // Hapus semua karakter non-angka kecuali tanda +
  let cleaned = phone.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Jika berawalan 0, ubah ke 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    // Jika nomor lokal Indonesia tanpa 0 (misal 812xxxx)
    if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
  }

  // Nomor valid biasanya minimal 9-15 digit
  const isValid = cleaned.length >= 9 && cleaned.length <= 16 && cleaned.startsWith('62');

  return {
    valid: isValid,
    formatted: cleaned,
    raw: phone
  };
}

/**
 * Render template teks dengan variabel prospek
 */
export function renderWhatsAppMessage(
  templateText: string,
  lead: BusinessLead,
  senderName: string = 'Tim Konsultan Digital'
): string {
  const businessName = lead.name || 'Bapak/Ibu Pemilik Usaha';
  const categoryName = lead.category || 'Bisnis';
  const addressText = lead.address || '';
  const cityText = lead.city || extractCityFromAddress(lead.address) || '';
  const ratingText = lead.rating ? `Rating ${lead.rating} ★ (${lead.reviewCount || 0} ulasan)` : 'reputasi terpercaya';
  const phoneText = lead.phone || '-';

  return templateText
    .replace(/{name}/g, businessName)
    .replace(/{category}/g, categoryName)
    .replace(/{address}/g, addressText)
    .replace(/{city}/g, cityText)
    .replace(/{rating}/g, String(lead.rating || '0'))
    .replace(/{rating_text}/g, ratingText)
    .replace(/{reviews}/g, String(lead.reviewCount || '0'))
    .replace(/{phone}/g, phoneText)
    .replace(/{sender_name}/g, senderName || 'Tim Konsultan Digital');
}

/**
 * Bangun URL link langsung ke WhatsApp
 */
export function createWhatsAppDirectUrl(phone: string, message: string): string {
  const phoneObj = cleanPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  
  if (!phoneObj.valid) {
    // Fallback URL jika nomor belum terformat
    return `https://wa.me/?text=${encodedText}`;
  }

  return `https://wa.me/${phoneObj.formatted}?text=${encodedText}`;
}
