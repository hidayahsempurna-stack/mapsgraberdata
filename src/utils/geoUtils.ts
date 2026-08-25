import { BusinessLead } from '../types';

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  isApproximate?: boolean;
}

// Known city centroids in Indonesia & common regions
export const KNOWN_CITY_CENTROIDS: Record<string, { lat: number; lng: number; label: string }> = {
  jakarta: { lat: -6.2088, lng: 106.8456, label: 'DKI Jakarta' },
  'jakarta selatan': { lat: -6.2615, lng: 106.8106, label: 'Jakarta Selatan' },
  'jakarta pusat': { lat: -6.1805, lng: 106.8284, label: 'Jakarta Pusat' },
  'jakarta barat': { lat: -6.1683, lng: 106.7588, label: 'Jakarta Barat' },
  'jakarta timur': { lat: -6.2250, lng: 106.9004, label: 'Jakarta Timur' },
  'jakarta utara': { lat: -6.1384, lng: 106.8640, label: 'Jakarta Utara' },
  surabaya: { lat: -7.2575, lng: 112.7521, label: 'Surabaya' },
  bandung: { lat: -6.9175, lng: 107.6191, label: 'Bandung' },
  semarang: { lat: -6.9667, lng: 110.4167, label: 'Semarang' },
  yogyakarta: { lat: -7.7956, lng: 110.3695, label: 'DI Yogyakarta' },
  jogja: { lat: -7.7956, lng: 110.3695, label: 'DI Yogyakarta' },
  medan: { lat: 3.5952, lng: 98.6722, label: 'Medan' },
  tangerang: { lat: -6.1783, lng: 106.6319, label: 'Tangerang' },
  'tangerang selatan': { lat: -6.2888, lng: 106.7179, label: 'Tangerang Selatan' },
  tangsel: { lat: -6.2888, lng: 106.7179, label: 'Tangerang Selatan' },
  bekasi: { lat: -6.2383, lng: 106.9756, label: 'Bekasi' },
  depok: { lat: -6.4025, lng: 106.7942, label: 'Depok' },
  bogor: { lat: -6.5971, lng: 106.8060, label: 'Bogor' },
  malang: { lat: -7.9666, lng: 112.6326, label: 'Malang' },
  bali: { lat: -8.4095, lng: 115.1889, label: 'Bali' },
  denpasar: { lat: -8.6705, lng: 115.2126, label: 'Denpasar' },
  makassar: { lat: -5.1477, lng: 119.4327, label: 'Makassar' },
  palembang: { lat: -2.9761, lng: 104.7754, label: 'Palembang' },
  solo: { lat: -7.5755, lng: 110.8243, label: 'Surakarta (Solo)' },
  surakarta: { lat: -7.5755, lng: 110.8243, label: 'Surakarta (Solo)' },
  batam: { lat: 1.1301, lng: 104.0529, label: 'Batam' },
  pekanbaru: { lat: 0.5071, lng: 101.4478, label: 'Pekanbaru' },
  'bandar lampung': { lat: -5.4500, lng: 105.2667, label: 'Bandar Lampung' },
  lampung: { lat: -5.4500, lng: 105.2667, label: 'Lampung' },
  padang: { lat: -0.9471, lng: 100.4172, label: 'Padang' },
  pontianak: { lat: -0.0263, lng: 109.3425, label: 'Pontianak' },
  banjarmasin: { lat: -3.3194, lng: 114.5908, label: 'Banjarmasin' },
  samarinda: { lat: -0.5022, lng: 117.1536, label: 'Samarinda' },
  balikpapan: { lat: -1.2379, lng: 116.8289, label: 'Balikpapan' },
  manado: { lat: 1.4748, lng: 124.8421, label: 'Manado' },
  cirebon: { lat: -6.7320, lng: 108.5523, label: 'Cirebon' },
  tasikmalaya: { lat: -7.3274, lng: 108.2207, label: 'Tasikmalaya' },
  sukabumi: { lat: -6.9277, lng: 106.9300, label: 'Sukabumi' },
  serang: { lat: -6.1104, lng: 106.1639, label: 'Serang' },
  cilegon: { lat: -6.0023, lng: 106.0125, label: 'Cilegon' }
};

/**
 * Deterministic hash to generate pseudo-random tiny offsets so pins in the same city spread slightly
 */
function hashStringToOffsets(str: string): { latOffset: number; lngOffset: number } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  const y = Math.cos(hash) * 10000;
  const latOffset = ((x - Math.floor(x)) - 0.5) * 0.035; // ~2-3 km max spread
  const lngOffset = ((y - Math.floor(y)) - 0.5) * 0.035;
  return { latOffset, lngOffset };
}

/**
 * Resolve lead latitude and longitude coordinates accurately
 */
export function resolveLeadGeoLocation(lead: BusinessLead): GeoLocation {
  // 1. Direct coordinates
  if (typeof lead.lat === 'number' && typeof lead.lng === 'number' && !isNaN(lead.lat) && !isNaN(lead.lng)) {
    return {
      lat: lead.lat,
      lng: lead.lng,
      city: lead.city || 'Lokasi Terpetakan',
      isApproximate: false
    };
  }

  // 2. Try parsing from address or city
  const searchCorpus = `${lead.city || ''} ${lead.address || ''} ${lead.name || ''}`.toLowerCase();
  
  for (const [key, centroid] of Object.entries(KNOWN_CITY_CENTROIDS)) {
    if (searchCorpus.includes(key)) {
      const { latOffset, lngOffset } = hashStringToOffsets(lead.id + lead.name + (lead.address || ''));
      return {
        lat: +(centroid.lat + latOffset).toFixed(5),
        lng: +(centroid.lng + lngOffset).toFixed(5),
        city: centroid.label,
        isApproximate: true
      };
    }
  }

  // 3. Fallback to default Jakarta centroid with slight offset based on lead id
  const defaultCenter = KNOWN_CITY_CENTROIDS['jakarta'];
  const { latOffset, lngOffset } = hashStringToOffsets(lead.id + lead.name);
  return {
    lat: +(defaultCenter.lat + latOffset).toFixed(5),
    lng: +(defaultCenter.lng + lngOffset).toFixed(5),
    city: 'Area Metropolitan',
    isApproximate: true
  };
}

export interface CitySummary {
  city: string;
  count: number;
  noWebsiteCount: number;
  hasWebsiteCount: number;
  lat: number;
  lng: number;
}

/**
 * Summarize leads distribution across cities
 */
export function summarizeLeadsByCity(leads: BusinessLead[]): CitySummary[] {
  const cityMap = new Map<string, CitySummary>();

  for (const lead of leads) {
    const geo = resolveLeadGeoLocation(lead);
    const cityName = geo.city;
    const existing = cityMap.get(cityName);

    const isNoWeb = !lead.hasOfficialWebsite;

    if (existing) {
      existing.count += 1;
      if (isNoWeb) {
        existing.noWebsiteCount += 1;
      } else {
        existing.hasWebsiteCount += 1;
      }
    } else {
      cityMap.set(cityName, {
        city: cityName,
        count: 1,
        noWebsiteCount: isNoWeb ? 1 : 0,
        hasWebsiteCount: isNoWeb ? 0 : 1,
        lat: geo.lat,
        lng: geo.lng
      });
    }
  }

  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
}
