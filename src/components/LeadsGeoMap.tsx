import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  MessageCircle, 
  Building2, 
  Star, 
  Navigation,
  Globe,
  AlertCircle,
  Filter,
  CheckCircle2,
  Sparkles,
  Phone
} from 'lucide-react';
import { BusinessLead } from '../types';
import { resolveLeadGeoLocation, summarizeLeadsByCity, KNOWN_CITY_CENTROIDS } from '../utils/geoUtils';

interface LeadsGeoMapProps {
  leads: BusinessLead[];
  onDirectWhatsApp?: (lead: BusinessLead, templateType?: 'website' | 'rekam_medis') => void;
  onNavigateToSimulator?: () => void;
}

export const LeadsGeoMap: React.FC<LeadsGeoMapProps> = ({
  leads,
  onDirectWhatsApp,
  onNavigateToSimulator
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'no_website' | 'has_website'>('all');
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTileLayer, setActiveTileLayer] = useState<'dark' | 'voyager' | 'osm'>('dark');

  // Compute city distribution summaries
  const citySummaries = useMemo(() => summarizeLeadsByCity(leads), [leads]);

  // Compute mapped leads with coordinates
  const mappedLeads = useMemo(() => {
    return leads.map(lead => {
      const geo = resolveLeadGeoLocation(lead);
      return {
        lead,
        geo
      };
    });
  }, [leads]);

  // Filtered leads based on selection
  const filteredLeads = useMemo(() => {
    return mappedLeads.filter(({ lead, geo }) => {
      // City filter
      if (selectedCity !== 'all') {
        const leadCityNorm = (geo.city || '').toLowerCase();
        const targetCityNorm = selectedCity.toLowerCase();
        if (!leadCityNorm.includes(targetCityNorm) && !targetCityNorm.includes(leadCityNorm)) {
          return false;
        }
      }

      // Website status filter
      if (websiteFilter === 'no_website' && lead.hasOfficialWebsite) {
        return false;
      }
      if (websiteFilter === 'has_website' && !lead.hasOfficialWebsite) {
        return false;
      }

      return true;
    });
  }, [mappedLeads, selectedCity, websiteFilter]);

  // Stats calculation
  const totalMapped = mappedLeads.length;
  const noWebsiteMapped = mappedLeads.filter(m => !m.lead.hasOfficialWebsite).length;
  const hasWebsiteMapped = totalMapped - noWebsiteMapped;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map already initialized, skip
    if (!mapInstanceRef.current) {
      // Default to Indonesia center coordinates
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      // Tile layer definition
      const tileUrls = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      };

      const tileLayer = L.tileLayer(tileUrls[activeTileLayer], {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Layer group for pins
      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerGroupRef.current = markersGroup;

      // Add custom attribution bottom right
      L.control.attribution({
        position: 'bottomright',
        prefix: '<span class="text-[9px] text-[#7E8B99]">© OpenStreetMap & CARTO</span>'
      }).addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerGroupRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer if changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrls = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    };

    L.tileLayer(tileUrls[activeTileLayer], {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);
  }, [activeTileLayer]);

  // Render Markers onto the Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;

    const markersGroup = markersLayerGroupRef.current;
    markersGroup.clearLayers();

    if (filteredLeads.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredLeads.forEach(({ lead, geo }) => {
      const isNoWeb = !lead.hasOfficialWebsite;
      const isContacted = lead.contactStatus === 'contacted' || lead.contactStatus === 'deal';
      
      // Color scheme
      let pinColor = '#F59E0B'; // Amber for No Website (Hot Lead)
      let ringColor = 'rgba(245, 158, 11, 0.4)';
      let badgeLabel = 'Tanpa Website';

      if (isContacted) {
        pinColor = '#388BFD'; // Blue
        ringColor = 'rgba(56, 139, 253, 0.4)';
        badgeLabel = 'Telah Dihubungi';
      } else if (!isNoWeb) {
        pinColor = '#10B981'; // Green for official website
        ringColor = 'rgba(16, 185, 129, 0.4)';
        badgeLabel = 'Punya Website';
      }

      // Create Custom HTML Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-lead-pin',
        html: `
          <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${ringColor}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: #111316; border: 2px solid ${pinColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); position: relative; z-index: 10;">
              <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: ${pinColor};"></div>
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([geo.lat, geo.lng], { icon: customIcon });

      // Create rich HTML popup content
      const popupHtml = `
        <div style="padding: 14px; min-width: 240px; max-width: 290px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${isNoWeb ? '#F59E0B20' : '#10B98120'}; color: ${isNoWeb ? '#F59E0B' : '#10B981'}; border: 1px solid ${isNoWeb ? '#F59E0B40' : '#10B98140'};">
              ${badgeLabel}
            </span>
            <span style="font-size: 11px; color: #E3B341; display: flex; align-items: center; gap: 2px; font-weight: 600;">
              ★ ${lead.rating || '4.5'} <span style="color: #7E8B99; font-size: 10px;">(${lead.reviewCount || 0})</span>
            </span>
          </div>

          <h4 style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin: 0 0 4px 0; line-height: 1.3;">
            ${lead.name}
          </h4>

          <div style="font-size: 11px; color: #58A6FF; margin-bottom: 6px; font-weight: 500;">
            ${lead.category || 'Bisnis & Jasa'}
          </div>

          <div style="font-size: 11px; color: #8B949E; margin-bottom: 8px; line-height: 1.4; border-top: 1px solid #24292E; padding-top: 6px;">
            📍 ${lead.address || geo.city}
          </div>

          ${lead.phone && lead.phone !== '-' ? `
            <div style="font-size: 11px; color: #D4FF44; font-family: monospace; margin-bottom: 10px;">
              📞 ${lead.phone}
            </div>
          ` : ''}

          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="${lead.mapsUrl}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #21262D; hover: background: #30363D; color: #C9D1D9; font-size: 10px; font-weight: 600; padding: 6px 8px; border-radius: 8px; text-decoration: none; border: 1px solid #30363D; display: inline-block;">
              Buka Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'dark-lead-popup'
      });

      marker.on('click', () => {
        setSelectedLead(lead);
      });

      markersGroup.addLayer(marker);
      bounds.extend([geo.lat, geo.lng]);
    });

    // Auto-fit bounds if we have points
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 14,
        animate: true
      });
    }
  }, [filteredLeads]);

  // Preset zoom navigation helpers
  const handleZoomPreset = (regionKey: string) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (regionKey === 'all') {
      if (filteredLeads.length > 0) {
        const bounds = L.latLngBounds(filteredLeads.map(l => [l.geo.lat, l.geo.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
          return;
        }
      }
      map.setView([-2.5, 118.0], 5);
    } else if (regionKey === 'jabodetabek') {
      map.setView([-6.2088, 106.8456], 11);
    } else if (regionKey === 'surabaya') {
      map.setView([-7.2575, 112.7521], 12);
    } else if (regionKey === 'bandung') {
      map.setView([-6.9175, 107.6191], 12);
    } else if (regionKey === 'jawa') {
      map.setView([-7.2, 110.0], 8);
    }
  };

  const handleFocusLead = (lead: BusinessLead) => {
    setSelectedLead(lead);
    if (!mapInstanceRef.current) return;
    const geo = resolveLeadGeoLocation(lead);
    mapInstanceRef.current.setView([geo.lat, geo.lng], 15, { animate: true });
  };

  return (
    <div className={`bg-[#16191D] border border-[#24292E] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 flex flex-col bg-[#0F1113]' : ''}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#24292E] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#111316]/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#58A6FF]/15 border border-[#58A6FF]/30 flex items-center justify-center text-[#58A6FF]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Peta Sebaran Geografis Leads
              </h3>
              <span className="bg-[#58A6FF]/20 text-[#58A6FF] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#58A6FF]/30">
                {filteredLeads.length} Titik Terpetakan
              </span>
            </div>
            <p className="text-xs text-[#7E8B99]">
              Visualisasi sebaran prospek bisnis lokal berdasarkan koordinat & wilayah kota
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City Filter Selector */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-[#1C2128] border border-[#30363D] text-[#C9D1D9] text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#58A6FF] cursor-pointer appearance-none pr-7"
            >
              <option value="all">Semua Kota ({citySummaries.length} Wilayah)</option>
              {citySummaries.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} ({c.count} prospek)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#7E8B99]">
              <Filter className="w-3 h-3" />
            </div>
          </div>

          {/* Website Status Filter */}
          <div className="flex items-center bg-[#1C2128] border border-[#30363D] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setWebsiteFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                websiteFilter === 'all'
                  ? 'bg-[#2D333B] text-white'
                  : 'text-[#7E8B99] hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setWebsiteFilter('no_website')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                websiteFilter === 'no_website'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold'
                  : 'text-[#7E8B99] hover:text-[#F59E0B]'
              }`}
              title="Prioritas prospek pembuatan website baru"
            >
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              Tanpa Web ({noWebsiteMapped})
            </button>
            <button
              onClick={() => setWebsiteFilter('has_website')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                websiteFilter === 'has_website'
                  ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                  : 'text-[#7E8B99] hover:text-[#10B981]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              Punya Web ({hasWebsiteMapped})
            </button>
          </div>

          {/* Map Layer Mode Toggle */}
          <button
            onClick={() => setActiveTileLayer(prev => prev === 'dark' ? 'voyager' : prev === 'voyager' ? 'osm' : 'dark')}
            className="p-1.5 rounded-xl bg-[#1C2128] hover:bg-[#2D333B] border border-[#30363D] text-[#C9D1D9] text-xs flex items-center gap-1 cursor-pointer"
            title={`Ganti Tema Peta (Saat ini: ${activeTileLayer.toUpperCase()})`}
          >
            <Layers className="w-4 h-4 text-[#58A6FF]" />
            <span className="hidden sm:inline uppercase text-[10px] font-mono">{activeTileLayer}</span>
          </button>

          {/* Fullscreen Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-[#1C2128] hover:bg-[#2D333B] border border-[#30363D] text-[#C9D1D9] cursor-pointer"
            title={isExpanded ? 'Kecilkan Peta' : 'Perbesar Peta (Fullscreen)'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Map Canvas and Side Info */}
      <div className={`relative ${isExpanded ? 'flex-1 flex flex-col md:flex-row min-h-0' : 'flex flex-col lg:flex-row'}`}>
        {/* The Leaflet Container */}
        <div className={`relative w-full ${isExpanded ? 'flex-1 h-full min-h-[400px]' : 'h-[360px] sm:h-[420px] lg:h-[460px] lg:flex-1'}`}>
          <div 
            ref={mapContainerRef} 
            className="w-full h-full z-0 outline-none"
            style={{ background: '#0D1117' }}
          />

          {/* Map Floating Navigation Controls */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-[#16191D]/90 backdrop-blur-md border border-[#30363D] rounded-xl p-1 shadow-lg">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="p-1.5 hover:bg-[#21262D] rounded-lg text-[#C9D1D9] hover:text-white transition cursor-pointer"
              title="Perbesar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="p-1.5 hover:bg-[#21262D] rounded-lg text-[#C9D1D9] hover:text-white transition cursor-pointer"
              title="Perkecil Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-px bg-[#30363D] my-0.5"></div>
            <button
              onClick={() => handleZoomPreset('all')}
              className="p-1.5 hover:bg-[#21262D] rounded-lg text-[#58A6FF] hover:text-white transition cursor-pointer"
              title="Reset Tampilan (Semua Titik)"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Region Presets Floating Bar */}
          <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1 bg-[#16191D]/90 backdrop-blur-md border border-[#30363D] rounded-xl p-1 shadow-lg text-[11px]">
            <span className="text-[#7E8B99] px-1.5 font-mono text-[10px]">Fokus:</span>
            <button
              onClick={() => handleZoomPreset('all')}
              className="px-2 py-0.5 hover:bg-[#21262D] rounded-md text-[#C9D1D9] hover:text-white transition cursor-pointer"
            >
              Semua
            </button>
            <button
              onClick={() => handleZoomPreset('jabodetabek')}
              className="px-2 py-0.5 hover:bg-[#21262D] rounded-md text-[#C9D1D9] hover:text-white transition cursor-pointer"
            >
              Jabodetabek
            </button>
            <button
              onClick={() => handleZoomPreset('surabaya')}
              className="px-2 py-0.5 hover:bg-[#21262D] rounded-md text-[#C9D1D9] hover:text-white transition cursor-pointer"
            >
              Surabaya
            </button>
            <button
              onClick={() => handleZoomPreset('bandung')}
              className="px-2 py-0.5 hover:bg-[#21262D] rounded-md text-[#C9D1D9] hover:text-white transition cursor-pointer"
            >
              Bandung
            </button>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-[#16191D]/90 backdrop-blur-md border border-[#30363D] rounded-xl px-3 py-2 shadow-lg text-[11px] flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"></span>
              <span className="text-[#C9D1D9]">Tanpa Web (Peluang)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <span className="text-[#C9D1D9]">Punya Website</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#388BFD]"></span>
              <span className="text-[#C9D1D9]">Telah Dihubungi</span>
            </div>
          </div>

          {/* Empty leads state overlay */}
          {leads.length === 0 && (
            <div className="absolute inset-0 z-20 bg-[#0F1113]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#58A6FF]/10 border border-[#58A6FF]/20 flex items-center justify-center text-[#58A6FF] mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Belum Ada Data Lokasi Leads</h4>
              <p className="text-xs text-[#7E8B99] max-w-sm mb-4">
                Jalankan ekstraksi bisnis di tab Simulator Scraping untuk memetakan sebaran lokasi bisnis dan prospek otomatis.
              </p>
              {onNavigateToSimulator && (
                <button
                  onClick={onNavigateToSimulator}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buka Simulator & Ekstrak Leads</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Side Panel: City Distribution & Lead Detail Focus */}
        <div className={`w-full ${isExpanded ? 'md:w-80 md:border-l' : 'lg:w-80 lg:border-l'} border-[#24292E] bg-[#111316] p-4 flex flex-col justify-between overflow-y-auto max-h-[380px] lg:max-h-none`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#24292E] pb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#58A6FF]" />
                Sebaran per Kota / Wilayah
              </span>
              <span className="text-[10px] font-mono text-[#7E8B99]">
                {citySummaries.length} Kota
              </span>
            </div>

            {/* City Summary Chips / List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {citySummaries.length > 0 ? (
                citySummaries.map(c => {
                  const isSelected = selectedCity.toLowerCase() === c.city.toLowerCase();
                  return (
                    <button
                      key={c.city}
                      onClick={() => {
                        setSelectedCity(isSelected ? 'all' : c.city);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([c.lat, c.lng], 12, { animate: true });
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#58A6FF]/15 border border-[#58A6FF]/40 text-white'
                          : 'bg-[#16191D] hover:bg-[#1F242B] border border-[#24292E] text-[#C9D1D9]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold block truncate">{c.city}</span>
                        <span className="text-[10px] text-[#F59E0B]">
                          {c.noWebsiteCount} tanpa web
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs bg-[#21262D] px-2 py-0.5 rounded-md text-white border border-[#30363D]">
                          {c.count}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-[#7E8B99] text-xs">
                  Tidak ada data kota ditemukan
                </div>
              )}
            </div>

            {/* Selected Lead Highlight Card */}
            {selectedLead && (
              <div className="mt-3 p-3 rounded-xl bg-[#16191D] border border-[#58A6FF]/30 space-y-2 animate-in fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#58A6FF] font-medium block truncate">
                      {selectedLead.category || 'Bisnis Lokal'}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">
                      {selectedLead.name}
                    </h5>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold shrink-0 ${
                    !selectedLead.hasOfficialWebsite
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  }`}>
                    {!selectedLead.hasOfficialWebsite ? 'Tanpa Web' : 'Punya Web'}
                  </span>
                </div>

                <div className="text-[11px] text-[#7E8B99] truncate">
                  📍 {selectedLead.address}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {onDirectWhatsApp && selectedLead.phone && selectedLead.phone !== '-' && (
                    <button
                      onClick={() => onDirectWhatsApp(selectedLead, 'website')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#22bf5b] text-[#0F1113] text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <a
                    href={selectedLead.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-[#C9D1D9] hover:text-white transition"
                    title="Buka Profil Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Insights */}
          <div className="mt-4 pt-3 border-t border-[#24292E] text-[11px] text-[#7E8B99] flex items-center justify-between">
            <span>Rasio Prospek Web:</span>
            <span className="font-mono font-bold text-[#F59E0B]">
              {totalMapped > 0 ? `${Math.round((noWebsiteMapped / totalMapped) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
