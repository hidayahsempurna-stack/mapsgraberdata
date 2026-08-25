import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Cloud, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Users, 
  Lock, 
  Sparkles,
  Link,
  Plus,
  ArrowRight
} from 'lucide-react';
import { BusinessLead } from '../types';
import { 
  GoogleSheetsConfig, 
  getSavedSheetsConfig, 
  saveSheetsConfig, 
  requestGoogleAccessToken, 
  createGoogleSpreadsheet, 
  syncLeadsToGoogleSheet,
  getStoredAccessToken,
  clearGoogleAuth
} from '../utils/googleSheetsSync';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: BusinessLead[];
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  leads
}) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(() => getSavedSheetsConfig());
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState<string>(config.spreadsheetId || '');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(
    config.spreadsheetTitle || `Prospek Leads Google Maps (${new Date().toLocaleDateString('id-ID')})`
  );
  const [sheetTabName, setSheetTabName] = useState<string>(config.sheetName || 'Daftar Prospek Bisnis');
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const token = getStoredAccessToken();
      setHasToken(!!token);
      const saved = getSavedSheetsConfig();
      setConfig(saved);
      if (saved.spreadsheetId) setCustomSpreadsheetId(saved.spreadsheetId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateAndSync = async () => {
    setSyncError(null);
    setSyncSuccess(null);
    setIsCreatingNew(true);

    try {
      // 1. Get OAuth Access Token
      const token = await requestGoogleAccessToken();
      setHasToken(true);

      // 2. Create Spreadsheet in Google Drive
      const { spreadsheetId, spreadsheetUrl } = await createGoogleSpreadsheet(token, spreadsheetTitle);

      // 3. Push leads
      await syncLeadsToGoogleSheet(token, spreadsheetId, leads, sheetTabName);

      const nowStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newConfig: GoogleSheetsConfig = {
        spreadsheetId,
        spreadsheetUrl,
        spreadsheetTitle,
        sheetName: sheetTabName,
        lastSyncedAt: nowStr
      };

      saveSheetsConfig(newConfig);
      setConfig(newConfig);
      setCustomSpreadsheetId(spreadsheetId);
      setSyncSuccess(`Berhasil membuat Spreadsheet baru dan menyinkronkan ${leads.length} data prospek ke Google Sheets Cloud!`);
    } catch (err: any) {
      setSyncError(err?.message || 'Gagal membuat Google Spreadsheet.');
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleSyncToExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncError(null);
    setSyncSuccess(null);

    const cleanId = customSpreadsheetId.trim();
    if (!cleanId) {
      setSyncError('Masukkan Spreadsheet ID atau URL Google Sheets.');
      return;
    }

    // Extract ID if user pasted full URL
    let extractedId = cleanId;
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    setIsSyncing(true);
    try {
      const token = await requestGoogleAccessToken();
      setHasToken(true);

      await syncLeadsToGoogleSheet(token, extractedId, leads, sheetTabName);

      const nowStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/edit`;
      const newConfig: GoogleSheetsConfig = {
        ...config,
        spreadsheetId: extractedId,
        spreadsheetUrl,
        sheetName: sheetTabName,
        lastSyncedAt: nowStr
      };

      saveSheetsConfig(newConfig);
      setConfig(newConfig);
      setSyncSuccess(`Berhasil memperbarui ${leads.length} baris data prospek di Google Sheet!`);
    } catch (err: any) {
      setSyncError(err?.message || 'Gagal sinkronisasi data ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleAuth();
    setHasToken(false);
    setSyncSuccess('Sesi Google OAuth telah diputuskan.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#2A3038] rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F9D58]/10 border border-[#0F9D58]/30 flex items-center justify-center text-[#0F9D58]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>Sinkronisasi Google Sheets Cloud</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0F9D58]/15 text-[#0F9D58] border border-[#0F9D58]/30 rounded">
                  Google Workspace API
                </span>
              </h3>
              <p className="text-xs text-[#7E8B99]">
                Simpan & bagikan data prospek Google Maps ke spreadsheet cloud agar dapat diakses bersama tim secara realtime.
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

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Status Banner */}
          {config.spreadsheetUrl && (
            <div className="bg-[#0F9D58]/10 border border-[#0F9D58]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#0F9D58]" />
                  <span>Tersambung ke Google Spreadsheet:</span>
                </div>
                <div className="text-[11px] text-[#A0ACB9]">
                  Terakhir disinkronkan: <strong className="text-white font-mono">{config.lastSyncedAt || 'Belum pernah'}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={config.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#0F9D58] hover:bg-[#12B867] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Spreadsheet</span>
                </a>
              </div>
            </div>
          )}

          {syncError && (
            <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 rounded-lg text-xs text-[#FF6B6B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {syncSuccess && (
            <div className="bg-[#3FB950]/10 border border-[#3FB950]/30 p-3 rounded-lg text-xs text-[#3FB950] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{syncSuccess}</span>
            </div>
          )}

          {/* Option 1: Buat Spreadsheet Baru Otomatis */}
          <div className="bg-[#111316] border border-[#24292E] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Plus className="w-4 h-4 text-[#D4FF44]" />
                <span>Opsi 1: Buat File Spreadsheet Baru di Google Drive</span>
              </div>
              <span className="text-[10px] text-[#D4FF44] font-mono font-bold bg-[#D4FF44]/10 px-2 py-0.5 rounded border border-[#D4FF44]/30">
                Paling Praktis
              </span>
            </div>
            <p className="text-[#9BA7B4] text-[11px] leading-relaxed">
              Sistem akan secara otomatis membuat berkas Spreadsheet baru di akun Google Anda dengan format kolom header rapi (Nama, Kategori, Kota, Telepon, Status Website, Rating, dan Status Outreach).
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold">Judul Spreadsheet Baru:</label>
                <input
                  type="text"
                  value={spreadsheetTitle}
                  onChange={(e) => setSpreadsheetTitle(e.target.value)}
                  placeholder="Contoh: Database Prospek Bisnis Surabaya"
                  className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44]"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateAndSync}
                disabled={isCreatingNew || leads.length === 0}
                className="w-full py-2.5 px-4 bg-[#0F9D58] hover:bg-[#12B867] disabled:bg-[#24292E] disabled:text-[#5A6675] text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#0F9D58]/15"
              >
                {isCreatingNew ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Buat File Baru & Ekspor {leads.length} Leads ke Google Sheets</span>
              </button>
            </div>
          </div>

          {/* Option 2: Sinkronkan ke Spreadsheet yang Sudah Ada */}
          <form onSubmit={handleSyncToExisting} className="bg-[#111316] border border-[#24292E] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <RefreshCw className="w-4 h-4 text-[#58A6FF]" />
                <span>Opsi 2: Sinkronkan ke Google Spreadsheet yang Sudah Ada</span>
              </div>
            </div>
            <p className="text-[#9BA7B4] text-[11px]">
              Masukkan URL Google Sheets atau ID Spreadsheet untuk memperbarui baris data secara terus menerus.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold">Spreadsheet ID atau Link URL Google Sheets:</label>
                <input
                  type="text"
                  value={customSpreadsheetId}
                  onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1a2b3c.../edit atau ID-nya"
                  className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58A6FF] font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold">Nama Lembar / Sheet Tab:</label>
                <input
                  type="text"
                  value={sheetTabName}
                  onChange={(e) => setSheetTabName(e.target.value)}
                  placeholder="Daftar Prospek Bisnis"
                  className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58A6FF]"
                />
              </div>

              <button
                type="submit"
                disabled={isSyncing || leads.length === 0}
                className="w-full py-2.5 px-4 bg-[#1D2126] hover:bg-[#252B32] border border-[#3A424B] text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer text-xs"
              >
                {isSyncing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-[#58A6FF]" />
                )}
                <span>Perbarui Data ({leads.length} Leads) ke Spreadsheet Ini</span>
              </button>
            </div>
          </form>

          {/* Team Collaboration Note */}
          <div className="bg-[#131518] p-3 rounded-lg border border-[#24292E] flex items-start gap-2.5 text-[#7E8B99] text-[11px]">
            <Users className="w-4 h-4 text-[#D4FF44] flex-shrink-0 mt-0.5" />
            <p>
              Setelah disinkronkan ke Google Sheets, Anda dapat membagikan link Spreadsheet (melalui tombol <em>Share / Bagikan</em> di Google Docs) ke seluruh tim sales, telemarketing, atau agen lapangan secara aman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
