import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OverviewDashboardTab } from './components/OverviewDashboardTab';
import { SimulatorTab } from './components/SimulatorTab';
import { LeadManagerTab } from './components/LeadManagerTab';
import { CodeViewerTab } from './components/CodeViewerTab';
import { GuideTab } from './components/GuideTab';
import { TeamManagerModal } from './components/TeamManagerModal';
import { RequestLicenseModal } from './components/RequestLicenseModal';
import { BusinessLead, OutreachRecord } from './types';
import { generateExtensionZip, downloadExtensionZip } from './utils/zipGenerator';
import { safeStorage } from './utils/storage';
import { useAuth } from './context/AuthContext';
import { 
  subscribeToUserCloudLeads, 
  batchSyncUserLeadsToCloud 
} from './firebase/leadSync';
import { filterLeadsForUser, sanitizeLeadPayload } from './utils/security';
import { 
  renderWhatsAppMessage, 
  createWhatsAppDirectUrl, 
  getSavedWhatsAppTemplates, 
  DEFAULT_WA_TEMPLATES 
} from './utils/whatsappTemplates';

export default function App() {
  const { userProfile, isWhitelisted, isAdmin, isRootAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'leads' | 'code' | 'guide'>('overview');
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState<boolean>(false);
  const [isRequestLicenseOpen, setIsRequestLicenseOpen] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Security guard: redirect non-admin members if they attempt to access 'code' tab
  useEffect(() => {
    if (activeTab === 'code' && !isAdmin && !isRootAdmin) {
      setActiveTab('overview');
    }
  }, [activeTab, isAdmin, isRootAdmin]);

  // Scoped storage key per user email for offline caching
  const userStorageKey = userProfile?.email 
    ? `gmaps_leads_user_${userProfile.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`
    : 'gmaps_leads_user_guest';

  const [leads, setLeads] = useState<BusinessLead[]>(() => {
    try {
      const stored = safeStorage.getItem(userStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse leads cache:', e);
    }
    return [];
  });

  // Re-load cache when user profile changes
  useEffect(() => {
    if (!userProfile) return;
    try {
      const stored = safeStorage.getItem(userStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeads(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to switch user leads cache:', e);
    }
  }, [userStorageKey, userProfile]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Persist user leads to isolated local storage
  useEffect(() => {
    try {
      safeStorage.setItem(userStorageKey, JSON.stringify(leads));
    } catch (e) {
      console.warn('Failed to save leads cache:', e);
    }
  }, [leads, userStorageKey]);

  // Realtime Cloud Lead Subscription scoped to current user profile
  useEffect(() => {
    if (!isWhitelisted || !userProfile) return;

    const unsubscribe = subscribeToUserCloudLeads(userProfile, (cloudLeads) => {
      if (cloudLeads && cloudLeads.length >= 0) {
        setLeads((prev) => {
          const leadMap = new Map<string, BusinessLead>();
          // Existing local leads
          prev.forEach(l => {
            if (l && l.id) leadMap.set(l.id, l);
          });
          // Merge cloud leads
          cloudLeads.forEach(cl => {
            if (cl && cl.id) leadMap.set(cl.id, cl);
          });
          return Array.from(leadMap.values());
        });
      }
    });

    return () => unsubscribe();
  }, [isWhitelisted, userProfile]);

  const handleSyncCloud = async () => {
    if (!isWhitelisted || !userProfile) return;
    setIsSyncingCloud(true);
    try {
      const result = await batchSyncUserLeadsToCloud(leads, userProfile);
      setToastMessage({
        text: `Berhasil menyinkronkan ${result.syncedCount} leads ke Firestore Cloud khusus akun ${userProfile.email}!`,
        type: 'success'
      });
      setIsCloudSynced(true);
    } catch (err: any) {
      setToastMessage({
        text: `Gagal sinkronisasi cloud: ${err?.message || 'Error koneksi'}`,
        type: 'error'
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  /**
   * One-click WhatsApp action:
   * 1. Constructs formatted WhatsApp API link
   * 2. Opens link in new window
   * 3. Automatically marks lead as 'contacted' (Sudah Dihubungi) with timestamp
   */
  const handleDirectWhatsApp = useCallback((lead: BusinessLead, templateType: 'website' | 'rekam_medis' = 'website') => {
    if (!lead || !lead.phone || lead.phone === '-') {
      setToastMessage({ text: 'Nomor telepon tidak valid untuk mengirim WhatsApp.', type: 'error' });
      return;
    }

    const savedTemplates = getSavedWhatsAppTemplates();
    const activeTemplate = savedTemplates.find(t => t.type === templateType) || 
      DEFAULT_WA_TEMPLATES.find(t => t.type === templateType) || 
      DEFAULT_WA_TEMPLATES[0];

    const senderName = safeStorage.getItem('wa_outreach_sender_name') || userProfile?.displayName || 'Tim Konsultan';
    const message = renderWhatsAppMessage(activeTemplate.template, lead, senderName);
    const waUrl = createWhatsAppDirectUrl(lead.phone, message);

    // Open WhatsApp link
    window.open(waUrl, '_blank', 'noopener,noreferrer');

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
      templateName: activeTemplate.name,
      type: templateType,
      phone: lead.phone,
      senderName
    };

    // Update state and mark as contacted automatically
    setLeads(prev => prev.map(item => {
      if (item.id === lead.id) {
        const history = [...(item.outreachHistory || []), newRecord];
        return {
          ...item,
          contactStatus: 'contacted',
          firstContactedAt: item.firstContactedAt || nowStr,
          lastContactedAt: nowStr,
          outreachCount: (item.outreachCount || 0) + 1,
          lastOutreachType: templateType,
          outreachHistory: history
        };
      }
      return item;
    }));

    setToastMessage({
      text: `Membuka WhatsApp untuk ${lead.name} & otomatis menandai status 'Sudah Dihubungi'`,
      type: 'success'
    });
  }, [userProfile]);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const blob = await generateExtensionZip();
      downloadExtensionZip(blob, 'google-maps-lead-scraper-whitelist-v3.zip');
      setToastMessage({ text: 'Paket ekstensi .ZIP berhasil dibuat dan mulai diunduh!', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: `Gagal membuat paket ekstensi: ${err?.message || 'Error tidak dikenal'}`, type: 'error' });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // User-isolated leads count
  const isolatedLeads = filterLeadsForUser(leads, userProfile, false);

  return (
    <div className="min-h-screen bg-[#0F1113] text-[#E1E7EC] flex flex-col font-sans selection:bg-[#D4FF44] selection:text-[#0F1113]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        isDownloadingZip={isDownloadingZip}
        totalLeadsCount={isolatedLeads.length}
        onOpenTeamManager={() => setIsTeamManagerOpen(true)}
        onRequestLicense={() => setIsRequestLicenseOpen(true)}
        onSyncCloud={handleSyncCloud}
        isSyncingCloud={isSyncingCloud}
        isCloudSynced={isCloudSynced}
      />

      {toastMessage && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between border ${
            toastMessage.type === 'success'
              ? 'bg-[#D4FF44]/10 border-[#D4FF44]/30 text-[#D4FF44]'
              : 'bg-[#FF4444]/10 border-[#FF4444]/30 text-[#FF4444]'
          }`}>
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-3 font-mono"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewDashboardTab
            leads={leads}
            setLeads={setLeads}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onDirectWhatsApp={handleDirectWhatsApp}
            onOpenTeamManager={() => setIsTeamManagerOpen(true)}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorTab
            leads={leads}
            setLeads={setLeads}
            onOpenLeadsTab={() => setActiveTab('leads')}
          />
        )}

        {activeTab === 'leads' && (
          <LeadManagerTab
            leads={leads}
            setLeads={setLeads}
          />
        )}

        {activeTab === 'code' && (isAdmin || isRootAdmin) && (
          <CodeViewerTab
            onDownloadZip={handleDownloadZip}
            isDownloadingZip={isDownloadingZip}
          />
        )}

        {activeTab === 'guide' && (
          <GuideTab
            onDownloadZip={handleDownloadZip}
            isDownloadingZip={isDownloadingZip}
            onOpenTeamManager={() => setIsTeamManagerOpen(true)}
            onRequestLicense={() => setIsRequestLicenseOpen(true)}
          />
        )}
      </main>

      {/* Team & Whitelist Management Modal (Admin Only) */}
      <TeamManagerModal
        isOpen={isTeamManagerOpen}
        onClose={() => setIsTeamManagerOpen(false)}
      />

      {/* Request License Modal (Member / User) */}
      <RequestLicenseModal
        isOpen={isRequestLicenseOpen}
        onClose={() => setIsRequestLicenseOpen(false)}
        defaultEmail={userProfile?.email || ''}
        defaultName={userProfile?.displayName || ''}
        isForgotMode={false}
      />

      <footer className="bg-[#16191D] border-t border-[#24292E] py-4 text-center text-xs text-[#7E8B99]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-mono text-[11px] tracking-wide">
            GMAPS LEAD EXTRACTOR &bull; <span className="text-[#D4FF44]">MULTI-USER CLOUD WHITELIST</span>
          </span>
          <span className="text-[#5A6675]">Akses Khusus Email Terverifikasi &bull; Realtime Cloud Database</span>
        </div>
      </footer>
    </div>
  );
}

