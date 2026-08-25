import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Chrome,
  ShieldAlert,
  ArrowRight,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROOT_ADMIN_EMAIL } from '../firebase/teamService';
import { RequestLicenseModal } from './RequestLicenseModal';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { 
    currentUser, 
    userProfile, 
    loading, 
    isWhitelisted, 
    authError, 
    signInWithGoogle, 
    signInWithLicense, 
    logout 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'license'>('google');
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Forgot / Request License Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4FF44]/10 border border-[#D4FF44]/30 flex items-center justify-center text-[#D4FF44] animate-pulse">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-white font-sans">Memverifikasi Izin Akses Whitelist...</h3>
            <p className="text-xs text-[#7E8B99] font-mono">Memeriksa database Firebase Firestore</p>
          </div>
        </div>
      </div>
    );
  }

  // Whitelisted & Authenticated: Render App
  if (isWhitelisted && userProfile) {
    return <>{children}</>;
  }

  // Authenticated with Google but NOT in Whitelist
  if (currentUser && !isWhitelisted) {
    return (
      <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#16191D] border border-[#FF4444]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-[#FF4444]/10 border border-[#FF4444]/30 flex items-center justify-center text-[#FF6B6B] mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white font-sans">Akses Dibatasi (Whitelist Only)</h2>
            <p className="text-xs text-[#9BA7B4] leading-relaxed">
              Akun Google Anda <strong className="text-white font-mono bg-[#1D2126] px-1.5 py-0.5 rounded border border-[#2A3038]">{currentUser.email}</strong> belum terdaftar dalam daftar anggota yang diizinkan (Whitelist).
            </p>
          </div>

          <div className="bg-[#111316] border border-[#24292E] p-4 rounded-xl text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <Users className="w-4 h-4 text-[#D4FF44]" />
              <span>Cara Mendapatkan Akses:</span>
            </div>
            <p className="text-[#7E8B99] text-[11px] leading-relaxed">
              Klik tombol di bawah untuk mengajukan Kunci Lisensi ke Admin dengan menyertakan nomor WhatsApp Anda.
            </p>
          </div>

          {authError && (
            <div className="bg-[#FF4444]/10 border border-[#FF4444]/20 p-3 rounded-lg text-xs text-[#FF6B6B] flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsForgotMode(false);
                setIsRequestModalOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-lg shadow-[#58A6FF]/15"
            >
              <Key className="w-4 h-4" />
              <span>Ajukan Kunci Lisensi (Sertakan No. WA)</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-[#1D2126] hover:bg-[#252B32] border border-[#3A424B] text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Ganti Akun Google Lain</span>
            </button>
          </div>
        </div>

        <RequestLicenseModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          defaultEmail={currentUser.email || ''}
          defaultName={currentUser.displayName || ''}
          isForgotMode={isForgotMode}
        />
      </div>
    );
  }

  // Handler for License Key or Email Login
  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const inputVal = licenseKeyInput.trim();
    if (!inputVal) {
      setFormError('Masukkan Kunci Lisensi (GMAPS-XXXX-...) atau Alamat Email terdaftar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await signInWithLicense(inputVal, emailInput.trim() || undefined);
      if (!success) {
        setFormError('Kunci Lisensi atau email belum terdaftar dalam Whitelist.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Gagal verifikasi lisensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not Authenticated: Show Login Screen
  return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Background glow accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4FF44]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#16191D] border border-[#2A3038] rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-8 text-center border-b border-[#24292E] bg-[#131518]/90">
          <div className="w-12 h-12 rounded-2xl bg-[#D4FF44] text-[#0F1113] font-mono font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-[#D4FF44]/20 mb-3">
            GM
          </div>
          <h1 className="text-lg font-bold text-white font-sans tracking-tight">
            Google Maps Lead Scraper & Extractor
          </h1>
          <p className="text-xs text-[#7E8B99] mt-1">
            Sistem Multi-User & Manajemen Prospek Bisnis
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4FF44]/10 border border-[#D4FF44]/30 rounded-full text-[11px] text-[#D4FF44] font-semibold">
            <Lock className="w-3 h-3" />
            <span>Akses Dibatasi Khusus Email Terdaftar</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#24292E] bg-[#111316] text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('google'); setFormError(null); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              authMode === 'google'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#16191D]'
                : 'border-transparent text-[#7E8B99] hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Login Akun Google</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('license'); setFormError(null); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              authMode === 'license'
                ? 'border-[#58A6FF] text-[#58A6FF] bg-[#16191D]'
                : 'border-transparent text-[#7E8B99] hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Kunci Lisensi Tim</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {(authError || formError) && (
            <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 rounded-xl text-xs text-[#FF6B6B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError || formError}</span>
            </div>
          )}

          {authMode === 'google' ? (
            <div className="space-y-4">
              <p className="text-xs text-[#9BA7B4] leading-relaxed text-center">
                Masuk dengan Akun Google Anda. Sistem akan memverifikasi apakah email Anda telah didaftarkan oleh Administrator.
              </p>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full py-3 px-4 bg-white hover:bg-[#F0F4F8] text-[#0F1113] font-bold rounded-xl transition flex items-center justify-center space-x-3 cursor-pointer shadow-lg text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Lanjutkan dengan Akun Google</span>
              </button>

              <div className="pt-2 text-center flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('license'); setFormError(null); }}
                  className="text-xs text-[#58A6FF] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Pop-up dibatasi? Masuk langsung via Email / Lisensi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setIsRequestModalOpen(true);
                  }}
                  className="text-xs text-[#7E8B99] hover:text-[#D4FF44] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Belum terdaftar? Ajukan Kunci Lisensi ke Admin</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLicenseSubmit} className="space-y-4 text-xs">
              <div className="bg-[#111316] border border-[#24292E] p-3 rounded-xl text-[#9BA7B4] leading-relaxed">
                Masukkan <strong className="text-white">Kunci Lisensi</strong> Anda (format <code className="text-[#58A6FF] font-mono">GMAPS-XXXX-...</code>) atau <strong className="text-white">Alamat Email</strong> yang telah didaftarkan oleh Admin.
              </div>

              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold block mb-1">
                  Kunci Lisensi atau Email Terdaftar:
                </label>
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="Contoh: GMAPS-XXXX-XXXX-XXXX atau email@domain.com"
                  className="w-full bg-[#111316] border border-[#2A3038] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#58A6FF] font-mono tracking-wide"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#58A6FF]/10 text-xs active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Verifikasi & Masuk Dashboard</span>
              </button>

              <div className="pt-2 flex flex-col items-center gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setIsRequestModalOpen(true);
                  }}
                  className="text-xs text-[#D4FF44] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Lupa Kunci Lisensi? Kirim Ulang via WhatsApp</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <RequestLicenseModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        defaultEmail={emailInput || ''}
        isForgotMode={isForgotMode}
      />
    </div>
  );
};
