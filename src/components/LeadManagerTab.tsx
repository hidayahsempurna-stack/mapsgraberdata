import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Upload,
  Search, 
  Trash2, 
  MessageCircle, 
  ExternalLink, 
  MapPin, 
  Star, 
  Copy, 
  Check, 
  Sparkles,
  Building2,
  AlertCircle,
  Stethoscope,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
  Printer,
  BarChart3,
  Settings,
  History,
  Clock,
  Filter,
  RefreshCw,
  Database,
  Cloud,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Shield,
  Layers,
  Edit3,
  Map as MapIcon,
  Table as TableIcon
} from 'lucide-react';
import { BusinessLead, LeadContactStatus, WhatsAppTemplate, OutreachRecord } from '../types';
import { exportLeadsToCSV } from '../utils/csvExporter';
import { generateLeadsPDFReport } from '../utils/pdfExporter';
import { copyTextToClipboard } from '../utils/clipboard';
import { CSVImportModal } from './CSVImportModal';
import { LeadDetailModal } from './LeadDetailModal';
import { LeadAnalyticsChart } from './LeadAnalyticsChart';
import { InteractiveLeadsMap } from './InteractiveLeadsMap';
import { TemplateManagerModal } from './TemplateManagerModal';
import { BackupRestoreModal } from './BackupRestoreModal';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { useAuth } from '../context/AuthContext';
import { filterLeadsForUser } from '../utils/security';
import { 
  DEFAULT_WA_TEMPLATES, 
  renderWhatsAppMessage, 
  createWhatsAppDirectUrl, 
  cleanPhoneNumberForWhatsApp,
  extractCityFromAddress,
  getSavedWhatsAppTemplates,
  saveWhatsAppTemplates,
  resetWhatsAppTemplates
} from '../utils/whatsappTemplates';
import { safeStorage } from '../utils/storage';

interface LeadManagerTabProps {
  leads: BusinessLead[];
  setLeads: React.Dispatch<React.SetStateAction<BusinessLead[]>>;
}

export const LeadManagerTab: React.FC<LeadManagerTabProps> = ({ leads, setLeads }) => {
  const { userProfile, isRootAdmin } = useAuth();
  const [activeSubView, setActiveSubView] = useState<'table' | 'map' | 'analytics'>('table');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedContactFilter, setSelectedContactFilter] = useState<'all' | 'has_phone' | 'no_phone'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'medical' | 'general' | 'has_phone' | 'new' | 'contacted'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Selection State for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkStatusToApply, setBulkStatusToApply] = useState<LeadContactStatus>('contacted');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<BusinessLead | null>(null);
  
  // Custom templates state
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    return getSavedWhatsAppTemplates();
  });

  const [senderName, setSenderName] = useState<string>(() => {
    return safeStorage.getItem('wa_outreach_sender_name') || 'Tim Konsultan Digital';
  });

  const handleUpdateSenderName = (name: string) => {
    setSenderName(name);
    safeStorage.setItem('wa_outreach_sender_name', name);
  };

  const handleSaveTemplates = (newTemplates: WhatsAppTemplate[]) => {
    setTemplates(newTemplates);
    saveWhatsAppTemplates(newTemplates);
  };

  const handleResetTemplates = () => {
    const res = resetWhatsAppTemplates();
    setTemplates(res);
  };

  // Strictly user-scoped leads for multi-tenant data silo enforcement
  const userScopedLeads = useMemo(() => {
    return filterLeadsForUser(leads, userProfile, false);
  }, [leads, userProfile]);

  // Summary Metrics calculations strictly from user-isolated data
  const totalCount = userScopedLeads.length;
  const withPhoneCount = userScopedLeads.filter(l => l && l.phone && l.phone !== '-').length;
  const medicalCount = userScopedLeads.filter(l => l && l.isMedicalLead).length;
  const generalCount = totalCount - medicalCount;
  const contactedCount = userScopedLeads.filter(l => l && (l.firstContactedAt || l.contactStatus === 'contacted' || l.contactStatus === 'interested' || l.contactStatus === 'deal')).length;

  // Extract unique cities with lead counts
  const cityOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    userScopedLeads.forEach(l => {
      const city = l.city || extractCityFromAddress(l.address) || 'Lainnya';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [userScopedLeads]);

  // Extract unique categories with lead counts
  const categoryOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    userScopedLeads.forEach(l => {
      const cat = l.category?.trim() || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [userScopedLeads]);

  // Filter user leads safely
  const filteredLeads = useMemo(() => {
    return userScopedLeads.filter(lead => {
      if (!lead) return false;

      const leadCity = lead.city || extractCityFromAddress(lead.address);
      const leadName = (lead.name || '').toLowerCase();
      const leadCategory = (lead.category || '').toLowerCase();
      const leadAddress = (lead.address || '').toLowerCase();
      const leadPhone = (lead.phone || '').toLowerCase();
      const leadNotes = (lead.notes || '').toLowerCase();
      const searchLower = searchTerm.trim().toLowerCase();

      // Search matching
      const matchesSearch = !searchLower ||
        leadName.includes(searchLower) ||
        leadCategory.includes(searchLower) ||
        leadAddress.includes(searchLower) ||
        leadCity.toLowerCase().includes(searchLower) ||
        leadPhone.includes(searchLower) ||
        leadNotes.includes(searchLower);

      // Category filter
      const matchesCategory = selectedCategory === 'all' || lead.category === selectedCategory;

      // City filter
      const matchesCity = selectedCity === 'all' || leadCity === selectedCity;

      // Contact availability filter
      const hasPhone = !!(lead.phone && lead.phone !== '-');
      let matchesContact = true;
      if (selectedContactFilter === 'has_phone') matchesContact = hasPhone;
      else if (selectedContactFilter === 'no_phone') matchesContact = !hasPhone;

      // Status filter
      let matchesStatus = true;
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'new') {
          matchesStatus = (!lead.contactStatus || lead.contactStatus === 'new') && !lead.firstContactedAt;
        } else if (selectedStatusFilter === 'contacted') {
          matchesStatus = lead.contactStatus === 'contacted' || !!lead.firstContactedAt;
        } else {
          matchesStatus = lead.contactStatus === selectedStatusFilter;
        }
      }

      // Rating filter
      const ratingNum = parseFloat(String(lead.rating || 0)) || 0;
      const matchesRating = ratingNum >= minRating;

      // Segment quick filter
      let matchesSegment = true;
      if (selectedSegment === 'medical') {
        matchesSegment = !!lead.isMedicalLead;
      } else if (selectedSegment === 'general') {
        matchesSegment = !lead.isMedicalLead;
      } else if (selectedSegment === 'has_phone') {
        matchesSegment = hasPhone;
      } else if (selectedSegment === 'new') {
        matchesSegment = (!lead.contactStatus || lead.contactStatus === 'new') && !lead.firstContactedAt;
      } else if (selectedSegment === 'contacted') {
        matchesSegment = lead.contactStatus === 'contacted' || lead.contactStatus === 'interested' || lead.contactStatus === 'deal' || !!lead.firstContactedAt;
      }

      return matchesSearch && matchesCategory && matchesCity && matchesContact && matchesStatus && matchesRating && matchesSegment;
    });
  }, [userScopedLeads, searchTerm, selectedCategory, selectedCity, selectedContactFilter, selectedStatusFilter, minRating, selectedSegment]);


  // Bulk Selection Handlers
  const isAllFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.has(l.id));
  const isSomeFilteredSelected = filteredLeads.some(l => selectedLeadIds.has(l.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Unselect all filtered
      setSelectedLeadIds(prev => {
        const next = new Set(prev);
        filteredLeads.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedLeadIds(prev => {
        const next = new Set(prev);
        filteredLeads.forEach(l => next.add(l.id));
        return next;
      });
    }
  };

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkUpdateStatus = () => {
    if (selectedLeadIds.size === 0) return;
    setLeads(prev => prev.map(l => {
      if (selectedLeadIds.has(l.id)) {
        return {
          ...l,
          contactStatus: bulkStatusToApply
        };
      }
      return l;
    }));
  };

  const handleBulkExportCSV = () => {
    setExportError(null);
    try {
      const selectedLeads = leads.filter(l => selectedLeadIds.has(l.id));
      if (selectedLeads.length === 0) {
        setExportError('Pilih setidaknya satu lead untuk diekspor.');
        return;
      }
      exportLeadsToCSV(selectedLeads, { filterMode: 'all', customFilename: `gmaps_selected_leads_${selectedLeads.length}_${Date.now()}.csv` });
    } catch (err: any) {
      setExportError(err?.message || 'Gagal mengekspor data terpilih.');
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    setLeads(prev => prev.filter(l => !selectedLeadIds.has(l.id)));
    setSelectedLeadIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const handleExportCSV = () => {
    setExportError(null);
    try {
      if (filteredLeads.length === 0) {
        setExportError('Tidak ada data prospek yang cocok dengan filter untuk diekspor.');
        return;
      }
      exportLeadsToCSV(filteredLeads, { filterMode: 'all', customFilename: `gmaps_prospek_leads_${Date.now()}.csv` });
    } catch (err: any) {
      setExportError(err?.message || 'Gagal mengekspor CSV.');
    }
  };

  const handlePrintPDFReport = () => {
    if (filteredLeads.length === 0) {
      alert('Tidak ada data prospek yang cocok dengan filter untuk dicetak.');
      return;
    }
    const filterLabel = [
      selectedCity !== 'all' ? `Kota: ${selectedCity}` : '',
      selectedCategory !== 'all' ? `Kategori: ${selectedCategory}` : '',
      selectedSegment !== 'all' ? `Segment: ${selectedSegment}` : ''
    ].filter(Boolean).join(' | ') || 'Semua Data';

    generateLeadsPDFReport(filteredLeads, {
      title: 'Laporan Ringkasan Prospek Bisnis & Fasilitas Kesehatan',
      generatedBy: senderName,
      filterLabel
    });
  };

  const handleImportLeads = (newLeads: BusinessLead[], mode: 'merge' | 'replace') => {
    // Enrich with detected city if missing
    const enriched = newLeads.map(l => ({
      ...l,
      city: l.city || extractCityFromAddress(l.address)
    }));

    if (mode === 'replace') {
      setLeads(enriched);
      setSelectedLeadIds(new Set());
    } else {
      setLeads(prev => {
        const existingUrls = new Set(prev.map(l => l.mapsUrl));
        const nonDuplicates = enriched.filter(l => !existingUrls.has(l.mapsUrl));
        return [...prev, ...nonDuplicates];
      });
    }
  };

  const handleRestoreFromBackup = (restoredLeads: BusinessLead[], mode: 'merge' | 'replace') => {
    handleImportLeads(restoredLeads, mode);
  };

  const handleUpdateLead = (updatedLead: BusinessLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (selectedLeadForDetail && selectedLeadForDetail.id === updatedLead.id) {
      setSelectedLeadForDetail(updatedLead);
    }
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l && l.id !== id));
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleConfirmClearAll = () => {
    setLeads([]);
    setSelectedLeadIds(new Set());
    setShowClearConfirm(false);
  };

  const handleCopyPhone = async (id: string, phone: string) => {
    if (!phone || phone === '-') return;
    const success = await copyTextToClipboard(phone);
    if (success) {
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  };

  /**
   * Kirim pesan WhatsApp otomatis satu klik dengan pelacakan riwayat untuk mencegah duplikasi
   */
  const handleQuickWhatsApp = (lead: BusinessLead, type: 'website' | 'rekam_medis') => {
    const matchingTemplate = templates.find(t => t.type === type) || DEFAULT_WA_TEMPLATES.find(t => t.type === type) || DEFAULT_WA_TEMPLATES[0];
    const message = renderWhatsAppMessage(matchingTemplate.template, lead, senderName);
    const url = createWhatsAppDirectUrl(lead.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newRecord: OutreachRecord = {
      id: `outreach_${Date.now()}`,
      timestamp: nowStr,
      templateName: matchingTemplate.name,
      type,
      phone: lead.phone,
      senderName
    };

    const updatedHistory = [...(lead.outreachHistory || []), newRecord];
    const newCount = (lead.outreachCount || 0) + 1;

    handleUpdateLead({
      ...lead,
      contactStatus: 'contacted',
      firstContactedAt: lead.firstContactedAt || nowStr,
      lastContactedAt: nowStr,
      outreachCount: newCount,
      lastOutreachType: type,
      outreachHistory: updatedHistory
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedContactFilter('all');
    setSelectedStatusFilter('all');
    setSelectedSegment('all');
    setMinRating(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#16191D] border border-[#24292E] rounded-xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white font-sans">Database & Penjabaran Prospek</h2>
            <span className="bg-[#D4FF44]/15 text-[#D4FF44] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#D4FF44]/30 uppercase tracking-wider">
              {leads.length} Prospek Tersimpan
            </span>
          </div>
          <p className="text-xs text-[#9BA7B4] mt-1">
            Visualisasi analitik Recharts, sinkronisasi Google Sheets, backup database terenkripsi, filter & aksi bulk, serta otomasi WhatsApp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view switcher: Tabel | Peta Sebaran | Grafik Analitik */}
          <div className="flex items-center bg-[#111316] p-1 rounded-lg border border-[#24292E] gap-1">
            <button
              onClick={() => setActiveSubView('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                activeSubView === 'table'
                  ? 'bg-[#D4FF44] text-[#0F1113]'
                  : 'text-[#7E8B99] hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>

            <button
              onClick={() => setActiveSubView('map')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                activeSubView === 'map'
                  ? 'bg-[#D4FF44] text-[#0F1113]'
                  : 'text-[#7E8B99] hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta Sebaran</span>
            </button>

            <button
              onClick={() => setActiveSubView('analytics')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                activeSubView === 'analytics'
                  ? 'bg-[#D4FF44] text-[#0F1113]'
                  : 'text-[#7E8B99] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Grafik</span>
            </button>
          </div>

          {/* Google Sheets Sync Trigger */}
          <button
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0F9D58] hover:bg-[#12B867] rounded-lg shadow-sm transition cursor-pointer"
            title="Sinkronkan data leads ke Google Sheets Cloud"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Sheets Sync</span>
          </button>

          {/* Encrypted Backup & Restore Trigger */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#D4FF44] bg-[#D4FF44]/10 hover:bg-[#D4FF44]/20 border border-[#D4FF44]/30 rounded-lg transition cursor-pointer"
            title="Backup database terenkripsi kata sandi & Restore"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Backup</span>
          </button>

          {/* Template Manager Modal Trigger */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1D2126] hover:bg-[#252B32] border border-[#2A3038] rounded-lg transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Template WA</span>
          </button>

          {/* Import CSV */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1D2126] hover:bg-[#252B32] border border-[#3A424B] rounded-lg transition cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#D4FF44]" />
            <span>Import</span>
          </button>

          {/* Cetak / Unduh PDF */}
          <button
            onClick={handlePrintPDFReport}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#2563EB] border border-[#3B82F6]/50 rounded-lg transition disabled:opacity-40 cursor-pointer shadow-xs"
            title="Cetak Laporan Ringkasan ke Format PDF Rapi"
          >
            <Printer className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Download CSV */}
          <button
            id="exportCsvBtn"
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F1113] bg-[#D4FF44] hover:bg-[#E2FF70] rounded-lg shadow-sm transition disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Clear Database */}
          {leads.length > 0 && !showClearConfirm && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-[#FF4444] bg-[#FF4444]/10 hover:bg-[#FF4444]/20 border border-[#FF4444]/30 rounded-lg transition cursor-pointer"
              title="Hapus Seluruh Database"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {showClearConfirm && (
            <div className="inline-flex items-center gap-1.5 bg-[#131518] p-1 rounded-lg border border-[#FF4444]/40">
              <span className="text-[11px] text-[#FF6B6B] px-1.5">Hapus semua?</span>
              <button
                onClick={handleConfirmClearAll}
                className="px-2 py-1 bg-[#FF4444] text-white text-xs font-bold rounded hover:bg-[#FF5555] transition cursor-pointer"
              >
                Ya
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 bg-[#24292E] text-[#C5D1DE] text-xs rounded hover:bg-[#2F353C] transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Sub-View */}
      {activeSubView === 'map' && (
        <InteractiveLeadsMap
          leads={userScopedLeads}
          onDirectWhatsApp={(lead) => handleQuickWhatsApp(lead, 'website')}
          onSelectLead={(lead) => setSelectedLeadForDetail(lead)}
          senderName={senderName}
        />
      )}

      {/* Visual Analytics with Recharts Sub-View */}
      {activeSubView === 'analytics' && userScopedLeads.length > 0 && (
        <LeadAnalyticsChart leads={filteredLeads.length > 0 ? filteredLeads : userScopedLeads} />
      )}

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => setSelectedSegment('all')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            selectedSegment === 'all'
              ? 'bg-[#1D2126] border-[#D4FF44]/40 shadow-xs'
              : 'bg-[#16191D] border-[#24292E] hover:border-[#3A424B]'
          }`}
        >
          <div className="text-[10px] text-[#7E8B99] font-mono uppercase tracking-wider">Total Prospek</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{totalCount}</div>
          <div className="text-[10px] text-[#A0ACB9] mt-0.5">Database tersimpan</div>
        </div>

        <div 
          onClick={() => setSelectedSegment('has_phone')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            selectedSegment === 'has_phone'
              ? 'bg-[#1D2126] border-[#D4FF44]/40 shadow-xs'
              : 'bg-[#16191D] border-[#24292E] hover:border-[#3A424B]'
          }`}
        >
          <div className="text-[10px] text-[#7E8B99] font-mono uppercase tracking-wider flex items-center gap-1">
            <MessageCircle className="w-3 h-3 text-[#25D366]" />
            <span>Siap WhatsApp</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#D4FF44] mt-1">{withPhoneCount}</div>
          <div className="text-[10px] text-[#A0ACB9] mt-0.5">Memiliki nomor telepon</div>
        </div>

        <div 
          onClick={() => setSelectedSegment('medical')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            selectedSegment === 'medical'
              ? 'bg-[#1D2126] border-[#58A6FF]/40 shadow-xs'
              : 'bg-[#16191D] border-[#24292E] hover:border-[#3A424B]'
          }`}
        >
          <div className="text-[10px] text-[#7E8B99] font-mono uppercase tracking-wider flex items-center gap-1">
            <Stethoscope className="w-3 h-3 text-[#58A6FF]" />
            <span>Rekam Medis (RME)</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#58A6FF] mt-1">{medicalCount}</div>
          <div className="text-[10px] text-[#A0ACB9] mt-0.5">Klinik / Dokter / Faskes</div>
        </div>

        <div 
          onClick={() => setSelectedSegment('general')}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            selectedSegment === 'general'
              ? 'bg-[#1D2126] border-[#FFA116]/40 shadow-xs'
              : 'bg-[#16191D] border-[#24292E] hover:border-[#3A424B]'
          }`}
        >
          <div className="text-[10px] text-[#7E8B99] font-mono uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#FFA116]" />
            <span>Website Umum</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#FFA116] mt-1">{generalCount}</div>
          <div className="text-[10px] text-[#A0ACB9] mt-0.5">Bisnis & Toko Lokal</div>
        </div>

        <div 
          onClick={() => setSelectedSegment('contacted')}
          className={`p-3 rounded-xl border col-span-2 sm:col-span-1 transition cursor-pointer ${
            selectedSegment === 'contacted'
              ? 'bg-[#1D2126] border-[#3FB950]/40 shadow-xs'
              : 'bg-[#16191D] border-[#24292E] hover:border-[#3A424B]'
          }`}
        >
          <div className="text-[10px] text-[#7E8B99] font-mono uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#3FB950]" />
            <span>Sudah Dihubungi</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#3FB950] mt-1">{contactedCount}</div>
          <div className="text-[10px] text-[#A0ACB9] mt-0.5">Pernah dikirimkan pesan</div>
        </div>
      </div>

      {exportError && (
        <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 rounded-lg text-xs text-[#FF6B6B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{exportError}</span>
          </div>
          <button onClick={() => setExportError(null)} className="text-xs ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Bulk Action Bar (Visible when leads are selected) */}
      {selectedLeadIds.size > 0 && (
        <div className="bg-[#1C2128] border border-[#58A6FF]/50 rounded-xl p-3.5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center space-x-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-[#58A6FF]/20 border border-[#58A6FF]/40 flex items-center justify-center text-[#58A6FF] font-bold font-mono">
              {selectedLeadIds.size}
            </div>
            <div>
              <span className="font-bold text-white">
                {selectedLeadIds.size} Leads Terpilih
              </span>
              <span className="text-[#9BA7B4] text-[11px] ml-1">
                (dari {filteredLeads.length} yang tampil)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Update Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#131518] p-1 rounded-lg border border-[#2A3038]">
              <span className="text-[10px] text-[#7E8B99] px-1 font-semibold">Ubah Status:</span>
              <select
                value={bulkStatusToApply}
                onChange={(e) => setBulkStatusToApply(e.target.value as LeadContactStatus)}
                className="bg-[#1C2128] text-[#E1E7EC] text-xs px-2 py-1 rounded border border-[#2A3038] focus:outline-none focus:border-[#58A6FF]"
              >
                <option value="new">Baru (Belum Kontak)</option>
                <option value="contacted">Sudah Dihubungi</option>
                <option value="interested">Tertarik / Follow-up</option>
                <option value="deal">Closing / Deal</option>
                <option value="not_interested">Tidak Tertarik</option>
              </select>
              <button
                onClick={handleBulkUpdateStatus}
                className="px-2.5 py-1 bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] font-bold rounded text-xs transition cursor-pointer"
              >
                Terapkan
              </button>
            </div>

            {/* Bulk CSV Export */}
            <button
              onClick={handleBulkExportCSV}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#D4FF44]/15 hover:bg-[#D4FF44]/25 text-[#D4FF44] border border-[#D4FF44]/40 rounded-lg font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Terpilih CSV</span>
            </button>

            {/* Bulk Delete */}
            {!showBulkDeleteConfirm ? (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF4444]/15 hover:bg-[#FF4444]/25 text-[#FF6B6B] border border-[#FF4444]/40 rounded-lg font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-[#131518] p-1 rounded-lg border border-[#FF4444]/50">
                <span className="text-[11px] text-[#FF6B6B] px-1">Yakin hapus {selectedLeadIds.size}?</span>
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 bg-[#FF4444] text-white font-bold rounded text-xs hover:bg-[#FF5555] transition cursor-pointer"
                >
                  Ya
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-2 py-0.5 bg-[#24292E] text-[#C5D1DE] rounded text-xs hover:bg-[#30363D] transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            {/* Deselect All */}
            <button
              onClick={() => setSelectedLeadIds(new Set())}
              className="px-2 py-1 text-[#7E8B99] hover:text-white text-xs cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filter and Search Bar */}
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm space-y-3.5">
        {/* Quick Segment Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24292E] pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[#7E8B99] font-semibold mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filter Cepat:</span>
            </span>
            <button
              onClick={() => setSelectedSegment('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedSegment === 'all'
                  ? 'bg-[#D4FF44] text-[#0F1113]'
                  : 'bg-[#131518] text-[#7E8B99] hover:text-white border border-[#24292E]'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setSelectedSegment('medical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedSegment === 'medical'
                  ? 'bg-[#58A6FF] text-[#0F1113]'
                  : 'bg-[#131518] text-[#58A6FF] hover:bg-[#58A6FF]/10 border border-[#58A6FF]/30'
              }`}
            >
              <Stethoscope className="w-3 h-3" />
              <span>Klinik & RME ({medicalCount})</span>
            </button>
            <button
              onClick={() => setSelectedSegment('general')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedSegment === 'general'
                  ? 'bg-[#FFA116] text-[#0F1113]'
                  : 'bg-[#131518] text-[#FFA116] hover:bg-[#FFA116]/10 border border-[#FFA116]/30'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Web Umum ({generalCount})</span>
            </button>
            <button
              onClick={() => setSelectedSegment('has_phone')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedSegment === 'has_phone'
                  ? 'bg-[#25D366] text-[#0F1113]'
                  : 'bg-[#131518] text-[#25D366] hover:bg-[#25D366]/10 border border-[#25D366]/30'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>Ada No WA ({withPhoneCount})</span>
            </button>
            <button
              onClick={() => setSelectedSegment('new')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedSegment === 'new'
                  ? 'bg-[#7E8B99] text-white'
                  : 'bg-[#131518] text-[#7E8B99] hover:text-white border border-[#24292E]'
              }`}
            >
              Belum Kontak ({totalCount - contactedCount})
            </button>
          </div>

          {(searchTerm || selectedCategory !== 'all' || selectedCity !== 'all' || selectedContactFilter !== 'all' || selectedStatusFilter !== 'all' || minRating > 0 || selectedSegment !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-[#D4FF44] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Detailed Search & Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Search Box (Spans 2 columns on large) */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#7E8B99] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama bisnis, alamat, kota, atau nomor HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#131518] border border-[#2A3038] text-white rounded-lg focus:outline-none focus:border-[#D4FF44] placeholder-[#5A6675]"
            />
          </div>

          {/* City / Location Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#131518] border border-[#2A3038] text-[#E1E7EC] rounded-lg focus:outline-none focus:border-[#D4FF44]"
            >
              <option value="all">📍 Semua Kota ({cityOptions.length})</option>
              {cityOptions.map(([city, count]) => (
                <option key={city} value={city}>
                  {city} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#131518] border border-[#2A3038] text-[#E1E7EC] rounded-lg focus:outline-none focus:border-[#D4FF44]"
            >
              <option value="all">🏢 Semua Kategori ({categoryOptions.length})</option>
              {categoryOptions.map(([cat, count]) => (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Contact / WhatsApp Status Filter */}
          <div>
            <select
              value={selectedContactFilter}
              onChange={(e) => setSelectedContactFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#131518] border border-[#2A3038] text-[#E1E7EC] rounded-lg focus:outline-none focus:border-[#D4FF44]"
            >
              <option value="all">📞 Status Kontak (Semua)</option>
              <option value="has_phone">✓ Ada Nomor HP / WA</option>
              <option value="no_phone">✕ Tanpa Nomor Kontak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl shadow-sm overflow-hidden">
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131518] text-[#7E8B99] font-mono border-b border-[#24292E] uppercase tracking-wider text-[11px]">
                <tr>
                  {/* Bulk Select All Checkbox */}
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-[#7E8B99] hover:text-[#D4FF44] transition cursor-pointer flex items-center justify-center mx-auto"
                      title={isAllFilteredSelected ? 'Batalkan pilihan semua' : 'Pilih semua yang tampil'}
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#D4FF44]" />
                      ) : isSomeFilteredSelected ? (
                        <div className="w-3.5 h-3.5 bg-[#D4FF44] rounded-xs" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Nama Bisnis & Kategori</th>
                  <th className="py-3 px-4">Kota & Alamat</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Kontak Telepon</th>
                  <th className="py-3 px-4">Status & Riwayat WA</th>
                  <th className="py-3 px-4 text-right">Aksi Penawaran WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24292E] text-[#C5D1DE]">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  const phoneInfo = cleanPhoneNumberForWhatsApp(lead.phone);
                  const isMed = lead.isMedicalLead;
                  const city = lead.city || extractCityFromAddress(lead.address);
                  const isContacted = !!lead.firstContactedAt || lead.contactStatus === 'contacted' || lead.contactStatus === 'interested' || lead.contactStatus === 'deal';

                  return (
                    <tr 
                      key={lead.id} 
                      className={`transition ${
                        isSelected 
                          ? 'bg-[#58A6FF]/10 border-l-2 border-l-[#58A6FF]' 
                          : 'hover:bg-[#1D2126]/70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectLead(lead.id)}
                          className="text-[#7E8B99] hover:text-[#D4FF44] transition cursor-pointer flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#D4FF44]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name and Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadForDetail(lead)}
                            className="font-bold text-white hover:text-[#D4FF44] transition text-left cursor-pointer flex items-center group"
                          >
                            <span>{lead.name || 'Bisnis Tanpa Nama'}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition ml-0.5 text-[#D4FF44]" />
                          </button>
                        </div>
                        <div className="text-[11px] text-[#7E8B99] mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="bg-[#1D2126] text-[#A0ACB9] border border-[#2A3038] px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {lead.category || 'Bisnis Lokal'}
                          </span>
                          {isMed ? (
                            <span className="bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/30 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />
                              <span>Klinik / Faskes Medis</span>
                            </span>
                          ) : (
                            <span className="text-[#FFA116] font-mono text-[10px]">• Tanpa Web Resmi</span>
                          )}
                        </div>
                      </td>

                      {/* City & Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-[#58A6FF] flex-shrink-0" />
                          <span>{city}</span>
                        </div>
                        <div className="text-[11px] text-[#7E8B99] truncate mt-0.5" title={lead.address}>
                          {lead.address || '-'}
                        </div>
                      </td>

                      {/* Rating & Reviews */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-semibold text-white font-mono">
                          <Star className="w-3.5 h-3.5 text-[#FFB800] fill-current" />
                          <span>{lead.rating || '0'}</span>
                          <span className="text-[#7E8B99] font-normal font-sans">({lead.reviewCount || 0})</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {lead.phone && lead.phone !== '-' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[#E1E7EC]">{lead.phone}</span>
                            <button
                              onClick={() => handleCopyPhone(lead.id, lead.phone)}
                              className="p-1 text-[#7E8B99] hover:text-[#D4FF44] rounded transition cursor-pointer"
                              title="Salin Nomor Telepon"
                            >
                              {copiedPhoneId === lead.id ? (
                                <Check className="w-3.5 h-3.5 text-[#D4FF44]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#5A6675] font-mono">-</span>
                        )}
                      </td>

                      {/* Contact Status & History Badge (Anti-duplikasi) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {lead.contactStatus === 'deal' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30 rounded text-[10px] font-bold">
                              <span>✓ Deal Closing</span>
                            </span>
                          ) : lead.contactStatus === 'interested' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4FF44]/15 text-[#D4FF44] border border-[#D4FF44]/30 rounded text-[10px] font-bold">
                              <span>★ Tertarik</span>
                            </span>
                          ) : isContacted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/30 rounded text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sudah Di-chat</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1D2126] text-[#7E8B99] border border-[#2A3038] rounded text-[10px]">
                              <span>Belum Kontak</span>
                            </span>
                          )}

                          {lead.firstContactedAt && (
                            <div className="text-[9px] text-[#7E8B99] font-mono flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-[#58A6FF]" />
                              <span>{lead.firstContactedAt} ({lead.outreachCount || 1}x)</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol WA: Website */}
                          <button
                            onClick={() => handleQuickWhatsApp(lead, 'website')}
                            disabled={!phoneInfo.valid}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#D4FF44]/10 text-[#D4FF44] hover:bg-[#D4FF44]/20 border border-[#D4FF44]/30 rounded-md font-semibold text-[11px] transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Kirim Penawaran Pembuatan Website via WhatsApp"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>WA Website</span>
                          </button>

                          {/* Tombol WA: Rekam Medis */}
                          <button
                            onClick={() => handleQuickWhatsApp(lead, 'rekam_medis')}
                            disabled={!phoneInfo.valid}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20 border border-[#58A6FF]/30 rounded-md font-semibold text-[11px] transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Kirim Penawaran Aplikasi Rekam Medis (RME & SIMKlinik) via WhatsApp"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>WA Rekam Medis</span>
                          </button>

                          {/* Tombol Penjabaran Detail Data */}
                          <button
                            onClick={() => setSelectedLeadForDetail(lead)}
                            className="p-1.5 text-[#7E8B99] hover:text-[#D4FF44] hover:bg-[#1D2126] rounded-md transition cursor-pointer"
                            title="Buka Penjabaran Data & Riwayat WhatsApp"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Google Maps link */}
                          <a
                            href={lead.mapsUrl || 'https://maps.google.com'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#7E8B99] hover:text-white hover:bg-[#1D2126] rounded-md transition"
                            title="Buka di Google Maps"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Delete lead */}
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 text-[#7E8B99] hover:text-[#FF4444] hover:bg-[#FF4444]/10 rounded-md transition cursor-pointer"
                            title="Hapus Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center text-[#7E8B99] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#131518] border border-[#24292E] mx-auto flex items-center justify-center text-[#7E8B99]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Tidak Ada Prospek yang Sesuai Filter</p>
              <p className="text-xs text-[#7E8B99] mt-1 max-w-sm mx-auto">
                {leads.length === 0 
                  ? 'Klik tombol "Import CSV" atau "Restore" di atas untuk memasukkan file data prospek hasil scrape Google Maps Anda.'
                  : 'Coba ubah kata kunci pencarian, pilih kota lain, atau klik "Reset Semua Filter".'}
              </p>
            </div>
            {leads.length > 0 ? (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#24292E] hover:bg-[#30363D] text-white text-xs font-semibold rounded-lg transition cursor-pointer mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import File CSV</span>
                </button>
                <button
                  onClick={() => setIsBackupModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D2126] hover:bg-[#252B32] border border-[#3A424B] text-[#58A6FF] text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Restore dari File Backup</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSV Schema Card */}
      <div className="bg-[#131518] border border-[#24292E] rounded-xl p-4 text-xs text-[#9BA7B4]">
        <div className="font-semibold text-white mb-1 flex items-center gap-1.5 font-mono">
          <Sparkles className="w-4 h-4 text-[#D4FF44]" />
          <span>Format CSV Kompatibel & Alur Otomasi Outreach:</span>
        </div>
        <p className="text-[11px] text-[#7E8B99] mb-2">
          Sistem otomatis mengenali file CSV hasil ekstensi Google Maps atau tabel mandiri dengan kolom standar:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-mono text-[11px]">
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">1. Nama Bisnis</div>
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">2. Kategori</div>
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">3. Rating</div>
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">4. Jumlah Ulasan</div>
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">5. Alamat & Kota</div>
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">6. Telepon</div>
          <div className="bg-[#16191D] border border-[#24292E] rounded p-1.5 text-center font-semibold text-[#D4FF44]">7. URL Maps</div>
        </div>
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportLeads}
        existingCount={leads.length}
      />

      {/* WhatsApp Template Manager Modal */}
      <TemplateManagerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onSaveTemplates={handleSaveTemplates}
        onResetTemplates={handleResetTemplates}
      />

      {/* Encrypted Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        leads={leads}
        onRestoreLeads={handleRestoreFromBackup}
      />

      {/* Google Sheets Cloud Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        leads={leads}
      />

      {/* Lead Detail & WhatsApp Outreach Modal */}
      <LeadDetailModal
        lead={selectedLeadForDetail}
        isOpen={!!selectedLeadForDetail}
        onClose={() => setSelectedLeadForDetail(null)}
        onUpdateLead={handleUpdateLead}
        senderName={senderName}
        onUpdateSenderName={handleUpdateSenderName}
        templates={templates}
        onOpenTemplateManager={() => setIsTemplateModalOpen(true)}
      />
    </div>
  );
};
