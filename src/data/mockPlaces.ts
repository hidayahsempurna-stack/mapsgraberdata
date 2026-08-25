export interface MockPlaceItem {
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  mapsUrl: string;
  hasOfficialWebsite: boolean;
  detectedWebsite?: string;
  websiteNote?: string;
}

export const SAMPLE_DATASETS: Record<string, { query: string; location: string; items: MockPlaceItem[] }> = {
  jakarta_bengkel: {
    query: 'Bengkel Mobil di Jakarta Selatan',
    location: 'Jakarta Selatan',
    items: [
      {
        name: 'Bengkel Mobil Berkah Motor',
        category: 'Bengkel Mobil',
        rating: 4.8,
        reviewCount: 142,
        address: 'Jl. Fatmawati No. 45, Cilandak, Jakarta Selatan',
        phone: '0812-8923-4412',
        mapsUrl: 'https://maps.google.com/?cid=102938481231',
        hasOfficialWebsite: false,
        detectedWebsite: '',
        websiteNote: 'Tidak ada website yang terdaftar di profil Google Maps'
      },
      {
        name: 'Auto2000 Cilandak',
        category: 'Dealer & Bengkel Resmi Toyota',
        rating: 4.9,
        reviewCount: 1890,
        address: 'Jl. TB Simatupang No. 12, Jakarta Selatan',
        phone: '021-7502000',
        mapsUrl: 'https://maps.google.com/?cid=203948123912',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://auto2000.co.id',
        websiteNote: 'Domain auto2000.co.id sesuai dengan nama bisnis Auto2000'
      },
      {
        name: 'Sinaria Auto Service & AC',
        category: 'Bengkel Perbaikan AC Mobil',
        rating: 4.6,
        reviewCount: 88,
        address: 'Jl. Radio Dalam Raya No. 18, Kebayoran Baru, Jakarta Selatan',
        phone: '0857-1122-3344',
        mapsUrl: 'https://maps.google.com/?cid=304958192384',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://instagram.com/sinaria_autoservice',
        websiteNote: 'Hanya memiliki akun Instagram, belum memiliki website toko resmi mandiri'
      },
      {
        name: 'Shop & Drive Ampera',
        category: 'Toko Aki & Oli Mobil',
        rating: 4.7,
        reviewCount: 420,
        address: 'Jl. Ampera Raya No. 99, Pasar Minggu, Jakarta Selatan',
        phone: '021-7889123',
        mapsUrl: 'https://maps.google.com/?cid=405968192381',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://shopanddrive.com',
        websiteNote: 'Domain shopanddrive.com sesuai dengan nama bisnis Shop & Drive'
      },
      {
        name: 'Garasi Jaya Kustom & Cat Oven',
        category: 'Bengkel Body Repair',
        rating: 4.9,
        reviewCount: 65,
        address: 'Jl. Moh. Kahfi 1 No. 50, Jagakarsa, Jakarta Selatan',
        phone: '0813-9876-5432',
        mapsUrl: 'https://maps.google.com/?cid=506978192382',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://wa.me/6281398765432',
        websiteNote: 'Hanya menyertakan link WhatsApp Chat, belum ada website profil resmi'
      },
      {
        name: 'Prima Dinamo & Kelistrikan Mobil',
        category: 'Bengkel Dinamo',
        rating: 4.5,
        reviewCount: 37,
        address: 'Jl. Lenteng Agung Timur No. 14, Jagakarsa, Jakarta Selatan',
        phone: '0878-4321-0987',
        mapsUrl: 'https://maps.google.com/?cid=607988192383',
        hasOfficialWebsite: false,
        detectedWebsite: '',
        websiteNote: 'Tidak ada tautan website di Google Maps'
      },
      {
        name: 'Pitstop Speed Shop Jakarta',
        category: 'Toko Suku Cadang & Tuning Mobil',
        rating: 4.7,
        reviewCount: 210,
        address: 'Jl. Arteri Pondok Indah No. 8, Kebayoran Lama, Jakarta Selatan',
        phone: '021-7294401',
        mapsUrl: 'https://maps.google.com/?cid=708998192384',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://pitstopspeed.co.id',
        websiteNote: 'Domain pitstopspeed.co.id sesuai dengan nama toko Pitstop Speed'
      },
      {
        name: 'Pusat Shockbreaker & Kaki Kaki Barokah',
        category: 'Spesialis Kaki-Kaki Mobil',
        rating: 4.8,
        reviewCount: 115,
        address: 'Jl. Bangka Raya No. 22, Mampang Prapatan, Jakarta Selatan',
        phone: '0811-2233-9988',
        mapsUrl: 'https://maps.google.com/?cid=809908192385',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://tokopedia.com/kaki2barokah',
        websiteNote: 'Hanya link toko marketplace Tokopedia, bukan website resmi toko mandiri'
      },
      {
        name: 'Sentra Spooring Balancing Mega',
        category: 'Bengkel Roda & Ban Mobil',
        rating: 4.4,
        reviewCount: 53,
        address: 'Jl. Warung Buncit No. 71, Pancoran, Jakarta Selatan',
        phone: '0812-7788-9900',
        mapsUrl: 'https://maps.google.com/?cid=910918192386',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://facebook.com/sentraspooringmega',
        websiteNote: 'Hanya link halaman Facebook, belum memiliki website toko resmi'
      },
      {
        name: 'BOS (Bengkel Online Sejahtera) Bintaro',
        category: 'Bengkel Mobil',
        rating: 4.6,
        reviewCount: 512,
        address: 'Jl. RC Veteran Raya No. 3, Pesanggrahan, Jakarta Selatan',
        phone: '021-7388129',
        mapsUrl: 'https://maps.google.com/?cid=101928192387',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://bengkelbos.co.id',
        websiteNote: 'Domain bengkelbos.co.id sesuai dengan nama bisnis Bengkel BOS'
      }
    ]
  },
  surabaya_kuliner: {
    query: 'Restoran & Cafe di Surabaya Pusat',
    location: 'Surabaya Pusat',
    items: [
      {
        name: 'Depot Bu Rudy Dharmahusada',
        category: 'Restoran Masakan Indonesia',
        rating: 4.6,
        reviewCount: 4210,
        address: 'Jl. Dharmahusada No. 140, Surabaya',
        phone: '031-5929212',
        mapsUrl: 'https://maps.google.com/?cid=331122445566',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://burudy.com',
        websiteNote: 'Domain burudy.com sesuai dengan nama bisnis Depot Bu Rudy'
      },
      {
        name: 'Warung Nasi Bebek Sinjay Tunjungan',
        category: 'Restoran Bebek Goreng',
        rating: 4.7,
        reviewCount: 890,
        address: 'Jl. Tunjungan No. 34, Genteng, Surabaya',
        phone: '0813-3344-5566',
        mapsUrl: 'https://maps.google.com/?cid=331122445567',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://gofood.link/u/bebeksinjaytunjungan',
        websiteNote: 'Hanya link pesan makanan GoFood, belum memiliki website profil resmi'
      },
      {
        name: 'Kedai Kopi Omah Lawas',
        category: 'Kedai Kopi Tradisional',
        rating: 4.8,
        reviewCount: 230,
        address: 'Jl. Pregolan No. 9, Tegalsari, Surabaya',
        phone: '0856-7890-1234',
        mapsUrl: 'https://maps.google.com/?cid=331122445568',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://linktr.ee/omahlawas',
        websiteNote: 'Link aggregator (Linktree), belum ada website resmi mandiri'
      },
      {
        name: 'Djournal Coffee TP Surabaya',
        category: 'Kafe Modern',
        rating: 4.7,
        reviewCount: 1450,
        address: 'Tunjungan Plaza 4 Lt. UG, Surabaya',
        phone: '031-5471188',
        mapsUrl: 'https://maps.google.com/?cid=331122445569',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://ismaya.com/eat-drink/djournal-coffee',
        websiteNote: 'Website resmi brand Ismaya / Djournal Coffee'
      },
      {
        name: 'Sate Klopo Ondomohen Bu Asih',
        category: 'Restoran Sate Tradisional',
        rating: 4.7,
        reviewCount: 3100,
        address: 'Jl. Walikota Mustajab No. 36, Surabaya',
        phone: '031-5344572',
        mapsUrl: 'https://maps.google.com/?cid=331122445570',
        hasOfficialWebsite: false,
        detectedWebsite: '',
        websiteNote: 'Tidak ada website resmi di Google Maps'
      },
      {
        name: 'Catering Prasmanan Bu Joko',
        category: 'Jasa Katering Pernikahan',
        rating: 4.9,
        reviewCount: 78,
        address: 'Jl. Embong Malang No. 88, Surabaya',
        phone: '0812-4455-6677',
        mapsUrl: 'https://maps.google.com/?cid=331122445571',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://instagram.com/catering_bujoko_sby',
        websiteNote: 'Hanya memiliki akun Instagram portofolio'
      }
    ]
  },
  bandung_klinik: {
    query: 'Klinik Gigi & Kecantikan di Bandung',
    location: 'Bandung',
    items: [
      {
        name: 'Klinik Gigi Senyum Sehat Bandung',
        category: 'Klinik Dokter Gigi',
        rating: 4.9,
        reviewCount: 167,
        address: 'Jl. R.E. Martadinata (Riau) No. 72, Bandung',
        phone: '0821-1928-3746',
        mapsUrl: 'https://maps.google.com/?cid=556677889901',
        hasOfficialWebsite: false,
        detectedWebsite: '',
        websiteNote: 'Tidak ada website'
      },
      {
        name: 'FDC Dental Clinic Bandung',
        category: 'Klinik Gigi Spesialis',
        rating: 4.8,
        reviewCount: 1200,
        address: 'Jl. Ir. H. Juanda No. 115, Dago, Bandung',
        phone: '022-2501234',
        mapsUrl: 'https://maps.google.com/?cid=556677889902',
        hasOfficialWebsite: true,
        detectedWebsite: 'https://fdcdentalclinic.co.id',
        websiteNote: 'Domain fdcdentalclinic.co.id sesuai nama klinik FDC Dental Clinic'
      },
      {
        name: 'Glow Aesthetic Care Bandung',
        category: 'Klinik Perawatan Kulit & Estetika',
        rating: 4.7,
        reviewCount: 94,
        address: 'Jl. Buah Batu No. 143, Bandung',
        phone: '0813-8899-7711',
        mapsUrl: 'https://maps.google.com/?cid=556677889903',
        hasOfficialWebsite: false,
        detectedWebsite: 'https://tiktok.com/@glowaesthetic_bdg',
        websiteNote: 'Hanya link akun TikTok, bukan website klinik resmi'
      },
      {
        name: 'Praktek Mandiri Bidan Lilis',
        category: 'Klinik Bersalin & Ibu Anak',
        rating: 4.9,
        reviewCount: 82,
        address: 'Jl. Terusan Buah Batu No. 40, Bandung',
        phone: '0877-2233-4455',
        mapsUrl: 'https://maps.google.com/?cid=556677889904',
        hasOfficialWebsite: false,
        detectedWebsite: '',
        websiteNote: 'Belum memiliki website'
      }
    ]
  }
};

// Generates dynamic realistic mock business leads based on any manual niche and city
export function generateDynamicMockPlaces(niche: string, city: string, count: number = 30): MockPlaceItem[] {
  const cleanNiche = (niche || 'Bisnis & Jasa').trim();
  const cleanCity = (city || 'Indonesia').trim();

  const businessPrefixes = [
    'Berkah', 'Utama', 'Maju Jaya', 'Sentosa', 'Mandiri', 'Prima', 'Bintang', 
    'Anugerah', 'Sejahtera', 'Karya', 'Harmoni', 'Kencana', 'Gemilang', 'Lestari',
    'Mitra', 'Sinar', 'Nusantara', 'Abadi', 'Grand', 'Elite', 'Family', 'Barokah'
  ];

  const streetNames = [
    'Jl. Jenderal Sudirman', 'Jl. Ahmad Yani', 'Jl. Gatot Subroto', 'Jl. Diponegoro',
    'Jl. Gajah Mada', 'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Pemuda', 'Jl. Merdeka',
    'Jl. Raya Utama', 'Jl. Cendrawasih', 'Jl. Kemang Raya', 'Jl. Sukajadi',
    'Jl. Kaliurang', 'Jl. Basuki Rahmat', 'Jl. Urip Sumoharjo', 'Jl. Pajajaran'
  ];

  const phonePrefixes = ['0812', '0813', '0821', '0857', '0858', '0878', '0877', '0896'];

  const results: MockPlaceItem[] = [];

  for (let i = 0; i < count; i++) {
    const prefix = businessPrefixes[i % businessPrefixes.length];
    const street = streetNames[i % streetNames.length];
    const streetNum = (i * 7 + 12) % 198 + 1;
    const phonePref = phonePrefixes[i % phonePrefixes.length];
    const phonePart1 = Math.floor(1000 + Math.random() * 9000);
    const phonePart2 = Math.floor(1000 + Math.random() * 9000);
    const phone = `${phonePref}-${phonePart1}-${phonePart2}`;

    const rating = +(4.3 + (Math.random() * 0.7)).toFixed(1);
    const reviewCount = Math.floor(25 + Math.random() * 450);

    // Slug for clean domain/name
    const cleanNameSlug = `${prefix.toLowerCase().replace(/[^a-z0-9]/g, '')}${cleanNiche.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
    const businessName = `${cleanNiche} ${prefix} ${i > 10 ? `Cabang ${Math.floor(i / 5)}` : cleanCity}`;
    const address = `${street} No. ${streetNum}, ${cleanCity}`;
    const mapsUrl = `https://maps.google.com/?cid=${100000000000 + i * 99876}`;

    // Distribution:
    // ~55% No website at all (ideal prospect)
    // ~25% Third-party link (Social Media / WhatsApp / Linktree / Marketplace) -> NO OFFICIAL WEBSITE
    // ~20% Official website matching domain -> HAS OFFICIAL WEBSITE
    const distributionType = i % 10;

    let hasOfficialWebsite = false;
    let detectedWebsite = '';
    let websiteNote = 'Tidak ada tautan website yang terdaftar di profil Google Maps';

    if (distributionType === 1 || distributionType === 5) {
      // Official website
      hasOfficialWebsite = true;
      const tld = i % 2 === 0 ? 'co.id' : 'com';
      detectedWebsite = `https://${cleanNameSlug}.${tld}`;
      websiteNote = `Domain ${cleanNameSlug}.${tld} sesuai dengan nama bisnis ${businessName}`;
    } else if (distributionType === 3) {
      // Instagram
      detectedWebsite = `https://instagram.com/${cleanNameSlug}_official`;
      websiteNote = 'Hanya memiliki link profil Instagram, belum memiliki website toko resmi mandiri';
    } else if (distributionType === 7) {
      // WhatsApp link
      detectedWebsite = `https://wa.me/62${phonePref.slice(1)}${phonePart1}${phonePart2}`;
      websiteNote = 'Hanya mencantumkan link pesan instan WhatsApp, belum memiliki website portofolio resmi';
    } else if (distributionType === 9) {
      // Linktree / aggregator
      detectedWebsite = `https://linktr.ee/${cleanNameSlug}`;
      websiteNote = 'Link aggregator bio (Linktree), belum ada website resmi mandiri';
    } else {
      // No website
      detectedWebsite = '';
      websiteNote = 'Tidak ada tautan website di profil Google Maps (Prioritas Prospek Tinggi)';
    }

    results.push({
      name: businessName,
      category: cleanNiche,
      rating,
      reviewCount,
      address,
      phone,
      mapsUrl,
      hasOfficialWebsite,
      detectedWebsite,
      websiteNote
    });
  }

  return results;
}

