import React, { useState } from 'react';
import { 
  Download, 
  Sparkles, 
  Code, 
  Table, 
  HelpCircle, 
  Layers, 
  Users, 
  LogOut, 
  ShieldCheck, 
  Cloud, 
  RefreshCw,
  User as UserIcon,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: 'overview' | 'simulator' | 'leads' | 'code' | 'guide';
  setActiveTab: (tab: 'overview' | 'simulator' | 'leads' | 'code' | 'guide') => void;
  onDownloadZip: () => void;
  isDownloadingZip: boolean;
  totalLeadsCount: number;
  onOpenTeamManager: () => void;
  onRequestLicense?: () => void;
  isCloudSynced?: boolean;
  onSyncCloud?: () => void;
  isSyncingCloud?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  isDownloadingZip,
  totalLeadsCount,
  onOpenTeamManager,
  onRequestLicense,
  isCloudSynced = true,
  onSyncCloud,
  isSyncingCloud = false
}) => {
  const { userProfile, isAdmin, isRootAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  return (
    <header className="bg-[#16191D] border-b border-[#24292E] text-[#E1E7EC] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1D2126] flex items-center justify-center border border-[#2E353D] shadow-sm">
              <Layers className="w-5 h-5 text-[#D4FF44]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white font-sans">
                  GMaps Lead Scraper
                </h1>
                <span className="bg-[#D4FF44]/10 text-[#D4FF44] border border-[#D4FF44]/30 text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                  Multi-User Whitelist
                </span>
              </div>
              <p className="text-xs text-[#7E8B99] hidden sm:block">
                Sistem Lead Scraper, Cloud Sync & Whitelist Akses Khusus Tim Terdaftar
              </p>
            </div>
          </div>

          {/* User Controls & Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Team Manager Button (Admin Only) */}
            {isAdmin && (
              <button
                id="openTeamManagerBtn"
                onClick={onOpenTeamManager}
                className="inline-flex items-center gap-1.5 bg-[#1D2126] hover:bg-[#252B32] border border-[#D4FF44]/40 text-[#D4FF44] text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer shadow-xs"
                title="Kelola Whitelist Email & Akses Anggota Tim"
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Kelola Tim & Whitelist</span>
                <span className="md:hidden">Tim</span>
              </button>
            )}

            {/* Cloud Sync Button */}
            {onSyncCloud && (
              <button
                onClick={onSyncCloud}
                disabled={isSyncingCloud}
                className="inline-flex items-center gap-1.5 bg-[#111316] hover:bg-[#1D2126] border border-[#2A3038] text-[#C5D1DE] text-xs font-semibold px-2.5 py-2 rounded-lg transition cursor-pointer"
                title="Sinkronisasi leads ke Firestore Cloud"
              >
                <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-pulse text-[#D4FF44]' : 'text-[#58A6FF]'}`} />
                <span className="hidden lg:inline">{isSyncingCloud ? 'Menyinkronkan...' : 'Cloud Sync'}</span>
              </button>
            )}

            {/* Download Extension Zip */}
            <button
              id="downloadExtensionZipBtn"
              onClick={onDownloadZip}
              disabled={isDownloadingZip}
              className="inline-flex items-center gap-1.5 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs sm:text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingZip ? (
                <div className="w-3.5 h-3.5 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Unduh Ekstensi (.ZIP)</span>
              <span className="sm:hidden">.ZIP</span>
            </button>

            {/* User Profile Badge & Menu */}
            {userProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-[#111316] border border-[#2A3038] hover:border-[#3A4450] py-1.5 px-2.5 rounded-lg transition cursor-pointer text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#58A6FF]/20 text-[#58A6FF] flex items-center justify-center font-bold text-[11px] font-mono">
                    {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-white font-bold text-[11px] leading-tight truncate max-w-[110px]">
                      {userProfile.displayName}
                    </div>
                    <div className="text-[9px] text-[#7E8B99] font-mono leading-tight">
                      {userProfile.role.toUpperCase()}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#7E8B99]" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#16191D] border border-[#2A3038] rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="border-b border-[#24292E] pb-2 space-y-0.5">
                      <div className="font-bold text-white truncate">{userProfile.displayName}</div>
                      <div className="text-[11px] text-[#7E8B99] font-mono truncate">{userProfile.email}</div>
                      <div className="pt-1 flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#D4FF44]/15 text-[#D4FF44] border border-[#D4FF44]/30">
                          {userProfile.isRootAdmin ? 'ROOT SUPER ADMIN' : userProfile.role.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3FB950]/15 text-[#3FB950]">
                          TERVERIFIKASI
                        </span>
                      </div>
                    </div>

                    {isAdmin ? (
                      <button
                        onClick={() => { setShowUserMenu(false); onOpenTeamManager(); }}
                        className="w-full text-left px-2.5 py-2 hover:bg-[#1D2126] text-white rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-[#D4FF44]" />
                        <span>Daftar Email Whitelist Tim</span>
                      </button>
                    ) : (
                      onRequestLicense && (
                        <button
                          onClick={() => { setShowUserMenu(false); onRequestLicense(); }}
                          className="w-full text-left px-2.5 py-2 hover:bg-[#1D2126] text-[#58A6FF] rounded-lg flex items-center gap-2 transition cursor-pointer"
                        >
                          <Key className="w-4 h-4 text-[#58A6FF]" />
                          <span>Request Kunci Lisensi ke Admin</span>
                        </button>
                      )
                    )}

                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="w-full text-left px-2.5 py-2 hover:bg-[#FF4444]/10 text-[#FF6B6B] rounded-lg flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Log Out)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-[#24292E] pt-1 -mb-px overflow-x-auto scrollbar-none">
          <button
            id="tabOverview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#1D2126]/60 rounded-t-md font-semibold'
                : 'border-transparent text-[#7E8B99] hover:text-[#E1E7EC] hover:border-[#2E353D]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Personal</span>
          </button>

          <button
            id="tabSimulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#1D2126]/60 rounded-t-md font-semibold'
                : 'border-transparent text-[#7E8B99] hover:text-[#E1E7EC] hover:border-[#2E353D]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulator & Scraping</span>
          </button>

          <button
            id="tabLeads"
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'leads'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#1D2126]/60 rounded-t-md font-semibold'
                : 'border-transparent text-[#7E8B99] hover:text-[#E1E7EC] hover:border-[#2E353D]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Database & Peta Leads</span>
            {totalLeadsCount > 0 && (
              <span className="bg-[#D4FF44]/20 text-[#D4FF44] text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border border-[#D4FF44]/40">
                {totalLeadsCount}
              </span>
            )}
          </button>

          {/* Code Viewer Tab (Admin & Super Admin Only) */}
          {(isAdmin || isRootAdmin) && (
            <button
              id="tabCode"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'code'
                  ? 'border-[#D4FF44] text-[#D4FF44] bg-[#1D2126]/60 rounded-t-md font-semibold'
                  : 'border-transparent text-[#7E8B99] hover:text-[#E1E7EC] hover:border-[#2E353D]'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Kode Sumber Ekstensi</span>
            </button>
          )}

          <button
            id="tabGuide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#1D2126]/60 rounded-t-md font-semibold'
                : 'border-transparent text-[#7E8B99] hover:text-[#E1E7EC] hover:border-[#2E353D]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan & Multi-User</span>
          </button>
        </div>
      </div>
    </header>
  );
};
