import React, { useState, useRef } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Download, 
  Upload, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Database,
  FileCode,
  HardDriveDownload,
  HardDriveUpload,
  Eye,
  EyeOff
} from 'lucide-react';
import { BusinessLead } from '../types';
import { createEncryptedBackupFile, restoreEncryptedBackup } from '../utils/cryptoBackup';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: BusinessLead[];
  onRestoreLeads: (restoredLeads: BusinessLead[], mode: 'merge' | 'replace') => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  leads,
  onRestoreLeads
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  
  // Backup state
  const [backupPassword, setBackupPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showBackupPassword, setShowBackupPassword] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState<string>('');
  const [showRestorePassword, setShowRestorePassword] = useState<boolean>(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackupError(null);
    setBackupSuccess(null);

    if (leads.length === 0) {
      setBackupError('Tidak ada data prospek di database untuk dicadangkan.');
      return;
    }

    if (backupPassword.length < 4) {
      setBackupError('Kata sandi enkripsi minimal 4 karakter.');
      return;
    }

    if (backupPassword !== confirmPassword) {
      setBackupError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsBackingUp(true);
    try {
      const filename = `gmaps_leads_backup_${new Date().toISOString().slice(0, 10)}.enc.json`;
      await createEncryptedBackupFile(leads, backupPassword, filename);
      setBackupSuccess(`Berhasil mengenkripsi dan mengunduh ${leads.length} data prospek ke ${filename}. Simpan kata sandi Anda dengan aman!`);
      setBackupPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setBackupError(err?.message || 'Gagal membuat berkas backup terenkripsi.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
      setRestoreError(null);
      setRestoreSuccess(null);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError(null);
    setRestoreSuccess(null);

    if (!restoreFile) {
      setRestoreError('Pilih file backup .json terlebih dahulu.');
      return;
    }

    setIsRestoring(true);
    try {
      const text = await restoreFile.text();
      const payload = JSON.parse(text);

      let extractedLeads: BusinessLead[] = [];

      // Check if it's an encrypted backup
      if (payload.type === 'GMAPS_LEADS_ENCRYPTED_BACKUP' || payload.ciphertext) {
        if (!restorePassword) {
          throw new Error('File ini terenkripsi. Masukkan kata sandi pembuka enkripsi.');
        }
        extractedLeads = await restoreEncryptedBackup(payload, restorePassword);
      } else if (Array.isArray(payload)) {
        // Plain JSON format
        extractedLeads = payload;
      } else if (payload.leads && Array.isArray(payload.leads)) {
        extractedLeads = payload.leads;
      } else {
        throw new Error('Format file backup tidak dikenali.');
      }

      if (!Array.isArray(extractedLeads) || extractedLeads.length === 0) {
        throw new Error('Tidak ada data prospek valid ditemukan dalam file backup.');
      }

      onRestoreLeads(extractedLeads, restoreMode);
      setRestoreSuccess(`Sukses memulihkan ${extractedLeads.length} data prospek ke database lokal!`);
      setRestorePassword('');
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setRestoreError(err?.message || 'Gagal memulihkan database.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#2A3038] rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4FF44]/10 border border-[#D4FF44]/30 flex items-center justify-center text-[#D4FF44]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>Backup & Restore Database Terenkripsi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30 rounded">
                  AES-GCM-256
                </span>
              </h3>
              <p className="text-xs text-[#7E8B99]">
                Cegah data hilang saat cache browser dibersihkan dengan enkripsi password standar industri.
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

        {/* Tab Selection */}
        <div className="flex border-b border-[#24292E] bg-[#111316] text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('backup'); setBackupError(null); setBackupSuccess(null); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#16191D]'
                : 'border-transparent text-[#7E8B99] hover:text-white'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>1. Cadangkan / Backup ({leads.length} Leads)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('restore'); setRestoreError(null); setRestoreSuccess(null); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'restore'
                ? 'border-[#58A6FF] text-[#58A6FF] bg-[#16191D]'
                : 'border-transparent text-[#7E8B99] hover:text-white'
            }`}
          >
            <HardDriveUpload className="w-4 h-4" />
            <span>2. Pulihkan / Restore Data</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'backup' && (
            <form onSubmit={handleCreateBackup} className="space-y-4 text-xs">
              <div className="bg-[#111316] border border-[#24292E] p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#D4FF44]" />
                  <span>Keamanan Enkripsi End-to-End</span>
                </div>
                <p className="text-[#9BA7B4] text-[11px] leading-relaxed">
                  Data database prospek Anda akan dienkripsi menggunakan algoritma <strong>AES-GCM 256-bit</strong> dengan key derivation <strong>PBKDF2 SHA-256</strong> (100.000 iterasi). File JSON yang dihasilkan tidak dapat dibaca tanpa password yang Anda tentukan.
                </p>
              </div>

              {backupError && (
                <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 rounded-lg text-xs text-[#FF6B6B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}

              {backupSuccess && (
                <div className="bg-[#3FB950]/10 border border-[#3FB950]/30 p-3 rounded-lg text-xs text-[#3FB950] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#C5D1DE] font-semibold flex items-center justify-between">
                    <span>Kata Sandi Enkripsi:</span>
                    <span className="text-[#7E8B99] text-[10px]">Min. 4 karakter</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showBackupPassword ? 'text' : 'password'}
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="Masukkan kata sandi rahasia..."
                      className="w-full bg-[#111316] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44] pr-9 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowBackupPassword(!showBackupPassword)}
                      className="absolute right-2.5 top-2 text-[#7E8B99] hover:text-white cursor-pointer"
                    >
                      {showBackupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#C5D1DE] font-semibold">Konfirmasi Kata Sandi:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi..."
                    className="w-full mt-1 bg-[#111316] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBackingUp || leads.length === 0}
                  className="w-full py-2.5 px-4 bg-[#D4FF44] hover:bg-[#E2FF70] disabled:bg-[#24292E] disabled:text-[#5A6675] text-[#0F1113] font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#D4FF44]/10 text-xs"
                >
                  {isBackingUp ? (
                    <div className="w-4 h-4 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Enkripsi & Unduh File Backup JSON ({leads.length} Leads)</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'restore' && (
            <form onSubmit={handleRestoreBackup} className="space-y-4 text-xs">
              <div className="bg-[#111316] border border-[#24292E] p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Unlock className="w-4 h-4 text-[#58A6FF]" />
                  <span>Pulihkan Database dari File Cadangan</span>
                </div>
                <p className="text-[#9BA7B4] text-[11px] leading-relaxed">
                  Unggah file <code>.enc.json</code> yang pernah Anda unduh dan masukkan kata sandi yang sesuai untuk mengembalikan data prospek Anda ke database aplikasi.
                </p>
              </div>

              {restoreError && (
                <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 rounded-lg text-xs text-[#FF6B6B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="bg-[#3FB950]/10 border border-[#3FB950]/30 p-3 rounded-lg text-xs text-[#3FB950] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold">Pilih Berkas Backup (.enc.json atau .json):</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.enc.json"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-[#9BA7B4] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1D2126] file:text-[#58A6FF] hover:file:bg-[#252B32] file:cursor-pointer border border-[#2A3038] rounded-lg bg-[#111316]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold flex items-center justify-between">
                  <span>Kata Sandi Pembuka Enkripsi:</span>
                  <span className="text-[#7E8B99] text-[10px]">Diperlukan jika terenkripsi</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showRestorePassword ? 'text' : 'password'}
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat backup..."
                    className="w-full bg-[#111316] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58A6FF] pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRestorePassword(!showRestorePassword)}
                    className="absolute right-2.5 top-2 text-[#7E8B99] hover:text-white cursor-pointer"
                  >
                    {showRestorePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold">Mode Pemulihan Data:</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      restoreMode === 'merge'
                        ? 'bg-[#58A6FF]/15 text-white border-[#58A6FF]'
                        : 'bg-[#111316] text-[#7E8B99] border-[#24292E]'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">Gabungkan (Merge)</div>
                    <div className="text-[10px] text-[#9BA7B4]">Tambahkan tanpa timpa yang ada</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('replace')}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      restoreMode === 'replace'
                        ? 'bg-[#FF4444]/15 text-white border-[#FF4444]'
                        : 'bg-[#111316] text-[#7E8B99] border-[#24292E]'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#FF6B6B]">Ganti Total (Replace)</div>
                    <div className="text-[10px] text-[#9BA7B4]">Hapus data lama & gunakan backup</div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRestoring || !restoreFile}
                  className="w-full py-2.5 px-4 bg-[#58A6FF] hover:bg-[#79B8FF] disabled:bg-[#24292E] disabled:text-[#5A6675] text-[#0F1113] font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#58A6FF]/10 text-xs"
                >
                  {isRestoring ? (
                    <div className="w-4 h-4 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
                  ) : (
                    <HardDriveUpload className="w-4 h-4" />
                  )}
                  <span>Dekripsi & Pulihkan Database Sekarang</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
