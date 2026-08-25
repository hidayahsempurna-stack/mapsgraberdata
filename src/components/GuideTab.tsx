import React from 'react';
import { 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  ShieldCheck, 
  Laptop,
  Search,
  MessageCircle,
  Stethoscope,
  Globe,
  Upload,
  Eye,
  Send,
  Users,
  Key,
  Lock,
  Cloud
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface GuideTabProps {
  onDownloadZip: () => void;
  isDownloadingZip: boolean;
  onOpenTeamManager?: () => void;
  onRequestLicense?: () => void;
}

export const GuideTab: React.FC<GuideTabProps> = ({
  onDownloadZip,
  isDownloadingZip,
  onOpenTeamManager,
  onRequestLicense
}) => {
  const { isAdmin, isRootAdmin } = useAuth();
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white font-sans">Panduan Multi-User, Ekstensi & Whitelist Email</h2>
        <p className="text-xs sm:text-sm text-[#9BA7B4] mt-1">
          Petunjuk lengkap pengelolaan tim, pembatasan akses hanya untuk email terdaftar, pengoperasian ekstensi Chrome, dan sinkronisasi cloud.
        </p>
      </div>

      {/* Multi-User Whitelist Architecture Banner */}
      <div className="bg-[#16191D] border border-[#D4FF44]/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24292E]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4FF44]/15 border border-[#D4FF44]/30 flex items-center justify-center text-[#D4FF44]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Sistem Multi-User & Access Control List (Whitelist)</h3>
              <p className="text-xs text-[#7E8B99]">Hanya pengguna yang emailnya didaftarkan Admin yang dapat menggunakan web app dan ekstensi.</p>
            </div>
          </div>
          {isAdmin ? (
            onOpenTeamManager && (
              <button
                onClick={onOpenTeamManager}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F1113] bg-[#D4FF44] hover:bg-[#E2FF70] rounded-xl transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Buka Kelola Tim (Admin)</span>
              </button>
            )
          ) : (
            onRequestLicense && (
              <button
                onClick={onRequestLicense}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F1113] bg-[#58A6FF] hover:bg-[#79B8FF] rounded-xl transition cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Request Kunci Lisensi ke Admin</span>
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#111316] border border-[#24292E] p-3.5 rounded-xl space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#D4FF44]" />
              <span>1. Daftarkan Email</span>
            </div>
            <p className="text-[#9BA7B4] text-[11px] leading-relaxed">
              Admin membuka menu <strong>"Kelola Tim & Whitelist"</strong> di header dan mendaftarkan email anggota (misal: tim sales atau scraper).
            </p>
          </div>

          <div className="bg-[#111316] border border-[#24292E] p-3.5 rounded-xl space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#58A6FF]" />
              <span>2. Kunci Lisensi Ekstensi</span>
            </div>
            <p className="text-[#9BA7B4] text-[11px] leading-relaxed">
              Sistem membuat Kunci Lisensi unik (<code className="text-[#58A6FF]">GMAPS-XXXX...</code>). Bagikan ke anggota untuk otentikasi di Ekstensi Chrome.
            </p>
          </div>

          <div className="bg-[#111316] border border-[#24292E] p-3.5 rounded-xl space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-[#3FB950]" />
              <span>3. Sinkronisasi Real-Time</span>
            </div>
            <p className="text-[#9BA7B4] text-[11px] leading-relaxed">
              Semua prospek yang di-scrape oleh tim langsung tersinkronkan ke Cloud Firestore database dan terlabeli nama/email pengambil datanya.
            </p>
          </div>
        </div>
      </div>

      {/* Workflow 3-Step Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4FF44]/10 text-[#D4FF44] border border-[#D4FF44]/30 flex items-center justify-center font-mono font-bold text-sm">
            1
          </div>
          <h4 className="text-sm font-bold text-white">Scrape & Dapatkan CSV</h4>
          <p className="text-xs text-[#9BA7B4] leading-relaxed">
            Gunakan ekstensi Chrome di Google Maps atau unduh CSV hasil pemindaian prospek tanpa website resmi.
          </p>
        </div>

        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/30 flex items-center justify-center font-mono font-bold text-sm">
            2
          </div>
          <h4 className="text-sm font-bold text-white">Import & Jabarkan Data</h4>
          <p className="text-xs text-[#9BA7B4] leading-relaxed">
            Unggah file CSV pada tab <strong>Database Lead</strong>. Sistem akan otomatis memetakan nama, alamat, no HP, kategori medis vs umum.
          </p>
        </div>

        <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 flex items-center justify-center font-mono font-bold text-sm">
            3
          </div>
          <h4 className="text-sm font-bold text-white">Otomasi WhatsApp</h4>
          <p className="text-xs text-[#9BA7B4] leading-relaxed">
            Klik tombol <strong>WA Website</strong> atau <strong>WA Rekam Medis</strong> untuk mengirim pesan penawaran terpersonalisasi secara instan.
          </p>
        </div>
      </div>

      {/* Workflow Import CSV & WA Outreach */}
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span>Panduan Fitur Import CSV & Tombol WhatsApp Otomatis</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#D4FF44]">
              <Globe className="w-4 h-4" />
              <span>1. Penawaran Pembuatan Website</span>
            </div>
            <p className="text-[#C5D1DE] leading-relaxed">
              Ditujukan untuk toko, bengkel, restoran, kontraktor, dan usaha lokal yang belum memiliki website resmi. Pesan menonjolkan peningkatan kredibilitas, kemudahan ditemukan di Google Search, dan paket website siap pakai.
            </p>
            <div className="bg-[#16191D] p-2.5 rounded border border-[#24292E] text-[11px] font-mono text-[#9BA7B4]">
              Template: Nama Usaha + Rating + Alasan butuh website + Ajakan kirim portofolio
            </div>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#58A6FF]">
              <Stethoscope className="w-4 h-4" />
              <span>2. Penawaran Aplikasi Rekam Medis (RME)</span>
            </div>
            <p className="text-[#C5D1DE] leading-relaxed">
              Ditujukan untuk klinik pratama/utama, dokter spesialis, praktek dokter mandiri, bidan, klinik gigi, apotek, dan faskes lainnya. Pesan menonjolkan regulasi SATUSEHAT Kemenkes (Permenkes 24/2022) & demo aplikasi gratis.
            </p>
            <div className="bg-[#16191D] p-2.5 rounded border border-[#24292E] text-[11px] font-mono text-[#9BA7B4]">
              Template: Nama Faskes + Bridging SATUSEHAT + Rekam Medis Digital + Penawaran Demo
            </div>
          </div>
        </div>
      </div>

      {/* Step 1 to 4 Installation Cards */}
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
          <Laptop className="w-4 h-4 text-[#D4FF44]" />
          <span>Cara Memasang Ekstensi di Google Chrome (Developer Mode)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded bg-[#D4FF44] text-[#0F1113] font-mono font-bold flex items-center justify-center text-[10px]">1</span>
              <span>Unduh & Ekstrak File ZIP</span>
            </div>
            <p className="text-[#9BA7B4]">
              Klik tombol <strong className="text-white">"Unduh Ekstensi (.ZIP)"</strong> di atas, lalu ekstrak arsip ZIP ke dalam folder di komputer Anda (misalnya di folder Documents).
            </p>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded bg-[#D4FF44] text-[#0F1113] font-mono font-bold flex items-center justify-center text-[10px]">2</span>
              <span>Buka Menu Ekstensi Chrome</span>
            </div>
            <p className="text-[#9BA7B4]">
              Buka Google Chrome, ketik pada bilah alamat: <code className="bg-[#1D2126] border border-[#2A3038] px-1.5 py-0.5 rounded font-mono text-[#D4FF44]">chrome://extensions/</code> lalu tekan Enter.
            </p>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded bg-[#D4FF44] text-[#0F1113] font-mono font-bold flex items-center justify-center text-[10px]">3</span>
              <span>Aktifkan Developer Mode</span>
            </div>
            <p className="text-[#9BA7B4]">
              Nyalakan toggle <strong className="text-white">"Developer mode"</strong> (Mode pengembang) di sudut kanan atas halaman ekstensi Chrome.
            </p>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded bg-[#D4FF44] text-[#0F1113] font-mono font-bold flex items-center justify-center text-[10px]">4</span>
              <span>Klik "Load unpacked"</span>
            </div>
            <p className="text-[#9BA7B4]">
              Klik tombol <strong className="text-white">"Load unpacked"</strong> (Muat yang belum dibongkar) di pojok kiri atas dan pilih folder hasil ekstrak tadi. Ekstensi siap digunakan!
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onDownloadZip}
            disabled={isDownloadingZip}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Paket Ekstensi (.ZIP) Sekarang</span>
          </button>
        </div>
      </div>

      {/* Target Niche Suggestions */}
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl p-5 shadow-sm space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
          <Search className="w-4 h-4 text-[#D4FF44]" />
          <span>Rekomendasi Kata Kunci Pencarian Google Maps (Konversi Tinggi)</span>
        </h3>
        <p className="text-[#9BA7B4]">
          Kategori bisnis & fasilitas kesehatan yang sangat prospektif untuk penawaran Website dan Aplikasi Rekam Medis (RME):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-[#131518] border border-[#58A6FF]/30 rounded-lg p-2.5 font-medium text-white flex items-center gap-2">
            <span>🩺</span>
            <div>
              <div className="font-bold text-[#58A6FF]">Klinik Pratama & Utama</div>
              <div className="text-[10px] text-[#7E8B99]">Target: RME & SIMKlinik SATUSEHAT</div>
            </div>
          </div>

          <div className="bg-[#131518] border border-[#58A6FF]/30 rounded-lg p-2.5 font-medium text-white flex items-center gap-2">
            <span>🦷</span>
            <div>
              <div className="font-bold text-[#58A6FF]">Praktek Dokter & Klinik Gigi</div>
              <div className="text-[10px] text-[#7E8B99]">Target: RME Mandiri & Odontogram</div>
            </div>
          </div>

          <div className="bg-[#131518] border border-[#58A6FF]/30 rounded-lg p-2.5 font-medium text-white flex items-center gap-2">
            <span>💊</span>
            <div>
              <div className="font-bold text-[#58A6FF]">Apotek & Praktek Bidan</div>
              <div className="text-[10px] text-[#7E8B99]">Target: RME Bidan & Stok Obat</div>
            </div>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-2.5 font-medium text-[#E1E7EC] flex items-center gap-2">
            <span>🔧</span>
            <div>
              <div className="font-bold text-white">Bengkel Mobil & Motor</div>
              <div className="text-[10px] text-[#7E8B99]">Target: Website & Google SEO</div>
            </div>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-2.5 font-medium text-[#E1E7EC] flex items-center gap-2">
            <span>🏠</span>
            <div>
              <div className="font-bold text-white">Kontraktor & Interior</div>
              <div className="text-[10px] text-[#7E8B99]">Target: Website Portofolio Proyek</div>
            </div>
          </div>

          <div className="bg-[#131518] border border-[#24292E] rounded-lg p-2.5 font-medium text-[#E1E7EC] flex items-center gap-2">
            <span>⚖️</span>
            <div>
              <div className="font-bold text-white">Kantor Hukum & Konsultan</div>
              <div className="text-[10px] text-[#7E8B99]">Target: Website Profil Korporat</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
