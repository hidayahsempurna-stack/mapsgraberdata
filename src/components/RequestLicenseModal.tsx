import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Send, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  User, 
  FileText,
  ShieldAlert
} from 'lucide-react';
import { ROOT_ADMIN_EMAIL, submitLicenseRequest, getAdminWhatsAppPhoneSync } from '../firebase/teamService';
import { normalizeWhatsAppNumber } from '../utils/whatsappTemplates';

interface RequestLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
  isForgotMode?: boolean;
}

export const RequestLicenseModal: React.FC<RequestLicenseModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  defaultName = '',
  isForgotMode = false
}) => {
  const [email, setEmail] = useState<string>(defaultEmail);
  const [name, setName] = useState<string>(defaultName);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = whatsappPhone.trim().replace(/[^0-9+]/g, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Masukkan alamat email Google yang valid.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Masukkan nomor WhatsApp yang valid (contoh: 08123456789 atau 628123456789).');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitLicenseRequest({
        email: cleanEmail,
        name: name.trim() || cleanEmail.split('@')[0],
        whatsappPhone: cleanPhone,
        reason: reason.trim() || (isForgotMode ? 'Lupa Kunci Lisensi, mohon kirimkan ulang ke WhatsApp' : 'Permintaan Akun/Kunci Lisensi Baru')
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirimkan permohonan lisensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendViaDirectWA = () => {
    const cleanPhone = whatsappPhone.trim().replace(/[^0-9+]/g, '');
    const cleanEmail = email.trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const adminPhone = getAdminWhatsAppPhoneSync();
    const noteText = isForgotMode ? 'Lupa Kunci Lisensi' : 'Permohonan Kunci Lisensi Baru';

    const text = `Halo Admin (${ROOT_ADMIN_EMAIL}),\n\nSaya ingin mengajukan ${noteText} untuk Google Maps Lead Scraper & Extractor:\n\n- Nama: ${cleanName}\n- Email: ${cleanEmail}\n- No. WhatsApp: ${cleanPhone}\n- Keterangan: ${reason.trim() || noteText}\n\nMohon bantuannya untuk memverifikasi dan mengirimkan Kunci Lisensi saya ke WhatsApp saya. Terima kasih!`;
    
    const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#2A3038] rounded-2xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#58A6FF]/15 border border-[#58A6FF]/30 flex items-center justify-center text-[#58A6FF]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                {isForgotMode ? 'Lupa Kunci Lisensi / Bantuan Login' : 'Ajukan Permintaan Kunci Lisensi'}
              </h3>
              <p className="text-[11px] text-[#7E8B99]">
                Admin akan memverifikasi dan mengirimkan kunci via WhatsApp / Email
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
        <div className="p-6 space-y-4 text-xs">
          {isSuccess ? (
            <div className="space-y-4 text-center py-3">
              <div className="w-12 h-12 rounded-full bg-[#3FB950]/15 border border-[#3FB950]/30 flex items-center justify-center text-[#3FB950] mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Permintaan Berhasil Dikirimkan!</h4>
                <p className="text-xs text-[#9BA7B4] leading-relaxed">
                  Data pengajuan lisensi untuk <strong className="text-white">{email}</strong> dengan nomor WhatsApp <strong className="text-[#58A6FF]">{whatsappPhone}</strong> telah tersimpan di sistem antrean Admin.
                </p>
              </div>

              <div className="bg-[#111316] border border-[#24292E] p-3 rounded-xl text-left text-[11px] text-[#7E8B99] space-y-1">
                <p>💡 Admin <strong className="text-white">{ROOT_ADMIN_EMAIL}</strong> akan meninjau dan mengirimkan Kunci Lisensi ke nomor WhatsApp Anda.</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendViaDirectWA}
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-lg shadow-[#25D366]/10"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Pesan Konfirmasi ke WhatsApp Admin</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-[#1D2126] hover:bg-[#252B32] text-[#C5D1DE] font-semibold rounded-xl transition text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="bg-[#111316] border border-[#24292E] p-3 rounded-xl text-[11px] text-[#9BA7B4] leading-relaxed">
                {isForgotMode 
                  ? 'Jika Anda lupa Kunci Lisensi yang pernah diberikan, sertakan nomor WhatsApp Anda agar Admin dapat mengirimkan kembali kunci lisensi aktif Anda.'
                  : 'Kunci Lisensi dan akses Whitelist dikelola langsung oleh Admin. Sertakan nomor WhatsApp aktif Anda untuk menerima kunci lisensi.'}
              </div>

              {error && (
                <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-2.5 rounded-xl text-xs text-[#FF6B6B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#58A6FF]" />
                  <span>Alamat Email Google Terdaftar: <span className="text-[#FF6B6B]">*</span></span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com"
                  className="w-full mt-1 bg-[#111316] border border-[#2A3038] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58A6FF]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#D4FF44]" />
                  <span>Nama Lengkap / Panggilan:</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full mt-1 bg-[#111316] border border-[#2A3038] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Nomor WhatsApp Aktif: <span className="text-[#FF6B6B]">*</span></span>
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="08123456789 atau 628123456789"
                  className="w-full mt-1 bg-[#111316] border border-[#2A3038] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25D366] font-mono"
                  required
                />
                <p className="text-[10px] text-[#7E8B99] mt-1">
                  Kunci lisensi akan dikirimkan langsung ke nomor WhatsApp ini.
                </p>
              </div>

              <div>
                <label className="text-[11px] text-[#C5D1DE] font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#7E8B99]" />
                  <span>Catatan / Alasan Permintaan (Opsional):</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isForgotMode ? 'Contoh: Lupa kunci lisensi saat ganti browser...' : 'Contoh: Anggota tim sales baru untuk wilayah Surabaya...'}
                  rows={2}
                  className="w-full mt-1 bg-[#111316] border border-[#2A3038] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58A6FF] resize-none"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] font-bold rounded-xl transition flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-lg shadow-[#58A6FF]/15 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Kirim Permohonan Kunci Lisensi</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-4 bg-transparent hover:bg-[#1D2126] text-[#7E8B99] hover:text-white rounded-xl transition text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
