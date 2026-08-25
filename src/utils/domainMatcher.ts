/**
 * Domain Matcher & Official Website Validator
 * Memvalidasi apakah sebuah tautan merupakan website resmi dengan domain atas nama toko/bisnis,
 * atau sekadar link pihak ketiga (sosmed, marketplace, agregator, booking, atau domain acak tidak sesuai nama toko).
 */

export const EXCLUDED_PLATFORM_DOMAINS = [
  'google.com',
  'google.co.id',
  'maps.google',
  'sites.google.com',
  'business.site',
  'facebook.com',
  'fb.me',
  'fb.com',
  'instagram.com',
  'ig.me',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'wa.me',
  'wa.link',
  'api.whatsapp.com',
  'whatsapp.com',
  'tokopedia.com',
  'shopee.co.id',
  'shopee.com',
  'bukalapak.com',
  'lazada.co.id',
  'blibli.com',
  'zalora.co.id',
  'olx.co.id',
  'traveloka.com',
  'tiket.com',
  'agoda.com',
  'booking.com',
  'pegipegi.com',
  'grab.com',
  'gojek.com',
  'food.grab',
  'gofood.link',
  'shopeefood',
  'tripadvisor.',
  'zomato.com',
  'qraved.com',
  'pergikuliner.com',
  'linktr.ee',
  'linktree.com',
  'bio.link',
  'campsite.bio',
  'heylink.me',
  'msha.ke',
  'desty.page',
  'lynk.id',
  'bit.ly',
  's.id',
  'tinyurl.com',
  'yellowpages.co.id',
  'kompass.com',
  'indonetwork.co.id',
  'blogspot.com',
  'wordpress.com',
  'wixsite.com'
];

// Stopwords umum dalam nama bisnis lokal yang diabaikan saat pencocokan kata kunci
const GENERIC_STOPWORDS = new Set([
  'pt', 'cv', 'ud', 'toko', 'shop', 'store', 'bengkel', 'klinik', 'clinic', 'dental',
  'restoran', 'restaurant', 'resto', 'warung', 'kedai', 'depot', 'cafe', 'kafe', 'kopi', 'coffee',
  'salon', 'spa', 'barbershop', 'praktek', 'praktik', 'dokter', 'official', 'indonesia', 'indo',
  'jaya', 'berkah', 'makmur', 'abadi', 'sentosa', 'utama', 'sejahtera', 'sukses', 'prima',
  'jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 'jogja', 'yogyakarta', 'bali', 'denpasar',
  'barat', 'timur', 'utara', 'selatan', 'pusat', 'cabang', 'raya', 'street', 'road'
]);

export interface WebsiteAnalysisResult {
  isOfficialWebsite: boolean;
  websiteUrl: string;
  domain: string;
  reason: string;
  matchedKeyword?: string;
}

/**
 * Ekstraksi core domain dari URL (tanpa www, protocol, dan TLD standar)
 */
export function extractCoreDomain(url: string): { hostname: string; coreName: string } {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    
    // Hapus ekstensi domain standar (.co.id, .com, .id, .net, .org, .info, .biz, .shop, dll)
    const coreName = hostname
      .replace(/\.(co\.id|ac\.id|go\.id|or\.id|biz\.id|web\.id|my\.id)$/i, '')
      .replace(/\.(com|id|net|org|biz|info|io|tech|app|shop|site|online|store|agency|co)$/i, '')
      .replace(/[^a-z0-9]/g, '');

    return { hostname, coreName };
  } catch {
    const rawClean = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const firstPart = rawClean.split('/')[0].split('.')[0].replace(/[^a-z0-9]/g, '');
    return { hostname: rawClean.split('/')[0], coreName: firstPart };
  }
}

/**
 * Ekstraksi kata kunci penting dari nama toko/bisnis
 */
export function extractBusinessKeywords(businessName: string): string[] {
  const cleaned = businessName
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length >= 2);
  
  // Ambil kata-kata unik yang bukan stopwords generic, atau ambil semua jika semuanya stopword
  const significantWords = words.filter(w => !GENERIC_STOPWORDS.has(w) && w.length >= 3);
  
  // Buat juga gabungan slug nama (misal "Auto2000 Cilandak" -> "auto2000cilandak", "auto2000")
  const fullSlug = words.join('');
  const significantSlug = significantWords.join('');

  const candidates = Array.from(new Set([
    ...significantWords,
    ...words.filter(w => w.length >= 4),
    significantSlug,
    fullSlug
  ])).filter(Boolean);

  return candidates;
}

/**
 * Validasi apakah URL website merupakan website resmi dengan domain atas nama toko
 */
export function validateOfficialWebsite(
  rawUrl: string | undefined | null,
  businessName: string
): WebsiteAnalysisResult {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isOfficialWebsite: false,
      websiteUrl: '',
      domain: '',
      reason: 'Tidak ada link website yang ditemukan pada profil Google Maps'
    };
  }

  const url = rawUrl.trim();
  const lowerUrl = url.toLowerCase();

  // 1. Cek apakah link merupakan platform pihak ketiga / medsos / marketplace / aggregator
  for (const excluded of EXCLUDED_PLATFORM_DOMAINS) {
    if (lowerUrl.includes(excluded)) {
      return {
        isOfficialWebsite: false,
        websiteUrl: url,
        domain: excluded,
        reason: `Bukan website resmi (Link ${excluded} / media sosial / marketplace pihak ketiga)`
      };
    }
  }

  const { hostname, coreName } = extractCoreDomain(url);
  if (!coreName || coreName.length < 2) {
    return {
      isOfficialWebsite: false,
      websiteUrl: url,
      domain: hostname,
      reason: 'Domain tidak valid'
    };
  }

  // 2. Ekstraksi kata kunci nama bisnis
  const keywords = extractBusinessKeywords(businessName);
  
  // 3. Pencocokan apakah domain mengandung nama toko / brand
  let isMatch = false;
  let matchedKeyword = '';

  for (const kw of keywords) {
    if (kw.length >= 3 && (coreName.includes(kw) || kw.includes(coreName))) {
      isMatch = true;
      matchedKeyword = kw;
      break;
    }
  }

  // Fallback: Jika coreName mengandung minimal 4 karakter dari nama toko
  if (!isMatch) {
    const compactBizName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (compactBizName.includes(coreName) && coreName.length >= 4) {
      isMatch = true;
      matchedKeyword = coreName;
    }
  }

  if (isMatch) {
    return {
      isOfficialWebsite: true,
      websiteUrl: url,
      domain: hostname,
      reason: `Website Resmi Terverifikasi: Domain "${hostname}" sesuai dengan nama bisnis (${matchedKeyword})`,
      matchedKeyword
    };
  } else {
    return {
      isOfficialWebsite: false,
      websiteUrl: url,
      domain: hostname,
      reason: `Domain "${hostname}" tidak sesuai dengan nama toko "${businessName}" (Bukan website resmi toko)`
    };
  }
}
