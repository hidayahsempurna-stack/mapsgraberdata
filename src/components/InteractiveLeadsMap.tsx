import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  ExternalLink, 
  MessageSquare, 
  Star, 
  Layers, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Building2,
  Phone,
  Globe,
  Filter,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { BusinessLead } from '../types';
import { extractCityFromAddress, createWhatsAppDirectUrl, renderWhatsAppMessage, getSavedWhatsAppTemplates } from '../utils/whatsappTemplates';

interface InteractiveLeadsMapProps {
  leads: BusinessLead[];
  onDirectWhatsApp: (lead: BusinessLead) => void;
  onSelectLead?: (lead: BusinessLead) => void;
  senderName?: string;
}

// Known coordinates center for major Indonesian cities/regions
const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Jakarta': { lat: -6.2088, lng: 106.8456, zoom: 12 },
  'Jakarta Selatan': { lat: -6.2615, lng: 106.8106, zoom: 13 },
  'Jakarta Barat': { lat: -6.1674, lng: 106.7637, zoom: 13 },
  'Jakarta Pusat': { lat: -6.1805, lng: 106.8284, zoom: 13 },
  'Jakarta Timur': { lat: -6.2250, lng: 106.9004, zoom: 13 },
  'Jakarta Utara': { lat: -6.1384, lng: 106.8640, zoom: 13 },
  'Surabaya': { lat: -7.2575, lng: 112.7521, zoom: 12 },
  'Bandung': { lat: -6.9175, lng: 107.6191, zoom: 12 },
  'Medan': { lat: 3.5952, lng: 98.6722, zoom: 12 },
  'Semarang': { lat: -6.9667, lng: 110.4167, zoom: 12 },
  'Yogyakarta': { lat: -7.7956, lng: 110.3695, zoom: 13 },
  'Jogja': { lat: -7.7956, lng: 110.3695, zoom: 13 },
  'Denpasar': { lat: -8.6705, lng: 115.2126, zoom: 12 },
  'Bali': { lat: -8.4095, lng: 115.1889, zoom: 10 },
  'Makassar': { lat: -5.1477, lng: 119.4327, zoom: 12 },
  'Palembang': { lat: -2.9761, lng: 104.7754, zoom: 12 },
  'Tangerang': { lat: -6.1783, lng: 106.6319, zoom: 12 },
  'Tangerang Selatan': { lat: -6.2889, lng: 106.7179, zoom: 12 },
  'Depok': { lat: -6.4025, lng: 106.7942, zoom: 12 },
  'Bekasi': { lat: -6.2383, lng: 106.9756, zoom: 12 },
  'Bogor': { lat: -6.5971, lng: 106.8060, zoom: 12 },
  'Malang': { lat: -7.9666, lng: 112.6326, zoom: 12 },
  'Solo': { lat: -7.5755, lng: 110.8243, zoom: 13 },
  'Batam': { lat: 1.1301, lng: 104.0529, zoom: 12 }
};

interface GeoLead extends BusinessLead {
  geoLat: number;
  geoLng: number;
  cityName: string;
}

export const InteractiveLeadsMap: React.FC<InteractiveLeadsMapProps> = ({
  leads,
  onDirectWhatsApp,
  onSelectLead,
  senderName = 'Tim Konsultan Digital'
}) => {
  const [selectedLead, setSelectedLead] = useState<GeoLead | null>(null);
  const [filterWebsite, setFilterWebsite] = useState<'all' | 'no_website' | 'has_website'>('all');
  const [filterContact, setFilterContact] = useState<'all' | 'new' | 'contacted'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCityFilter, setActiveCityFilter] = useState<string>('all');
  
  // Map viewport & pan/zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute geocoded leads with deterministic positions
  const geoLeads: GeoLead[] = useMemo(() => {
    return leads.map((lead, index) => {
      const detectedCity = lead.city || extractCityFromAddress(lead.address);
      let baseCoord = CITY_COORDINATES[detectedCity];

      if (!baseCoord) {
        // Search partial matches
        const matchedKey = Object.keys(CITY_COORDINATES).find(c => 
          detectedCity.toLowerCase().includes(c.toLowerCase()) || 
          (lead.address && lead.address.toLowerCase().includes(c.toLowerCase()))
        );
        baseCoord = matchedKey ? CITY_COORDINATES[matchedKey] : CITY_COORDINATES['Jakarta Selatan'];
      }

      // Hash deterministic jittering offset based on name and id
      const hashStr = (lead.id || lead.name || '') + index;
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = (hash << 5) - hash + hashStr.charCodeAt(i);
        hash |= 0;
      }
      
      const jitterLat = (((Math.abs(hash) % 1000) - 500) / 1000) * 0.04;
      const jitterLng = ((((Math.abs(hash >> 3)) % 1000) - 500) / 1000) * 0.04;

      const finalLat = lead.lat || (baseCoord.lat + jitterLat);
      const finalLng = lead.lng || (baseCoord.lng + jitterLng);

      return {
        ...lead,
        geoLat: finalLat,
        geoLng: finalLng,
        cityName: detectedCity
      };
    });
  }, [leads]);

  // Filtered leads based on controls
  const filteredGeoLeads = useMemo(() => {
    return geoLeads.filter(lead => {
      // Filter website
      if (filterWebsite === 'no_website' && lead.hasOfficialWebsite) return false;
      if (filterWebsite === 'has_website' && !lead.hasOfficialWebsite) return false;

      // Filter contact status
      if (filterContact === 'new' && lead.contactStatus && lead.contactStatus !== 'new') return false;
      if (filterContact === 'contacted' && lead.contactStatus !== 'contacted' && lead.contactStatus !== 'deal') return false;

      // Filter city
      if (activeCityFilter !== 'all' && lead.cityName !== activeCityFilter) return false;

      // Filter search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = 
          lead.name.toLowerCase().includes(query) ||
          lead.category.toLowerCase().includes(query) ||
          lead.address.toLowerCase().includes(query) ||
          lead.cityName.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [geoLeads, filterWebsite, filterContact, activeCityFilter, searchQuery]);

  // Aggregate Market Concentration Insights by City
  const cityMarketInsights = useMemo(() => {
    const counts: Record<string, { total: number; noWebsite: number; contacted: number }> = {};
    
    geoLeads.forEach(l => {
      const c = l.cityName || 'Wilayah Lain';
      if (!counts[c]) {
        counts[c] = { total: 0, noWebsite: 0, contacted: 0 };
      }
      counts[c].total++;
      if (!l.hasOfficialWebsite) counts[c].noWebsite++;
      if (l.contactStatus === 'contacted' || l.contactStatus === 'deal') counts[c].contacted++;
    });

    return Object.entries(counts)
      .map(([cityName, stat]) => ({
        cityName,
        total: stat.total,
        noWebsite: stat.noWebsite,
        contacted: stat.contacted,
        opportunityRate: Math.round((stat.noWebsite / Math.max(stat.total, 1)) * 100)
      }))
      .sort((a, b) => b.total - a.total);
  }, [geoLeads]);

  // Calculate bounding box for SVG projection
  const bounds = useMemo(() => {
    if (filteredGeoLeads.length === 0) {
      return { minLat: -6.4, maxLat: -6.1, minLng: 106.6, maxLng: 107.0 };
    }

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    filteredGeoLeads.forEach(l => {
      if (l.geoLat < minLat) minLat = l.geoLat;
      if (l.geoLat > maxLat) maxLat = l.geoLat;
      if (l.geoLng < minLng) minLng = l.geoLng;
      if (l.geoLng > maxLng) maxLng = l.geoLng;
    });

    // Add padding margin
    const latPad = Math.max((maxLat - minLat) * 0.15, 0.03);
    const lngPad = Math.max((maxLng - minLng) * 0.15, 0.03);

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad
    };
  }, [filteredGeoLeads]);

  // Convert lat/lng to container pixel percentage (0 to 100)
  const projectCoords = (lat: number, lng: number) => {
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0001);

    const x = ((lng - bounds.minLng) / lngSpan) * 100;
    const y = ((bounds.maxLat - lat) / latSpan) * 100;

    return { x: Math.min(Math.max(x, 4), 96), y: Math.min(Math.max(y, 6), 94) };
  };

  // Reset map pan & zoom
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedLead(null);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.8), 3.0));
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.map-marker, .map-popup, .map-control')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-[#16191D] border border-[#24292E] rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Map Header & Controls */}
      <div className="p-3 sm:p-4 bg-[#111316] border-b border-[#24292E] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D4FF44]/10 border border-[#D4FF44]/30 flex items-center justify-center text-[#D4FF44]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Visualisasi Peta Sebaran Prospek</h3>
              <span className="bg-[#58A6FF]/15 text-[#58A6FF] text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-[#58A6FF]/30">
                {filteredGeoLeads.length} Titik Lokasi
              </span>
            </div>
            <p className="text-[11px] text-[#7E8B99]">
              Insight konsentrasi pasar geografis & peluang penawaran website lokal
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#7E8B99] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bisnis atau kota..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#16191D] border border-[#2A3038] text-xs text-white rounded-lg focus:outline-none focus:border-[#D4FF44]"
            />
          </div>

          {/* Filter Website Status */}
          <select
            value={filterWebsite}
            onChange={(e) => setFilterWebsite(e.target.value as any)}
            className="bg-[#16191D] border border-[#2A3038] text-xs text-[#C5D1DE] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4FF44] cursor-pointer"
          >
            <option value="all">Semua Status Website</option>
            <option value="no_website">🔴 Tanpa Website (Target Prioritas)</option>
            <option value="has_website">🟢 Punya Website Resmi</option>
          </select>

          {/* Filter City */}
          <select
            value={activeCityFilter}
            onChange={(e) => setActiveCityFilter(e.target.value)}
            className="bg-[#16191D] border border-[#2A3038] text-xs text-[#C5D1DE] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D4FF44] cursor-pointer"
          >
            <option value="all">Semua Wilayah ({cityMarketInsights.length} Kota)</option>
            {cityMarketInsights.map(c => (
              <option key={c.cityName} value={c.cityName}>
                {c.cityName} ({c.total} prospek)
              </option>
            ))}
          </select>

          {/* Reset Zoom Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="map-control p-1.5 bg-[#1D2126] hover:bg-[#252B32] border border-[#2A3038] text-[#C5D1DE] rounded-lg transition cursor-pointer text-xs"
            title="Reset Peta"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Container & Market Insights Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[460px] h-[520px]">
        {/* Left Interactive Map Canvas (3 Cols) */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`lg:col-span-3 relative bg-[#0D0F12] overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-[#24292E] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Map Grid / Dark Thematic Background Pattern */}
          <div 
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, #3A4450 1px, transparent 0),
                linear-gradient(to right, #1A1F26 1px, transparent 1px),
                linear-gradient(to bottom, #1A1F26 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px, 64px 64px, 64px 64px'
            }}
          />

          {/* Map Controls Floating Overlay */}
          <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 map-control">
            <button
              onClick={() => handleZoom(0.25)}
              className="w-7 h-7 bg-[#16191D]/90 backdrop-blur border border-[#2E353D] hover:bg-[#24292E] text-white rounded-lg flex items-center justify-center shadow transition cursor-pointer"
              title="Perbesar Peta"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="w-7 h-7 bg-[#16191D]/90 backdrop-blur border border-[#2E353D] hover:bg-[#24292E] text-white rounded-lg flex items-center justify-center shadow transition cursor-pointer"
              title="Perkecil Peta"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="w-7 h-7 bg-[#16191D]/90 backdrop-blur border border-[#2E353D] hover:bg-[#24292E] text-white rounded-lg flex items-center justify-center shadow transition cursor-pointer"
              title="Tengahkan Peta"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Map Legend Floating */}
          <div className="absolute bottom-3 left-3 z-30 bg-[#111316]/90 backdrop-blur border border-[#24292E] rounded-lg px-2.5 py-1.5 text-[10px] space-y-1 shadow-lg pointer-events-none">
            <div className="font-bold text-[#7E8B99] uppercase tracking-wider font-mono">Status Prospek:</div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#FF5B5B]">
                <span className="w-2 h-2 rounded-full bg-[#FF5B5B] inline-block shadow-xs shadow-[#FF5B5B]/50 animate-pulse" />
                Tanpa Website (Peluang)
              </span>
              <span className="flex items-center gap-1 text-[#3FB950]">
                <span className="w-2 h-2 rounded-full bg-[#3FB950] inline-block" />
                Punya Website
              </span>
              <span className="flex items-center gap-1 text-[#58A6FF]">
                <span className="w-2 h-2 rounded-full bg-[#58A6FF] inline-block" />
                Sudah Dihubungi
              </span>
            </div>
          </div>

          {/* Map Transform Layer (Pan & Zoom) */}
          <div
            className="w-full h-full relative transition-transform duration-75"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Interactive Pins Layer */}
            {filteredGeoLeads.map((lead) => {
              const pos = projectCoords(lead.geoLat, lead.geoLng);
              const isSelected = selectedLead?.id === lead.id;
              const isContacted = lead.contactStatus === 'contacted' || lead.contactStatus === 'deal';
              const isNoWeb = !lead.hasOfficialWebsite;

              // Color determination
              let pinBg = 'bg-[#3FB950] border-[#3FB950] text-[#0F1113]';
              if (isContacted) {
                pinBg = 'bg-[#58A6FF] border-[#58A6FF] text-[#0F1113]';
              } else if (isNoWeb) {
                pinBg = 'bg-[#FF5B5B] border-[#FF5B5B] text-white';
              }

              return (
                <div
                  key={lead.id || lead.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLead(lead);
                    if (onSelectLead) onSelectLead(lead);
                  }}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                  className={`absolute map-marker cursor-pointer z-10 group transition-all duration-150 ${
                    isSelected ? 'z-40 scale-125' : 'hover:scale-115 hover:z-30'
                  }`}
                >
                  {/* Marker Pin Icon with Ripple if Priority */}
                  <div className="relative">
                    {isNoWeb && !isContacted && (
                      <span className="absolute -inset-1 rounded-full bg-[#FF5B5B]/30 animate-ping opacity-75" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg border-2 ${pinBg}`}>
                      {isContacted ? '✓' : isNoWeb ? '!' : '★'}
                    </div>
                  </div>

                  {/* Marker Tooltip on Hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 pointer-events-none transition bg-[#16191D] border border-[#2E353D] text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                    {lead.name}
                  </div>
                </div>
              );
            })}

            {/* Selected Lead Detailed Info Popup on Map */}
            {selectedLead && (
              <div
                style={{
                  left: `${projectCoords(selectedLead.geoLat, selectedLead.geoLng).x}%`,
                  top: `${projectCoords(selectedLead.geoLat, selectedLead.geoLng).y}%`,
                  transform: 'translate(-50%, 8px)'
                }}
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 map-popup w-72 sm:w-80 bg-[#16191D] border border-[#2E353D] rounded-xl shadow-2xl p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-[#24292E] pb-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#D4FF44] font-semibold">
                      {selectedLead.cityName} &bull; {selectedLead.category}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                      {selectedLead.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-[#7E8B99] hover:text-white text-xs font-mono p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Info Badges */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-[#111316] p-1.5 rounded border border-[#24292E] flex items-center gap-1 text-[#E1E7EC]">
                    <Star className="w-3 h-3 text-[#FFC107] fill-[#FFC107]" />
                    <span>{selectedLead.rating || '0'} ({selectedLead.reviewCount || 0})</span>
                  </div>

                  <div className={`p-1.5 rounded border flex items-center gap-1 font-semibold ${
                    selectedLead.hasOfficialWebsite
                      ? 'bg-[#3FB950]/10 border-[#3FB950]/30 text-[#3FB950]'
                      : 'bg-[#FF5B5B]/10 border-[#FF5B5B]/30 text-[#FF5B5B]'
                  }`}>
                    <Globe className="w-3 h-3" />
                    <span>{selectedLead.hasOfficialWebsite ? 'Punya Website' : 'Tanpa Website'}</span>
                  </div>
                </div>

                {/* Address & Phone */}
                <div className="text-[11px] text-[#A0ACB9] space-y-1">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-[#7E8B99] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{selectedLead.address || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#7E8B99] shrink-0" />
                    <span className="font-mono text-white">{selectedLead.phone || 'Nomor tidak tersedia'}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {selectedLead.phone && selectedLead.phone !== '-' ? (
                    <button
                      type="button"
                      onClick={() => onDirectWhatsApp(selectedLead)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#0F1113] text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition shadow cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim WA & Tandai</span>
                    </button>
                  ) : (
                    <span className="flex-1 text-[10px] text-[#7E8B99] italic text-center py-1 bg-[#111316] rounded border border-[#24292E]">
                      Nomor telepon tidak tersedia
                    </span>
                  )}

                  {selectedLead.mapsUrl && (
                    <a
                      href={selectedLead.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-[#1D2126] hover:bg-[#24292E] border border-[#2E353D] text-[#C5D1DE] rounded-lg transition cursor-pointer"
                      title="Buka Profil di Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Market Concentration & Lead Queue (1 Col) */}
        <div className="bg-[#131518] p-3 sm:p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          {/* Concentration ranking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#24292E] pb-2">
              <h4 className="text-xs font-bold text-[#E1E7EC] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4FF44]" />
                <span>Konsentrasi Pasar ({cityMarketInsights.length} Kota)</span>
              </h4>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cityMarketInsights.map((insight) => (
                <div
                  key={insight.cityName}
                  onClick={() => {
                    setActiveCityFilter(activeCityFilter === insight.cityName ? 'all' : insight.cityName);
                  }}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    activeCityFilter === insight.cityName
                      ? 'bg-[#D4FF44]/15 border-[#D4FF44] text-[#D4FF44]'
                      : 'bg-[#16191D] border-[#24292E] hover:border-[#3A424C] text-[#C5D1DE]'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="truncate">{insight.cityName}</span>
                    <span className="font-mono text-[11px] bg-[#111316] px-1.5 py-0.5 rounded">
                      {insight.total} prospek
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#7E8B99] mt-1.5">
                    <span className="text-[#FF5B5B]">
                      {insight.noWebsite} tanpa web
                    </span>
                    <span className="font-mono text-[#D4FF44]">
                      {insight.opportunityRate}% Potensial
                    </span>
                  </div>

                  {/* Visual Opportunity Progress Bar */}
                  <div className="w-full h-1 bg-[#1F242A] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#D4FF44] rounded-full"
                      style={{ width: `${insight.opportunityRate}%` }}
                    />
                  </div>
                </div>
              ))}

              {cityMarketInsights.length === 0 && (
                <div className="text-center py-6 text-xs text-[#7E8B99]">
                  Belum ada data leads dengan lokasi. Lakukan scan di Simulator.
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary Box */}
          <div className="p-3 bg-[#16191D] border border-[#24292E] rounded-lg space-y-2 text-xs">
            <div className="text-[10px] font-mono text-[#7E8B99] uppercase font-bold">Ringkasan Peta:</div>
            <div className="flex items-center justify-between">
              <span className="text-[#A0ACB9]">Target Prioritas (Tanpa Web):</span>
              <span className="font-mono font-bold text-[#FF5B5B]">
                {geoLeads.filter(l => !l.hasOfficialWebsite).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A0ACB9]">Sudah Dihubungi:</span>
              <span className="font-mono font-bold text-[#58A6FF]">
                {geoLeads.filter(l => l.contactStatus === 'contacted' || l.contactStatus === 'deal').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
