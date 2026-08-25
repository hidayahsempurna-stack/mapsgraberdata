import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  ExternalLink, 
  Phone, 
  Globe, 
  MessageCircle, 
  Copy, 
  Check, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  Calendar,
  Send,
  Sparkles,
  Edit3,
  AlertTriangle,
  History,
  Settings,
  Clock
} from 'lucide-react';
import { BusinessLead, LeadContactStatus, OutreachType, WhatsAppTemplate, OutreachRecord } from '../types';
import { 
  DEFAULT_WA_TEMPLATES, 
  renderWhatsAppMessage, 
  createWhatsAppDirectUrl, 
  cleanPhoneNumberForWhatsApp,
  extractCityFromAddress
} from '../utils/whatsappTemplates';
import { copyTextToClipboard } from '../utils/clipboard';

interface LeadDetailModalProps {
  lead: BusinessLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updatedLead: BusinessLead) => void;
  senderName: string;
  onUpdateSenderName: (name: string) => void;
  templates?: WhatsAppTemplate[];
  onOpenTemplateManager?: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
  senderName,
  onUpdateSenderName,
  templates = DEFAULT_WA_TEMPLATES,
  onOpenTemplateManager
}) => {
  if (!isOpen || !lead) return null;

  // Choose default outreach template type based on whether lead is medical or general
  const defaultTemplateType: OutreachType = lead.isMedicalLead ? 'rekam_medis' : 'website';
  const availableTemplates = templates.length > 0 ? templates : DEFAULT_WA_TEMPLATES;
  
  const initialMatching = availableTemplates.filter(t => t.type === defaultTemplateType);
  const initialTemplate = initialMatching[0] || availableTemplates[0];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplate.id);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [contactStatus, setContactStatus] = useState<LeadContactStatus>(lead.contactStatus || 'new');
  const [leadNotes, setLeadNotes] = useState<string>(lead.notes || '');
  const [activeOutreachTab, setActiveOutreachTab] = useState<OutreachType | 'all'>(defaultTemplateType);

  // Update active template when tab changes
  useEffect(() => {
    const matchingTemplates = activeOutreachTab === 'all' 
      ? availableTemplates 
      : availableTemplates.filter(t => t.type === activeOutreachTab);
    
    if (matchingTemplates.length > 0 && !matchingTemplates.some(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(matchingTemplates[0].id);
    }
  }, [activeOutreachTab, availableTemplates, selectedTemplateId]);

  // Sync rendered message when template, senderName or lead changes
  useEffect(() => {
    const currentTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
    if (currentTemplate) {
      const rendered = renderWhatsAppMessage(currentTemplate.template, lead, senderName);
      setCustomMessage(rendered);
    }
  }, [selectedTemplateId, senderName, lead, availableTemplates]);

  const phoneInfo = cleanPhoneNumberForWhatsApp(lead.phone);
  const city = lead.city || extractCityFromAddress(lead.address);
  const hasContactedBefore = !!lead.firstContactedAt;

  const handleStatusChange = (newStatus: LeadContactStatus) => {
    setContactStatus(newStatus);
    onUpdateLead({
      ...lead,
      contactStatus: newStatus,
      notes: leadNotes
    });
  };

  const handleSaveNotes = () => {
    onUpdateLead({
      ...lead,
      contactStatus,
      notes: leadNotes
    });
  };

  const handleCopyMessage = async () => {
    const success = await copyTextToClipboard(customMessage);
    if (success) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleCopyPhone = async () => {
    if (!lead.phone || lead.phone === '-') return;
    const success = await copyTextToClipboard(lead.phone);
    if (success) {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = createWhatsAppDirectUrl(lead.phone, customMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const activeTemplate = availableTemplates.find(t => t.id === selectedTemplateId);
    const outreachRecord: OutreachRecord = {
      id: `outreach_${Date.now()}`,
      timestamp: nowStr,
      templateName: activeTemplate?.name || 'Pesan Penawaran',
      type: activeTemplate?.type || 'website',
      phone: lead.phone,
      senderName
    };

    const newHistory = [...(lead.outreachHistory || []), outreachRecord];
    const newContactCount = (lead.outreachCount || 0) + 1;

    setContactStatus('contacted');
    onUpdateLead({
      ...lead,
      contactStatus: 'contacted',
      firstContactedAt: lead.firstContactedAt || nowStr,
      lastContactedAt: nowStr,
      outreachCount: newContactCount,
      lastOutreachType: activeTemplate?.type || 'website',
      outreachHistory: newHistory,
      notes: leadNotes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#2A3038] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              lead.isMedicalLead
                ? 'bg-[#58A6FF]/10 border-[#58A6FF]/30 text-[#58A6FF]'
                : 'bg-[#D4FF44]/10 border-[#D4FF44]/30 text-[#D4FF44]'
            }`}>
              {lead.isMedicalLead ? <Stethoscope className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-sans truncate max-w-md">{lead.name}</h3>
                {lead.isMedicalLead && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#58A6FF]/15 text-[#58A6FF] rounded border border-[#58A6FF]/30 font-semibold">
                    Klinik / Rekam Medis
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7E8B99] flex items-center gap-2 mt-0.5">
                <span>{lead.category || 'Bisnis Lokal'}</span>
                <span>&bull;</span>
                <span className="text-[#58A6FF] font-medium">{city}</span>
                <span>&bull;</span>
                <span className="flex items-center text-[#FFA116]">
                  <Star className="w-3 h-3 fill-current mr-0.5" />
                  {lead.rating} ({lead.reviewCount} ulasan)
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#7E8B99] hover:text-white p-1.5 rounded-lg hover:bg-[#1D2126] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner: Duplicate Outreach Prevention */}
        {hasContactedBefore && (
          <div className="bg-[#58A6FF]/10 border-b border-[#58A6FF]/25 px-6 py-2.5 flex items-center justify-between text-xs text-[#C5D1DE]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#58A6FF] flex-shrink-0" />
              <span>
                <strong className="text-white">Pernah Dihubungi:</strong> Penawaran pertama dikirim pada <strong className="text-[#58A6FF] font-mono">{lead.firstContactedAt}</strong> (Total: {lead.outreachCount || 1}x outreach).
              </span>
            </div>
            <span className="text-[10px] bg-[#58A6FF]/20 text-[#58A6FF] px-2 py-0.5 rounded font-mono font-bold">
              Sudah Pernah Di-chat
            </span>
          </div>
        )}

        {/* Modal Body - 2 Columns */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Data Breakdown & Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Status & Pipeline Card */}
            <div className="bg-[#101215] border border-[#24292E] rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Status Prospek</span>
                <span className="text-[10px] text-[#7E8B99] font-normal normal-case">Pipeline Follow-up</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleStatusChange('new')}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    contactStatus === 'new'
                      ? 'bg-[#1D2126] text-white border-[#5A6675]'
                      : 'bg-[#131518] text-[#7E8B99] border-[#24292E] hover:border-[#3A424B]'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#7E8B99] mr-1.5" />
                  Baru (Belum Hubungi)
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('contacted')}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    contactStatus === 'contacted'
                      ? 'bg-[#58A6FF]/15 text-[#58A6FF] border-[#58A6FF]/40'
                      : 'bg-[#131518] text-[#7E8B99] border-[#24292E] hover:border-[#3A424B]'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#58A6FF] mr-1.5" />
                  Sudah Dihubungi
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('interested')}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    contactStatus === 'interested'
                      ? 'bg-[#D4FF44]/15 text-[#D4FF44] border-[#D4FF44]/40'
                      : 'bg-[#131518] text-[#7E8B99] border-[#24292E] hover:border-[#3A424B]'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#D4FF44] mr-1.5" />
                  Tertarik / Diskusi
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('deal')}
                  className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                    contactStatus === 'deal'
                      ? 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/40'
                      : 'bg-[#131518] text-[#7E8B99] border-[#24292E] hover:border-[#3A424B]'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[#3FB950] mr-1.5" />
                  Closing / Deal
                </button>
              </div>
            </div>

            {/* Business Contact & Location Breakdown */}
            <div className="bg-[#101215] border border-[#24292E] rounded-xl p-4 space-y-3.5 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                Penjabaran Informasi Bisnis
              </h4>

              {/* Phone info */}
              <div className="space-y-1">
                <div className="text-[10px] text-[#7E8B99] flex items-center justify-between">
                  <span>Nomor Telepon / WhatsApp</span>
                  {phoneInfo.valid && (
                    <span className="text-[#D4FF44] font-mono text-[10px]">Format WA: +{phoneInfo.formatted}</span>
                  )}
                </div>
                <div className="flex items-center justify-between bg-[#16191D] p-2.5 rounded-lg border border-[#24292E]">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#D4FF44]" />
                    <span className="font-mono text-white font-bold">{lead.phone || '-'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleCopyPhone}
                      className="p-1 text-[#7E8B99] hover:text-white rounded hover:bg-[#24292E] transition cursor-pointer"
                      title="Salin Nomor"
                    >
                      {copiedPhone ? <Check className="w-3.5 h-3.5 text-[#D4FF44]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {lead.phone && lead.phone !== '-' && (
                      <a
                        href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                        className="p-1 text-[#7E8B99] hover:text-[#D4FF44] rounded hover:bg-[#24292E] transition"
                        title="Panggil Nomor"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <div className="text-[10px] text-[#7E8B99] flex items-center justify-between">
                  <span>Alamat Lengkap & Kota</span>
                  <span className="text-[#58A6FF] font-semibold">{city}</span>
                </div>
                <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#24292E] flex items-start space-x-2 text-[#C5D1DE] leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <span>{lead.address || '-'}</span>
                </div>
              </div>

              {/* Website Status Breakdown */}
              <div className="space-y-1">
                <div className="text-[10px] text-[#7E8B99]">Status Website & Profil Digital</div>
                <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#24292E] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      lead.hasOfficialWebsite
                        ? 'bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30'
                        : 'bg-[#FF4444]/15 text-[#FF6B6B] border border-[#FF4444]/30'
                    }`}>
                      {lead.hasOfficialWebsite ? 'Memiliki Web Resmi' : 'Belum Memiliki Website Resmi'}
                    </span>
                  </div>
                  {lead.detectedWebsite && (
                    <div className="text-[11px] text-[#7E8B99] truncate">
                      Link Terdeteksi: <span className="text-[#58A6FF] font-mono">{lead.detectedWebsite}</span>
                    </div>
                  )}
                  {lead.websiteNote && (
                    <div className="text-[11px] text-[#FFA116] bg-[#FFA116]/5 p-1.5 rounded border border-[#FFA116]/20">
                      {lead.websiteNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Outreach History Log */}
              {lead.outreachHistory && lead.outreachHistory.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-[#7E8B99] font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#58A6FF]" />
                    <span>Riwayat Pengiriman Pesan ({lead.outreachHistory.length}):</span>
                  </div>
                  <div className="bg-[#16191D] p-2 rounded-lg border border-[#24292E] space-y-1 max-h-24 overflow-y-auto">
                    {lead.outreachHistory.map((hist) => (
                      <div key={hist.id} className="text-[10px] text-[#9BA7B4] flex items-center justify-between border-b border-[#24292E]/60 pb-1 last:border-none last:pb-0">
                        <span className="font-mono text-[#E1E7EC]">{hist.timestamp}</span>
                        <span className="text-[#58A6FF] truncate max-w-[140px]">{hist.templateName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maps link */}
              {lead.mapsUrl && (
                <a
                  href={lead.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 w-full py-2 bg-[#16191D] hover:bg-[#1F242A] border border-[#24292E] rounded-lg text-white text-xs font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4FF44]" />
                  <span>Buka Profil Asli di Google Maps</span>
                </a>
              )}
            </div>

            {/* Sales Notes Input */}
            <div className="bg-[#101215] border border-[#24292E] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-[#D4FF44]" />
                  <span>Catatan Khusus Prospek</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="text-[10px] text-[#D4FF44] hover:underline cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
              <textarea
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Tulis catatan (misal: Sudah kontak via WA jam 10:00, pemilik minta di-follow up hari Senin depan)..."
                rows={3}
                className="w-full bg-[#16191D] border border-[#24292E] rounded-lg p-2 text-xs text-[#C5D1DE] placeholder:text-[#5A6675] focus:outline-none focus:border-[#D4FF44]"
              />
            </div>
          </div>

          {/* Right Column: WhatsApp Outreach Engine (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="bg-[#101215] border border-[#24292E] rounded-xl p-4 flex-1 flex flex-col space-y-4">
              {/* Category Template Switcher */}
              <div>
                <div className="text-[11px] font-bold text-white uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Pilihan Template Penawaran WA</span>
                  </span>
                  {onOpenTemplateManager && (
                    <button
                      type="button"
                      onClick={onOpenTemplateManager}
                      className="text-[10px] text-[#D4FF44] hover:underline flex items-center gap-1 cursor-pointer font-sans normal-case"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Kelola / Buat Template</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveOutreachTab('website')}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition cursor-pointer ${
                      activeOutreachTab === 'website'
                        ? 'border-[#D4FF44] bg-[#D4FF44]/10 text-white'
                        : 'border-[#24292E] bg-[#16191D] text-[#7E8B99] hover:text-[#C5D1DE]'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-[#D4FF44]" />
                    <div className="text-left">
                      <div className="font-bold text-xs">Pembuatan Website</div>
                      <div className="text-[10px] text-[#7E8B99]">Company Profile & Web Toko</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveOutreachTab('rekam_medis')}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition cursor-pointer ${
                      activeOutreachTab === 'rekam_medis'
                        ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-white'
                        : 'border-[#24292E] bg-[#16191D] text-[#7E8B99] hover:text-[#C5D1DE]'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-[#58A6FF]" />
                    <div className="text-left">
                      <div className="font-bold text-xs">Aplikasi Rekam Medis</div>
                      <div className="text-[10px] text-[#7E8B99]">RME & SIMKlinik SATUSEHAT</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sub-template choices */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#7E8B99] font-semibold">Pilih Variasi Template:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {availableTemplates
                    .filter(t => activeOutreachTab === 'all' ? true : t.type === activeOutreachTab)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                          selectedTemplateId === t.id
                            ? 'border-[#D4FF44] bg-[#16191D] text-white font-semibold'
                            : 'border-[#24292E] bg-[#131518] text-[#7E8B99] hover:border-[#3A424B]'
                        }`}
                      >
                        <div className="truncate text-xs">{t.name}</div>
                        {t.isCustom && (
                          <span className="text-[9px] text-[#A371F7] font-mono">Custom</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>

              {/* Sender Name Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] text-[#7E8B99] font-semibold">Nama Pengirim / Brand Agensi:</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => onUpdateSenderName(e.target.value)}
                    placeholder="Contoh: PT Medika Solusindo"
                    className="w-full bg-[#16191D] border border-[#24292E] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-[#5A6675] focus:outline-none focus:border-[#D4FF44] mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7E8B99] font-semibold">Target WhatsApp:</label>
                  <div className="mt-1 px-2.5 py-1.5 bg-[#16191D] border border-[#24292E] rounded-lg text-xs font-mono text-[#D4FF44]">
                    {phoneInfo.valid ? `+${phoneInfo.formatted}` : (lead.phone || 'Nomor Belum Ada')}
                  </div>
                </div>
              </div>

              {/* Editable Message Box */}
              <div className="flex-1 flex flex-col space-y-1.5 min-h-[160px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#7E8B99] font-semibold">
                    Pratinjau Pesan yang Akan Dikirim:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] text-[#D4FF44] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedMessage ? <Check className="w-3 h-3 text-[#D4FF44]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMessage ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                </div>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="w-full flex-1 bg-[#131518] border border-[#2A3038] rounded-xl p-3 text-xs text-[#E1E7EC] font-sans leading-relaxed focus:outline-none focus:border-[#25D366] resize-none"
                />
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  disabled={!lead.phone || lead.phone === '-'}
                  className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20BD5A] disabled:bg-[#24292E] disabled:text-[#5A6675] text-[#0F1113] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#25D366]/10"
                >
                  <Send className="w-4 h-4" />
                  <span>{hasContactedBefore ? 'Kirim Pesan WA Lagi' : 'Kirim via WhatsApp Langsung'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-3 px-4 bg-[#1D2126] hover:bg-[#252B32] border border-[#2A3038] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-4 h-4 text-[#D4FF44]" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Pesan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
