import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Layers, 
  Users, 
  Star, 
  ShieldCheck, 
  Flame,
  Calendar,
  Zap,
  ExternalLink,
  MessageCircle,
  Save,
  Check,
  AlertCircle,
  Send,
  Settings
} from 'lucide-react';
import { BusinessLead } from '../types';
import { useAuth } from '../context/AuthContext';
import { extractCityFromAddress } from '../utils/whatsappTemplates';
import { LeadsGeoMap } from './LeadsGeoMap';
import { 
  fetchAdminWhatsAppPhone, 
  updateAdminWhatsAppPhone, 
  getAdminWhatsAppPhoneSync,
  ROOT_ADMIN_EMAIL 
} from '../firebase/teamService';

interface OverviewDashboardTabProps {
  leads: BusinessLead[];
  setLeads?: React.Dispatch<React.SetStateAction<BusinessLead[]>>;
  onNavigateToTab?: (tab: 'simulator' | 'leads' | 'code' | 'guide' | 'overview') => void;
  onNavigateToSimulator?: () => void;
  onNavigateToLeads?: () => void;
  onNavigateToGuide?: () => void;
  onDirectWhatsApp?: (lead: BusinessLead, templateType?: 'website' | 'rekam_medis') => void;
  onOpenTeamManager?: () => void;
}

export const OverviewDashboardTab: React.FC<OverviewDashboardTabProps> = ({
  leads,
  setLeads,
  onNavigateToTab,
  onNavigateToSimulator,
  onNavigateToLeads,
  onNavigateToGuide,
  onDirectWhatsApp,
  onOpenTeamManager
}) => {
  const { userProfile, isRootAdmin } = useAuth();

  // Super Admin WhatsApp Phone State
  const [adminPhone, setAdminPhone] = useState<string>(getAdminWhatsAppPhoneSync());
  const [phoneInput, setPhoneInput] = useState<string>(getAdminWhatsAppPhoneSync());
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);
  const [phoneSaveSuccess, setPhoneSaveSuccess] = useState<string | null>(null);
  const [phoneSaveError, setPhoneSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isRootAdmin || userProfile?.isRootAdmin) {
      fetchAdminWhatsAppPhone().then(phone => {
        setAdminPhone(phone);
        setPhoneInput(phone);
      });
    }
  }, [isRootAdmin, userProfile?.isRootAdmin]);

  const handleSaveAdminPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneSaveSuccess(null);
    setPhoneSaveError(null);
    setIsSavingPhone(true);

    try {
      const res = await updateAdminWhatsAppPhone(phoneInput);
      if (res.success) {
        setAdminPhone(res.formattedPhone);
        setPhoneInput(res.formattedPhone);
        setPhoneSaveSuccess(`Nomor WhatsApp Admin berhasil diperbarui menjadi +${res.formattedPhone}`);
        setTimeout(() => setPhoneSaveSuccess(null), 5000);
      } else {
        setPhoneSaveError(res.error || 'Gagal menyimpan nomor WhatsApp.');
      }
    } catch (err: any) {
      setPhoneSaveError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleTestChatAdmin = () => {
    const clean = phoneInput.trim().replace(/[^0-9]/g, '') || adminPhone;
    const testMsg = `Halo Super Admin (${ROOT_ADMIN_EMAIL}), ini adalah pesan uji integrasi WhatsApp dari Google Maps Lead Scraper dashboard.`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(testMsg)}`, '_blank');
  };

  const handleGoToSimulator = () => {
    if (onNavigateToSimulator) onNavigateToSimulator();
    else if (onNavigateToTab) onNavigateToTab('simulator');
  };

  const handleGoToLeads = () => {
    if (onNavigateToLeads) onNavigateToLeads();
    else if (onNavigateToTab) onNavigateToTab('leads');
  };

  const handleGoToGuide = () => {
    if (onNavigateToGuide) onNavigateToGuide();
    else if (onNavigateToTab) onNavigateToTab('guide');
  };


  // Metrics calculation strictly from user's leads
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => l.contactStatus === 'contacted' || l.contactStatus === 'deal');
  const noWebsiteLeads = leads.filter(l => !l.hasOfficialWebsite);
  const dealLeads = leads.filter(l => l.contactStatus === 'deal');
  const interestedLeads = leads.filter(l => l.contactStatus === 'interested');

  // Prospek yang perlu ditindaklanjuti hari ini (Priority queue)
  // 1. Prospek 'interested' yang perlu closing
  // 2. Prospek 'new' tanpa website dengan rating tinggi
  // 3. Prospek 'contacted' yang belum di-follow up lebih dari 2 hari
  const priorityFollowUpLeads = leads
    .filter(l => {
      if (l.contactStatus === 'interested') return true;
      if (!l.contactStatus || l.contactStatus === 'new') return !l.hasOfficialWebsite;
      if (l.contactStatus === 'contacted') return true;
      return false;
    })
    .slice(0, 6);

  // Conversion rates
  const outreachRate = totalLeads > 0 ? Math.round((contactedLeads.length / totalLeads) * 100) : 0;
  const noWebOpportunityRate = totalLeads > 0 ? Math.round((noWebsiteLeads.length / totalLeads) * 100) : 0;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  leads.forEach(l => {
    const cat = l.category || 'Lainnya';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Personal Profile Summary */}
      <div className="bg-gradient-to-r from-[#16191D] via-[#1A1F26] to-[#16191D] border border-[#24292E] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#D4FF44]/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-[#D4FF44]/15 text-[#D4FF44] border border-[#D4FF44]/30 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Workspace Personal Terverifikasi
              </span>
              <span className="text-[10px] text-[#7E8B99] font-mono">
                {userProfile?.isRootAdmin ? 'ROOT SUPER ADMIN' : 'AKSES TIM RESMI'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Selamat Datang, <span className="text-[#D4FF44]">{userProfile?.displayName || 'Pengguna'}</span> 👋
            </h2>

            <p className="text-xs sm:text-sm text-[#A0ACB9] max-w-2xl">
              Dashboard personal untuk memantau prospek scraping Google Maps, pelacakan interaksi WhatsApp, dan peluang konversi penawaran website lokal Anda.
            </p>
          </div>

          {/* Quick Action Buttons in Banner */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGoToSimulator}
              className="inline-flex items-center gap-2 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mulai Scraping</span>
            </button>

            <button
              onClick={handleGoToLeads}
              className="inline-flex items-center gap-2 bg-[#1F242B] hover:bg-[#2A313A] border border-[#2E353D] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#58A6FF]" />
              <span>Buka Database Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Control Panel: Configure Admin WhatsApp Phone */}
      {(isRootAdmin || userProfile?.isRootAdmin) && (
        <div className="bg-[#16191D] border-2 border-[#58A6FF]/40 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24292E] pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-sans">
                    Pengaturan WhatsApp Administrator
                  </h3>
                  <span className="bg-[#58A6FF]/20 text-[#58A6FF] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#58A6FF]/30">
                    SUPER ADMIN
                  </span>
                </div>
                <p className="text-xs text-[#7E8B99]">
                  Nomor ini digunakan sebagai tujuan penerimaan permohonan lisensi tim, bantuan login, dan kontak resmi.
                </p>
              </div>
            </div>

            {onOpenTeamManager && (
              <button
                onClick={onOpenTeamManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F242B] hover:bg-[#2A313A] border border-[#2E353D] text-[#C5D1DE] text-xs font-semibold cursor-pointer transition self-start sm:self-auto"
              >
                <Users className="w-3.5 h-3.5 text-[#58A6FF]" />
                <span>Buka Kelola Tim & Permohonan</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveAdminPhone} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7E8B99]">
                <Phone className="w-4 h-4 text-[#25D366]" />
              </div>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Contoh: 081234567890 atau 6281234567890"
                className="w-full bg-[#111316] border border-[#2A3038] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#555E68] focus:outline-none focus:border-[#58A6FF] font-mono tracking-wide"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSavingPhone}
                className="inline-flex items-center justify-center gap-2 bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSavingPhone ? (
                  <div className="w-4 h-4 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Nomor WA</span>
              </button>

              <button
                type="button"
                onClick={handleTestChatAdmin}
                className="inline-flex items-center justify-center gap-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold px-3.5 py-2.5 rounded-xl transition cursor-pointer shrink-0"
                title="Buka Chat WhatsApp untuk menguji nomor ini"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Uji Chat</span>
              </button>
            </div>
          </form>

          {/* Feedback message */}
          {phoneSaveSuccess && (
            <div className="bg-[#3FB950]/10 border border-[#3FB950]/30 p-2.5 rounded-xl text-xs text-[#3FB950] flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 shrink-0" />
              <span>{phoneSaveSuccess}</span>
            </div>
          )}

          {phoneSaveError && (
            <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-2.5 rounded-xl text-xs text-[#FF6B6B] flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{phoneSaveError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between text-[11px] text-[#7E8B99] gap-2 pt-1 border-t border-[#1F242B]">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#25D366]" />
              Nomor WhatsApp Aktif: <strong className="text-white">+{adminPhone}</strong>
            </span>
            <span>Tersinkronisasi otomatis di Cloud Firestore & browser storage</span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads Managed */}
        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm hover:border-[#2E353D] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7E8B99] font-semibold">Total Leads Dikelola</span>
            <div className="w-8 h-8 rounded-lg bg-[#58A6FF]/10 text-[#58A6FF] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalLeads}</span>
            <span className="text-[11px] text-[#7E8B99]">Bisnis</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#3FB950]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tersimpan di Cloud Database</span>
          </div>
        </div>

        {/* Contacted / Outreach Done */}
        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm hover:border-[#2E353D] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7E8B99] font-semibold">Berhasil Dihubungi (WA)</span>
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{contactedLeads.length}</span>
            <span className="text-[11px] text-[#25D366] font-mono font-semibold">({outreachRate}% Rasio)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#A0ACB9]">
            <span>{dealLeads.length} Deal Closing &bull; {interestedLeads.length} Tertarik</span>
          </div>
        </div>

        {/* Priority Follow-up Needed Today */}
        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm hover:border-[#2E353D] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7E8B99] font-semibold">Perlu Tindak Lanjut Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFC107]/10 text-[#FFC107] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FFC107] font-mono">
              {priorityFollowUpLeads.length}
            </span>
            <span className="text-[11px] text-[#7E8B99]">Antrean</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#FFC107]">
            <Clock className="w-3.5 h-3.5" />
            <span>Prioritas penawaran cepat</span>
          </div>
        </div>

        {/* Potential Target (No Website) */}
        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm hover:border-[#2E353D] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7E8B99] font-semibold">Peluang Tanpa Website</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF5B5B]/10 text-[#FF5B5B] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FF5B5B] font-mono">{noWebsiteLeads.length}</span>
            <span className="text-[11px] text-[#D4FF44] font-mono font-semibold">({noWebOpportunityRate}%)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#A0ACB9]">
            <span>Target utama pembuatan website</span>
          </div>
        </div>
      </div>

      {/* Interactive Geographic Map Component for Leads Distribution */}
      <LeadsGeoMap
        leads={leads}
        onDirectWhatsApp={onDirectWhatsApp}
        onNavigateToSimulator={onNavigateToSimulator}
      />

      {/* Main Content Split: Priority Follow-Up Queue & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Follow-Up Leads Queue */}
        <div className="lg:col-span-2 bg-[#16191D] border border-[#24292E] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#24292E] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4FF44]/10 text-[#D4FF44] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Antrean Tindak Lanjut Hari Ini (Direct WA)</h3>
                <p className="text-[11px] text-[#7E8B99]">
                  Klik tombol WA untuk langsung membuka chat penawaran dan menandai status otomatis
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToLeads}
              className="text-xs text-[#58A6FF] hover:text-[#79B8FF] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List of priority leads */}
          <div className="space-y-2.5">
            {priorityFollowUpLeads.map((lead) => {
              const city = lead.city || extractCityFromAddress(lead.address);
              const isContacted = lead.contactStatus === 'contacted' || lead.contactStatus === 'deal';

              return (
                <div
                  key={lead.id || lead.name}
                  className="bg-[#111316] border border-[#24292E] hover:border-[#3A424C] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white truncate max-w-[280px]">
                        {lead.name}
                      </h4>
                      
                      {!lead.hasOfficialWebsite ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#FF5B5B]/15 text-[#FF5B5B] border border-[#FF5B5B]/30 font-semibold">
                          TANPA WEB
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#3FB950]/15 text-[#3FB950]">
                          PUNYA WEB
                        </span>
                      )}

                      {lead.rating ? (
                        <span className="text-[10px] text-[#FFC107] flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#FFC107]" />
                          <span>{lead.rating}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#7E8B99] flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#5A6675]" />
                        <span className="truncate max-w-[200px]">{city}</span>
                      </span>
                      <span className="text-[#5A6675]">&bull;</span>
                      <span className="font-mono text-[#A0ACB9]">{lead.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Direct WhatsApp Action Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.phone && lead.phone !== '-' ? (
                      <button
                        type="button"
                        onClick={() => onDirectWhatsApp(lead)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg shadow transition active:scale-95 cursor-pointer ${
                          isContacted
                            ? 'bg-[#1D2126] border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10'
                            : 'bg-[#25D366] hover:bg-[#20bd5a] text-[#0F1113]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isContacted ? 'Follow-Up WA' : 'Kirim WA & Tandai'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#7E8B99] italic px-2 py-1 bg-[#16191D] rounded border border-[#24292E]">
                        Nomor Tidak Ada
                      </span>
                    )}

                    {lead.mapsUrl && (
                      <a
                        href={lead.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#16191D] hover:bg-[#24292E] border border-[#2E353D] text-[#7E8B99] hover:text-white rounded-lg transition"
                        title="Buka Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {priorityFollowUpLeads.length === 0 && (
              <div className="text-center py-10 bg-[#111316] rounded-xl border border-dashed border-[#24292E] text-xs text-[#7E8B99] space-y-2">
                <Sparkles className="w-6 h-6 text-[#D4FF44] mx-auto opacity-80" />
                <p className="font-semibold text-white">Belum ada leads dalam antrean personal Anda</p>
                <p className="text-[11px] text-[#7E8B99]">
                  Buka tab Simulator untuk mulai mencari data bisnis lokal di Google Maps.
                </p>
                <button
                  onClick={onNavigateToSimulator}
                  className="mt-2 inline-flex items-center gap-1.5 bg-[#D4FF44] text-[#0F1113] font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Buka Simulator Scraping
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Category Insights & Workflow Tips */}
        <div className="space-y-4">
          {/* Top Target Categories */}
          <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#24292E] pb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4FF44]" />
              <span>Kategori Terbanyak di Database Anda</span>
            </h4>

            <div className="space-y-2">
              {topCategories.map(([cat, count]) => {
                const percent = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#C5D1DE] truncate max-w-[170px]">{cat}</span>
                      <span className="font-mono text-[11px] text-[#7E8B99]">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#111316] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#58A6FF] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {topCategories.length === 0 && (
                <div className="text-xs text-[#7E8B99] py-3 text-center">
                  Data kategori akan muncul setelah Anda mengimpor atau scraping leads.
                </div>
              )}
            </div>
          </div>

          {/* Workflow Card: 3 Langkah Cepat Konversi */}
          <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#24292E] pb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF44]" />
              <span>Alur Kerja Cepat Penawaran</span>
            </h4>

            <div className="space-y-2.5 text-xs text-[#A0ACB9]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#111316] border border-[#2E353D] text-[#D4FF44] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white">Scraping Bisnis Target</strong>
                  <p className="text-[11px] text-[#7E8B99]">Cari kata kunci target (misal: "Klinik Jakarta", "Restoran Bandung").</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#111316] border border-[#2E353D] text-[#D4FF44] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white">Filter "Tanpa Website"</strong>
                  <p className="text-[11px] text-[#7E8B99]">Pilih target dengan reputasi tinggi yang belum punya web resmi.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#111316] border border-[#2E353D] text-[#D4FF44] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white">Direct WhatsApp 1-Klik</strong>
                  <p className="text-[11px] text-[#7E8B99]">Kirim penawaran otomatis & sistem akan menandai status kontak.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
