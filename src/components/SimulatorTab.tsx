import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Trash2, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  Search, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  MapPin,
  Phone,
  Star,
  Check,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { BusinessLead, ScraperLog, ScraperStats } from '../types';
import { SAMPLE_DATASETS, generateDynamicMockPlaces, MockPlaceItem } from '../data/mockPlaces';
import { exportLeadsToCSV } from '../utils/csvExporter';
import { validateOfficialWebsite } from '../utils/domainMatcher';
import { isMedicalCategoryOrName } from '../utils/whatsappTemplates';

interface SimulatorTabProps {
  leads: BusinessLead[];
  setLeads: React.Dispatch<React.SetStateAction<BusinessLead[]>>;
  onOpenLeadsTab: () => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  leads,
  setLeads,
  onOpenLeadsTab
}) => {
  const [manualNiche, setManualNiche] = useState<string>('Bengkel Mobil');
  const [manualCity, setManualCity] = useState<string>('Jakarta Selatan');
  const [searchUrlInput, setSearchUrlInput] = useState<string>('https://www.google.com/maps/search/Bengkel+Mobil+di+Jakarta+Selatan');
  const [urlValidationStatus, setUrlValidationStatus] = useState<{ isValid: boolean; message: string }>({
    isValid: true,
    message: 'Format URL Google Maps valid'
  });
  
  const [maxLimit, setMaxLimit] = useState<number>(10);
  const [scanSpeedMs, setScanSpeedMs] = useState<number>(850); // simulation delay
  
  const [stats, setStats] = useState<ScraperStats>({
    checked: 0,
    hasWebsite: 0,
    noWebsite: 0,
    maxLimit: 10,
    status: 'idle',
    statusMessage: 'Siap memindai profil Google Maps'
  });

  const [activeInspectingItem, setActiveInspectingItem] = useState<{
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
    matchedKeyword?: string;
    inspectStep?: string;
  } | null>(null);

  const [logs, setLogs] = useState<ScraperLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'info',
      message: 'Simulator scraper siap. Masukkan Niche & Kota target secara manual untuk memindai prospek.'
    }
  ]);

  const [logFilter, setLogFilter] = useState<'all' | 'lead' | 'website' | 'error'>('all');
  const isRunningRef = useRef<boolean>(false);
  const isStoppedRef = useRef<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Validate URL format
  const validateUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      return { isValid: false, message: 'URL atau kata kunci pencarian tidak boleh kosong' };
    }
    
    if (trimmed.startsWith('http')) {
      const isMapsUrl = trimmed.includes('google.com/maps') || trimmed.includes('google.co.id/maps') || trimmed.includes('maps.google.');
      if (!isMapsUrl) {
        return { 
          isValid: false, 
          message: 'Bukan URL Google Maps yang valid. Harap gunakan format: https://www.google.com/maps/search/...' 
        };
      }
      return { isValid: true, message: 'URL Google Maps terverifikasi' };
    } else {
      return { isValid: true, message: 'Kata kunci pencarian valid' };
    }
  };

  const updateSearchUrl = (niche: string, city: string) => {
    const query = `${niche.trim()} di ${city.trim()}`.trim();
    const formattedUrl = `https://www.google.com/maps/search/${encodeURIComponent(query).replace(/%20/g, '+')}`;
    setSearchUrlInput(formattedUrl);
    setUrlValidationStatus(validateUrl(formattedUrl));
  };

  const handleNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualNiche(val);
    updateSearchUrl(val, manualCity);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualCity(val);
    updateSearchUrl(manualNiche, val);
  };

  const handleQuickPresetSelect = (niche: string, city: string) => {
    setManualNiche(niche);
    setManualCity(city);
    updateSearchUrl(niche, city);
    addLog(`Target diatur: "${niche}" di "${city}".`, 'info');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchUrlInput(val);
    setUrlValidationStatus(validateUrl(val));
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', detail?: string) => {
    let timeString = '00:00:00';
    try {
      timeString = new Date().toLocaleTimeString('id-ID');
    } catch {
      timeString = new Date().toTimeString().split(' ')[0] || '00:00:00';
    }

    const newLog: ScraperLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timeString,
      type,
      message,
      detail
    };
    setLogs(prev => [...prev.slice(-100), newLog]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logs]);

  // Clear data function before new scan
  const handleClearData = () => {
    if (isRunningRef.current) return;
    setLeads([]);
    setStats({
      checked: 0,
      hasWebsite: 0,
      noWebsite: 0,
      maxLimit,
      status: 'idle',
      statusMessage: 'Data dan memori dibersihkan. Siap untuk pemindaian baru.'
    });
    setActiveInspectingItem(null);
    addLog('Pembersihan data berhasil. Memori dan statistik di-reset.', 'success');
  };

  // Start Scraper Simulation
  const handleStartScraping = async () => {
    const validation = validateUrl(searchUrlInput);
    if (!validation.isValid) {
      addLog(`Error Validasi: ${validation.message}`, 'error');
      return;
    }

    if (maxLimit <= 0) {
      addLog('Batas maksimum profil harus lebih dari 0.', 'error');
      return;
    }

    isRunningRef.current = true;
    isStoppedRef.current = false;

    setStats({
      checked: 0,
      hasWebsite: 0,
      noWebsite: 0,
      maxLimit,
      status: 'running',
      statusMessage: `Memulai pemindaian "${manualNiche}" di "${manualCity}"... Target: ${maxLimit} profil`
    });

    addLog(`=== Memulai Pemindaian Google Maps ===`, 'info');
    addLog(`Target: Niche "${manualNiche}" di "${manualCity}" (Maksimum ${maxLimit} profil).`, 'info');

    // Determine dataset or generate dynamically based on manual inputs
    let dataset: MockPlaceItem[] = [];
    const cleanNicheLower = manualNiche.toLowerCase();
    const cleanCityLower = manualCity.toLowerCase();

    if (cleanNicheLower.includes('bengkel') && cleanCityLower.includes('jakarta')) {
      dataset = [...SAMPLE_DATASETS.jakarta_bengkel.items];
    } else if ((cleanNicheLower.includes('kuliner') || cleanNicheLower.includes('restoran') || cleanNicheLower.includes('cafe')) && cleanCityLower.includes('surabaya')) {
      dataset = [...SAMPLE_DATASETS.surabaya_kuliner.items];
    } else if ((cleanNicheLower.includes('klinik') || cleanNicheLower.includes('gigi')) && cleanCityLower.includes('bandung')) {
      dataset = [...SAMPLE_DATASETS.bandung_klinik.items];
    }

    // If dataset doesn't have enough items, generate dynamic realistic mock places
    if (dataset.length < maxLimit) {
      const generated = generateDynamicMockPlaces(manualNiche, manualCity, Math.max(maxLimit, 25));
      dataset = [...dataset, ...generated];
    }
    
    let itemsToProcess = [...dataset];
    if (itemsToProcess.length < maxLimit) {
      while (itemsToProcess.length < maxLimit) {
        const clone = dataset.map((d, i) => ({
          ...d,
          name: `${d.name} (Cabang ${Math.floor(itemsToProcess.length / dataset.length) + 1})`,
          mapsUrl: `${d.mapsUrl}_branch_${itemsToProcess.length + i}`
        }));
        itemsToProcess = [...itemsToProcess, ...clone];
        if (itemsToProcess.length >= maxLimit || clone.length === 0) break;
      }
    }

    let checkedCount = 0;
    let hasWebCount = 0;
    let noWebCount = 0;
    const collectedLeads: BusinessLead[] = [];

    for (let i = 0; i < itemsToProcess.length; i++) {
      if (checkedCount >= maxLimit || isStoppedRef.current) {
        break;
      }

      const item = itemsToProcess[i];
      checkedCount++;

      // Step 1: Open profile
      setActiveInspectingItem({
        ...item,
        inspectStep: 'Membuka profil & mengekstrak data bisnis...'
      });

      setStats(prev => ({
        ...prev,
        checked: checkedCount,
        currentBusinessName: item.name,
        statusMessage: `Memeriksa ${checkedCount}/${maxLimit} — ${noWebCount} tanpa web resmi`
      }));

      addLog(`[${checkedCount}/${maxLimit}] Memeriksa: ${item.name} (${item.category})`, 'info');
      await new Promise(r => setTimeout(r, scanSpeedMs * 0.4));

      if (isStoppedRef.current) break;

      // Step 2: Validate website vs store name
      const webAnalysis = validateOfficialWebsite(item.detectedWebsite, item.name);

      setActiveInspectingItem({
        ...item,
        hasOfficialWebsite: webAnalysis.isOfficialWebsite,
        detectedWebsite: item.detectedWebsite,
        websiteNote: webAnalysis.reason,
        matchedKeyword: webAnalysis.matchedKeyword,
        inspectStep: 'Menganalisis domain terhadap nama toko...'
      });
      await new Promise(r => setTimeout(r, scanSpeedMs * 0.4));

      if (isStoppedRef.current) break;

      const newLead: BusinessLead = {
        id: `sim-lead-${Date.now()}-${i}`,
        name: item.name,
        category: item.category,
        rating: item.rating,
        reviewCount: item.reviewCount,
        address: item.address,
        phone: item.phone,
        mapsUrl: item.mapsUrl,
        hasOfficialWebsite: webAnalysis.isOfficialWebsite,
        websiteStatus: webAnalysis.isOfficialWebsite ? 'HAS_OFFICIAL_WEBSITE' : 'NO_WEBSITE',
        detectedWebsite: item.detectedWebsite || '',
        websiteNote: webAnalysis.reason,
        checkedAt: new Date().toLocaleTimeString('id-ID'),
        isMedicalLead: isMedicalCategoryOrName(item.name, item.category),
        contactStatus: 'new'
      };

      collectedLeads.push(newLead);
      setLeads(prev => [newLead, ...prev]);

      if (webAnalysis.isOfficialWebsite) {
        hasWebCount++;
        addLog(`🌐 [PUNYA WEB RESMI] "${item.name}" -> ${webAnalysis.websiteUrl} (Domain cocok nama toko)`, 'warning');
      } else {
        noWebCount++;
        if (item.detectedWebsite) {
          addLog(`🎯 [PROSPEK - LINK PIHAK KE-3] "${item.name}" (Link: ${item.detectedWebsite} - Bukan web toko resmi)`, 'success');
        } else {
          addLog(`🎯 [PROSPEK - TANPA WEBSITE] "${item.name}" terverifikasi tanpa website! (Total: ${noWebCount})`, 'success');
        }
      }

      setStats({
        checked: checkedCount,
        hasWebsite: hasWebCount,
        noWebsite: noWebCount,
        maxLimit,
        status: 'running',
        statusMessage: `Memeriksa ${checkedCount}/${maxLimit} — ${noWebCount} tanpa web resmi`,
        currentBusinessName: item.name
      });

      await new Promise(r => setTimeout(r, scanSpeedMs * 0.2));
    }

    isRunningRef.current = false;
    const finalStopped = isStoppedRef.current;

    setStats(prev => ({
      ...prev,
      status: finalStopped ? 'stopped' : 'completed',
      statusMessage: finalStopped
        ? `Pemindaian dihentikan. Total ${checkedCount}/${maxLimit} profil tersimpan (${noWebCount} prospek).`
        : `Selesai! Total ${checkedCount}/${maxLimit} profil tersimpan — ${noWebCount} prospek tanpa website resmi.`
    }));

    if (finalStopped) {
      addLog(`Pemindaian dihentikan oleh pengguna pada profil ke-${checkedCount}.`, 'warning');
    } else {
      addLog(`Pemindaian selesai. Total ${collectedLeads.length} data tersimpan dan siap diekspor ke CSV.`, 'success');
    }
  };

  // Stop Scraper Simulation
  const handleStopScraping = () => {
    if (!isRunningRef.current) return;
    isStoppedRef.current = true;
    addLog('Mengirim perintah berhenti...', 'warning');
  };

  // Export All Leads to CSV
  const handleDownloadAllCSV = () => {
    try {
      exportLeadsToCSV(leads, { filterMode: 'all', customFilename: `gmaps_semua_hasil_scrape_${Date.now()}.csv` });
      addLog(`Berhasil mengunduh semua data hasil scrape (${leads.length} baris CSV).`, 'success');
    } catch (err: any) {
      addLog(`Gagal ekspor CSV: ${err.message}`, 'error');
    }
  };

  // Export Only No-Website Leads to CSV
  const handleDownloadNoWebCSV = () => {
    try {
      exportLeadsToCSV(leads, { filterMode: 'no_website_only', customFilename: `gmaps_prospek_tanpa_website_${Date.now()}.csv` });
      const noWebCount = leads.filter(l => !l.hasOfficialWebsite).length;
      addLog(`Berhasil mengunduh ${noWebCount} prospek bisnis tanpa website resmi ke CSV.`, 'success');
    } catch (err: any) {
      addLog(`Gagal ekspor CSV: ${err.message}`, 'error');
    }
  };

  const progressPercent = stats.maxLimit > 0 ? Math.min(100, Math.round((stats.checked / stats.maxLimit) * 100)) : 0;
  const noWebCount = leads.filter(l => !l.hasOfficialWebsite).length;
  const hasWebCount = leads.filter(l => l.hasOfficialWebsite).length;

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'lead') return log.type === 'success';
    if (logFilter === 'website') return log.type === 'warning';
    if (logFilter === 'error') return log.type === 'error';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 sm:p-6 text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#D4FF44]/10 border border-[#D4FF44]/30 text-[#D4FF44] text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Domain & Lead Verifier</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Simulator Pemindai Google Maps
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA7B4] mt-1 max-w-2xl">
              Memeriksa apakah link website sesuai dengan nama toko resmi. Link pihak ketiga (sosmed, marketplace, aggregator) otomatis diklasifikasikan sebagai <strong>belum punya website resmi</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              id="clearDataBtn"
              onClick={handleClearData}
              disabled={stats.status === 'running'}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1D2126] hover:bg-[#252B33] text-[#E1E7EC] border border-[#2E353D] text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#7E8B99]" />
              <span>Bersihkan Data</span>
            </button>
            <button
              id="viewLeadsTabBtn"
              onClick={onOpenLeadsTab}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#D4FF44]/10 hover:bg-[#D4FF44]/20 text-[#D4FF44] border border-[#D4FF44]/30 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <span>Lihat Database Lead ({leads.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Control Panel & Stats (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card Statistik Utama */}
          <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-xs font-bold text-[#7E8B99] uppercase tracking-wider mb-3 font-mono">
              Statistik Pemindaian
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3 text-center">
                <div className="text-[11px] font-medium text-[#7E8B99] truncate">Total Scraped</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">{stats.checked}</div>
                <div className="text-[10px] text-[#5A6675] font-mono">dari max {stats.maxLimit}</div>
              </div>

              <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3 text-center">
                <div className="text-[11px] font-medium text-[#00E599] truncate">Web Toko Resmi</div>
                <div className="text-2xl font-bold text-[#00E599] font-mono mt-0.5">{stats.hasWebsite}</div>
                <div className="text-[10px] text-[#7E8B99] font-mono">Domain Cocok</div>
              </div>

              <div className="bg-[#131518] border border-[#2E3D24] rounded-lg p-3 text-center">
                <div className="text-[11px] font-medium text-[#D4FF44] truncate">Tanpa Web Resmi</div>
                <div className="text-2xl font-bold text-[#D4FF44] font-mono mt-0.5">{stats.noWebsite}</div>
                <div className="text-[10px] text-[#D4FF44]/80 font-mono font-semibold">Prospek Target</div>
              </div>
            </div>

            {/* Status & Progress Bar */}
            <div className="mt-4 bg-[#131518] border border-[#24292E] rounded-lg p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#E1E7EC] mb-1.5">
                <span className="truncate pr-2">{stats.statusMessage}</span>
                <span className="text-[#D4FF44] font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#1D2126] h-2 rounded-full overflow-hidden border border-[#24292E]">
                <div 
                  className="bg-[#D4FF44] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card Parameter & Input Manual */}
          <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#7E8B99] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4FF44]" />
                <span>Konfigurasi Pemindaian (Input Manual)</span>
              </h3>
              <span className="text-[10px] text-[#D4FF44] bg-[#D4FF44]/10 px-2 py-0.5 rounded border border-[#D4FF44]/20 font-mono">
                Manual Mode
              </span>
            </div>

            {/* Manual Niche & City Inputs */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="manualNicheInput" className="block text-xs font-semibold text-[#E1E7EC] mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#D4FF44]" />
                    <span>Niche / Kategori Bisnis:</span>
                  </label>
                  <input
                    id="manualNicheInput"
                    type="text"
                    value={manualNiche}
                    onChange={handleNicheChange}
                    disabled={stats.status === 'running'}
                    placeholder="Misal: Bengkel Mobil, Klinik Gigi, Cafe..."
                    className="w-full text-xs px-3 py-2 bg-[#131518] border border-[#2A3038] text-white rounded-lg focus:outline-none focus:border-[#D4FF44] focus:ring-1 focus:ring-[#D4FF44] transition font-medium"
                  />
                  <p className="text-[10px] text-[#7E8B99] mt-1">Ketik bebas jenis usaha target</p>
                </div>

                <div>
                  <label htmlFor="manualCityInput" className="block text-xs font-semibold text-[#E1E7EC] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4FF44]" />
                    <span>Kota / Wilayah Target:</span>
                  </label>
                  <input
                    id="manualCityInput"
                    type="text"
                    value={manualCity}
                    onChange={handleCityChange}
                    disabled={stats.status === 'running'}
                    placeholder="Misal: Jakarta Selatan, Surabaya, Bandung..."
                    className="w-full text-xs px-3 py-2 bg-[#131518] border border-[#2A3038] text-white rounded-lg focus:outline-none focus:border-[#D4FF44] focus:ring-1 focus:ring-[#D4FF44] transition font-medium"
                  />
                  <p className="text-[10px] text-[#7E8B99] mt-1">Ketik bebas nama kota/daerah</p>
                </div>
              </div>

              {/* Quick Preset / Suggestions Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-[#7E8B99] mb-1.5">
                  Saran Cepat Niche & Kota (Klik untuk mengisi otomatis):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Bengkel Mobil', 'Jakarta Selatan')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Bengkel Mobil' && manualCity === 'Jakarta Selatan'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    🚗 Bengkel Jakarta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Restoran & Cafe', 'Surabaya')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Restoran & Cafe' && manualCity === 'Surabaya'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    🍽️ Kuliner Surabaya
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Klinik Gigi & Kecantikan', 'Bandung')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Klinik Gigi & Kecantikan' && manualCity === 'Bandung'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    🏥 Klinik Bandung
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Salon & Barbershop', 'Yogyakarta')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Salon & Barbershop' && manualCity === 'Yogyakarta'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    💇‍♀️ Salon Jogja
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Pet Shop & Dokter Hewan', 'Semarang')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Pet Shop & Dokter Hewan' && manualCity === 'Semarang'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    🐾 Pet Shop Semarang
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Kontraktor & Desain Interior', 'Denpasar Bali')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Kontraktor & Desain Interior' && manualCity === 'Denpasar Bali'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    🏗️ Interior Bali
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetSelect('Laundry Kiloan & Sepatu', 'Medan')}
                    disabled={stats.status === 'running'}
                    className={`px-2 py-1 text-[11px] rounded-md border transition cursor-pointer ${
                      manualNiche === 'Laundry Kiloan & Sepatu' && manualCity === 'Medan'
                        ? 'bg-[#D4FF44]/20 border-[#D4FF44] text-[#D4FF44] font-semibold'
                        : 'bg-[#131518] border-[#24292E] text-[#9BA7B4] hover:text-white hover:border-[#3A424C]'
                    }`}
                  >
                    🧼 Laundry Medan
                  </button>
                </div>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label htmlFor="searchUrlInput" className="block text-xs font-semibold text-[#A0ACB9] mb-1.5">
                Query / URL Google Maps yang Digenerate:
              </label>
              <div className="relative">
                <input
                  id="searchUrlInput"
                  type="text"
                  value={searchUrlInput}
                  onChange={handleUrlChange}
                  disabled={stats.status === 'running'}
                  placeholder="https://www.google.com/maps/search/..."
                  className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none transition font-mono ${
                    urlValidationStatus.isValid
                      ? 'bg-[#131518] border-[#2A3038] text-white focus:border-[#D4FF44] focus:ring-1 focus:ring-[#D4FF44]'
                      : 'bg-[#FF4444]/10 border-[#FF4444]/50 text-white focus:border-[#FF4444]'
                  }`}
                />
              </div>
              <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-mono ${
                urlValidationStatus.isValid ? 'text-[#D4FF44]' : 'text-[#FF4444]'
              }`}>
                {urlValidationStatus.isValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span>{urlValidationStatus.message}</span>
              </div>
            </div>

            {/* Limits & Speed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="maxLimitInput" className="block text-xs font-semibold text-[#A0ACB9] mb-1">
                  Batas Maksimal Profil:
                </label>
                <input
                  id="maxLimitInput"
                  type="number"
                  min={1}
                  max={500}
                  value={maxLimit}
                  onChange={(e) => setMaxLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  disabled={stats.status === 'running'}
                  className="w-full text-xs px-3 py-2 bg-[#131518] border border-[#2A3038] text-white rounded-lg focus:outline-none focus:border-[#D4FF44] font-mono"
                />
                <p className="text-[10px] text-[#5A6675] mt-1">Jumlah profil yang diperiksa</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0ACB9] mb-1">
                  Kecepatan Simulasi:
                </label>
                <select
                  value={scanSpeedMs}
                  onChange={(e) => setScanSpeedMs(parseInt(e.target.value, 10))}
                  disabled={stats.status === 'running'}
                  className="w-full text-xs px-3 py-2 bg-[#131518] border border-[#2A3038] text-white rounded-lg focus:outline-none focus:border-[#D4FF44]"
                >
                  <option value={1400}>Lambat (1.4 dtk)</option>
                  <option value={850}>Normal (0.85 dtk)</option>
                  <option value={300}>Cepat (0.3 dtk)</option>
                </select>
                <p className="text-[10px] text-[#5A6675] mt-1">Jeda antar profil</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                {stats.status === 'running' ? (
                  <button
                    id="stopScraperBtn"
                    onClick={handleStopScraping}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#FF4444] hover:bg-[#FF5555] text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Berhenti</span>
                  </button>
                ) : (
                  <button
                    id="startScraperBtn"
                    onClick={handleStartScraping}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Mulai Pindai</span>
                  </button>
                )}

                <button
                  id="downloadAllCsvBtn"
                  onClick={handleDownloadAllCSV}
                  disabled={leads.length === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#D4FF44]/15 hover:bg-[#D4FF44]/25 text-[#D4FF44] border border-[#D4FF44]/40 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Unduh seluruh data hasil pemindaian termasuk status website & URL"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Semua ({leads.length})</span>
                </button>
              </div>

              {/* Secondary Download Button */}
              <button
                id="downloadNoWebCsvBtn"
                onClick={handleDownloadNoWebCSV}
                disabled={noWebCount === 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1D2126] hover:bg-[#252B33] text-[#E1E7EC] border border-[#2E353D] hover:border-[#D4FF44] text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D4FF44]" />
                <span>Unduh Hanya Tanpa Web ({noWebCount} Prospek)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live DOM Inspector & Terminal Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Profile Inspector Card */}
          <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#24292E]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#D4FF44] animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Inspeksi DOM & Verifikasi Domain Toko
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#7E8B99]">
                {activeInspectingItem ? 'Memeriksa...' : 'Menunggu Pemindaian'}
              </span>
            </div>

            {activeInspectingItem ? (
              <div className="mt-4 space-y-3">
                <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{activeInspectingItem.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-[#9BA7B4] mt-0.5">
                        <span className="bg-[#1D2126] text-[#A0ACB9] border border-[#2A3038] px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                          {activeInspectingItem.category}
                        </span>
                        <span className="flex items-center text-[#FFB800] font-semibold">
                          <Star className="w-3 h-3 fill-current mr-0.5" />
                          {activeInspectingItem.rating} ({activeInspectingItem.reviewCount} ulasan)
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {activeInspectingItem.hasOfficialWebsite ? (
                        <span className="inline-flex items-center gap-1 bg-[#00E599]/15 text-[#00E599] text-[11px] font-mono font-semibold px-2 py-1 rounded border border-[#00E599]/30">
                          <Globe className="w-3 h-3 text-[#00E599]" />
                          <span>Punya Web Resmi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#D4FF44]/15 text-[#D4FF44] text-[11px] font-mono font-semibold px-2 py-1 rounded border border-[#D4FF44]/40">
                          <CheckCircle2 className="w-3 h-3 text-[#D4FF44]" />
                          <span>Tanpa Web Resmi</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-[#9BA7B4] border-t border-[#24292E] pt-2.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#7E8B99] flex-shrink-0" />
                      <span className="truncate">{activeInspectingItem.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-[#7E8B99] flex-shrink-0" />
                      <span>{activeInspectingItem.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Algoritma Filter Checklist */}
                <div className="bg-[#0F1113] text-[#E1E7EC] rounded-lg p-3 font-mono text-[11px] space-y-1.5 border border-[#24292E]">
                  <div className="text-[#7E8B99] text-[10px] font-semibold uppercase tracking-wider pb-1 border-b border-[#24292E] flex justify-between">
                    <span>Hasil Validasi Domain & Nama Toko:</span>
                    <span className="text-[#D4FF44]">{activeInspectingItem.inspectStep || 'Selesai'}</span>
                  </div>
                  
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className="text-[#9BA7B4]">1. Link Terdeteksi:</span>
                    <span className="text-white text-right truncate max-w-[240px]">
                      {activeInspectingItem.detectedWebsite || '(Tidak Ada Link)'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#9BA7B4]">2. Kesesuaian Nama Toko:</span>
                    <span className={activeInspectingItem.hasOfficialWebsite ? 'text-[#00E599]' : 'text-[#FFB800]'}>
                      {activeInspectingItem.hasOfficialWebsite ? 'Cocok (Domain Toko Resmi)' : 'Bukan Web Toko Resmi'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 text-[10px] text-[#7E8B99]">
                    <span>3. Analisis:</span>
                    <span className="text-right text-[#C5D1DE] max-w-[280px]">
                      {activeInspectingItem.websiteNote || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#24292E] font-semibold">
                    <span className="text-white">Status Akhir:</span>
                    <span className={activeInspectingItem.hasOfficialWebsite ? 'text-[#00E599]' : 'text-[#D4FF44]'}>
                      {activeInspectingItem.hasOfficialWebsite ? 'TERDETEKSI MEMILIKI WEBSITE RESMI' : 'TARGET PROSPEK (TANPA WEBSITE RESMI)'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-[#7E8B99] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#131518] border border-[#24292E] mx-auto flex items-center justify-center text-[#7E8B99]">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-xs">Klik "Mulai Pindai" untuk melihat proses parsing DOM Google Maps secara langsung.</p>
              </div>
            )}
          </div>

          {/* Live Debug & Scraper Log Terminal */}
          <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#24292E]">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#D4FF44]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Live Log & Debug Monitor
                </h3>
              </div>

              {/* Filter Logs */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                    logFilter === 'all' ? 'bg-[#D4FF44] text-[#0F1113] font-bold' : 'text-[#7E8B99] hover:text-[#E1E7EC] bg-[#131518]'
                  }`}
                >
                  Semua ({logs.length})
                </button>
                <button
                  onClick={() => setLogFilter('lead')}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                    logFilter === 'lead' ? 'bg-[#D4FF44]/20 text-[#D4FF44] border border-[#D4FF44]/40 font-bold' : 'text-[#7E8B99] hover:text-[#D4FF44] bg-[#131518]'
                  }`}
                >
                  Prospek ({noWebCount})
                </button>
                <button
                  onClick={() => setLogFilter('website')}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                    logFilter === 'website' ? 'bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 font-bold' : 'text-[#7E8B99] hover:text-[#00E599] bg-[#131518]'
                  }`}
                >
                  Punya Web ({hasWebCount})
                </button>
              </div>
            </div>

            {/* Terminal Screen */}
            <div 
              ref={logsEndRef}
              className="h-44 overflow-y-auto mt-3 font-mono text-[11px] leading-relaxed space-y-1 scrollbar-thin scrollbar-thumb-[#24292E] scrollbar-track-transparent pr-1 bg-[#131518] p-3 rounded-lg border border-[#24292E]"
            >
              {filteredLogs.map(log => {
                let colorClass = 'text-[#C5D1DE]';
                if (log.type === 'success') colorClass = 'text-[#D4FF44] font-medium';
                if (log.type === 'warning') colorClass = 'text-[#FFB800]';
                if (log.type === 'error') colorClass = 'text-[#FF4444] font-semibold';
                if (log.type === 'info') colorClass = 'text-[#8E9CA8]';

                return (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-[#5A6675] flex-shrink-0">[{log.timestamp}]</span>
                    <span className={colorClass}>{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
