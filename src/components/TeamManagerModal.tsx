import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Mail, 
  Shield, 
  Eye, 
  EyeOff,
  UserX,
  Send,
  Sparkles,
  Chrome,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Inbox
} from 'lucide-react';
import { WhitelistUser, UserRole, MemberStatus, LicenseRequest } from '../types';
import { 
  fetchAllWhitelistUsers, 
  addWhitelistUser, 
  updateWhitelistUser, 
  deleteWhitelistUser, 
  regenerateUserLicenseKey,
  fetchAllLicenseRequests,
  updateLicenseRequestStatus,
  fetchAdminWhatsAppPhone,
  updateAdminWhatsAppPhone,
  getAdminWhatsAppPhoneSync,
  ROOT_ADMIN_EMAIL,
  isRootAdminEmail
} from '../firebase/teamService';
import { useAuth } from '../context/AuthContext';
import { copyTextToClipboard } from '../utils/clipboard';

interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile, isRootAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'requests'>('members');
  
  // Whitelist Users
  const [users, setUsers] = useState<WhitelistUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // License Requests
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Add User Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Copied Key State
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [revealedKeyEmail, setRevealedKeyEmail] = useState<string | null>(null);

  // Admin WhatsApp Phone State
  const [adminPhone, setAdminPhone] = useState<string>(getAdminWhatsAppPhoneSync());
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>(getAdminWhatsAppPhoneSync());
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userList, reqList, waPhone] = await Promise.all([
        fetchAllWhitelistUsers(),
        fetchAllLicenseRequests(),
        fetchAdminWhatsAppPhone()
      ]);
      setUsers(userList);
      setRequests(reqList);
      setAdminPhone(waPhone);
      setPhoneInput(waPhone);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data tim dan permohonan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdminPhone = async () => {
    setIsSavingPhone(true);
    setError(null);
    try {
      const res = await updateAdminWhatsAppPhone(phoneInput);
      if (res.success) {
        setAdminPhone(res.formattedPhone);
        setPhoneInput(res.formattedPhone);
        setIsEditingPhone(false);
        setSuccess(`Nomor WhatsApp Admin berhasil diperbarui ke +${res.formattedPhone}`);
      } else {
        setError(res.error || 'Gagal memperbarui nomor WhatsApp Admin.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan nomor WhatsApp.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await addWhitelistUser(
        newEmail.trim(),
        newName.trim(),
        newRole,
        newNotes.trim(),
        newPhone.trim() || undefined
      );

      setUsers(prev => {
        const filtered = prev.filter(u => u.email.toLowerCase() !== added.email.toLowerCase());
        return [added, ...filtered];
      });

      setSuccess(`Berhasil mendaftarkan ${added.email} ke Whitelist dengan Kunci Lisensi: ${added.licenseKey}`);
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      setNewNotes('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan anggota baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: WhitelistUser) => {
    if (isRootAdminEmail(user.email)) return;
    const nextStatus: MemberStatus = user.status === 'active' ? 'suspended' : 'active';
    
    try {
      await updateWhitelistUser(user.email, { status: nextStatus });
      setUsers(prev => prev.map(u => u.email === user.email ? { ...u, status: nextStatus } : u));
      setSuccess(`Status akses untuk ${user.email} diubah menjadi: ${nextStatus === 'active' ? 'Aktif' : 'Ditangguhkan'}`);
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui status anggota.');
    }
  };

  const handleRegenerateKey = async (email: string) => {
    if (isRootAdminEmail(email)) return;
    if (!confirm(`Apakah Anda yakin ingin mengacak ulang Kunci Lisensi untuk ${email}? Kunci lisensi lama tidak akan berlaku lagi.`)) {
      return;
    }

    try {
      const newKey = await regenerateUserLicenseKey(email);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, licenseKey: newKey } : u));
      setSuccess(`Kunci Lisensi baru untuk ${email}: ${newKey}`);
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui kunci lisensi.');
    }
  };

  const handleDeleteUser = async (user: WhitelistUser) => {
    if (isRootAdminEmail(user.email)) return;
    if (!confirm(`Hapus ${user.email} dari daftar whitelist? Pengguna tidak akan dapat mengakses Web App & Ekstensi lagi.`)) {
      return;
    }

    try {
      await deleteWhitelistUser(user.email);
      setUsers(prev => prev.filter(u => u.email !== user.email));
      setSuccess(`Berhasil menghapus ${user.email} dari Whitelist.`);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus anggota.');
    }
  };

  const handleApproveRequest = async (req: LicenseRequest) => {
    setProcessingRequestId(req.id);
    setError(null);
    setSuccess(null);

    try {
      // 1. Add to Whitelist if not exists, or get existing key
      let existingUser = users.find(u => u.email.toLowerCase() === req.email.toLowerCase());
      let userKey = existingUser?.licenseKey;

      if (!existingUser) {
        existingUser = await addWhitelistUser(
          req.email,
          req.name,
          'member',
          req.reason || 'Disetujui dari permohonan lisensi',
          req.whatsappPhone
        );
        userKey = existingUser.licenseKey;
        setUsers(prev => [existingUser!, ...prev]);
      }

      // 2. Mark request as approved
      await updateLicenseRequestStatus(req.id, 'approved');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved', resolvedAt: new Date().toISOString() } : r));

      setSuccess(`Permohonan ${req.email} disetujui! Kunci Lisensi: ${userKey}`);

      // 3. Open WhatsApp to send the license key to the member directly
      if (req.whatsappPhone) {
        const cleanPhone = req.whatsappPhone.replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
        const msg = `Halo ${req.name},\nPermohonan Kunci Lisensi Anda untuk Google Maps Lead Scraper telah disetujui!\n\nEmail: ${req.email}\nKunci Lisensi: ${userKey}\n\nSilakan gunakan kunci ini untuk login ke Web App dan Ekstensi Chrome.`;
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyetujui permohonan.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (req: LicenseRequest) => {
    setProcessingRequestId(req.id);
    try {
      await updateLicenseRequestStatus(req.id, 'rejected');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected', resolvedAt: new Date().toISOString() } : r));
      setSuccess(`Permohonan untuk ${req.email} telah ditolak.`);
    } catch (err: any) {
      setError(err?.message || 'Gagal menolak permohonan.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCopyInvitation = async (user: WhitelistUser) => {
    const inviteText = `Halo ${user.name},\nAnda telah diberikan akses ke Google Maps Lead Scraper & Extractor!\n\nEmail Terdaftar: ${user.email}\nKunci Lisensi Ekstensi: ${user.licenseKey}\nPeran: ${user.role === 'admin' ? 'Admin Tim' : 'Scraper Member'}\n\nSilakan buka aplikasi dan login dengan email Google di atas atau masukkan Kunci Lisensi pada Ekstensi Chrome.`;
    const ok = await copyTextToClipboard(inviteText);
    if (ok) {
      setCopiedEmail(user.email);
      setTimeout(() => setCopiedEmail(null), 2500);
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#2A3038] rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4FF44]/10 border border-[#D4FF44]/30 flex items-center justify-center text-[#D4FF44]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>Manajemen Multi-User & Whitelist Email</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#D4FF44]/15 text-[#D4FF44] border border-[#D4FF44]/30 rounded">
                  Access Control List (ACL)
                </span>
              </h3>
              <p className="text-xs text-[#7E8B99]">
                Kelola daftar email anggota tim yang diizinkan menggunakan Web App dan Ekstensi Chrome
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7E8B99] hover:text-white p-2 rounded-lg hover:bg-[#1D2126] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation: Members vs Requests */}
        <div className="flex border-b border-[#24292E] bg-[#111316] text-xs font-semibold px-6 pt-1">
          <button
            onClick={() => setActiveSubTab('members')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeSubTab === 'members'
                ? 'border-[#D4FF44] text-[#D4FF44] bg-[#16191D]'
                : 'border-transparent text-[#7E8B99] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anggota Terdaftar ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition cursor-pointer relative ${
              activeSubTab === 'requests'
                ? 'border-[#58A6FF] text-[#58A6FF] bg-[#16191D]'
                : 'border-transparent text-[#7E8B99] hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Permohonan Kunci Lisensi</span>
            {pendingRequestsCount > 0 && (
              <span className="bg-[#FF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                {pendingRequestsCount} Baru
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Admin WhatsApp Quick Setting */}
          {(isRootAdmin || userProfile?.isRootAdmin) && (
            <div className="bg-[#111316] border border-[#2A3038] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-white font-bold block text-xs">
                    Nomor WhatsApp Admin: <span className="font-mono text-[#D4FF44]">+{adminPhone}</span>
                  </span>
                  <span className="text-[11px] text-[#7E8B99]">
                    Tujuan permohonan lisensi anggota & bantuan login lupa kunci lisensi.
                  </span>
                </div>
              </div>

              {isEditingPhone ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="08123456789"
                    className="bg-[#16191D] border border-[#3A434F] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono w-40 focus:outline-none focus:border-[#58A6FF]"
                  />
                  <button
                    onClick={handleSaveAdminPhone}
                    disabled={isSavingPhone}
                    className="bg-[#58A6FF] hover:bg-[#79B8FF] text-[#0F1113] font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition disabled:opacity-50"
                  >
                    {isSavingPhone ? '...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPhone(false);
                      setPhoneInput(adminPhone);
                    }}
                    className="text-[#7E8B99] hover:text-white px-2 py-1.5 text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="bg-[#1F242B] hover:bg-[#2A313A] border border-[#2E353D] text-[#C5D1DE] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition self-start sm:self-auto shrink-0"
                >
                  Ubah Nomor WA Admin
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 p-3 rounded-xl text-xs text-[#FF6B6B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-[#3FB950]/10 border border-[#3FB950]/30 p-3 rounded-xl text-xs text-[#3FB950] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {activeSubTab === 'members' ? (
            <>
              {/* Top Actions & Notification */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111316] p-4 rounded-xl border border-[#24292E]">
                <div className="space-y-0.5">
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4FF44]" />
                    <span>Total Anggota Whitelist: {users.length} Orang</span>
                  </div>
                  <p className="text-[#9BA7B4] text-[11px]">
                    Email di luar daftar ini akan diblokir otomatis saat mencoba login ke Web App atau scraping via Ekstensi.
                  </p>
                </div>

                <button
                  onClick={() => { setShowAddForm(!showAddForm); setError(null); setSuccess(null); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0F1113] bg-[#D4FF44] hover:bg-[#E2FF70] rounded-xl transition cursor-pointer shadow-sm shadow-[#D4FF44]/15 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddForm ? 'Tutup Formulir' : '+ Daftarkan Email Baru'}</span>
                </button>
              </div>

              {/* Add User Form Drawer */}
              {showAddForm && (
                <form onSubmit={handleAddUser} className="bg-[#131518] border border-[#D4FF44]/40 rounded-xl p-4 sm:p-5 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2 text-white font-bold text-xs pb-1 border-b border-[#24292E]">
                    <UserPlus className="w-4 h-4 text-[#D4FF44]" />
                    <span>Formulir Pendaftaran Email Anggota Tim</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#C5D1DE] font-semibold">Alamat Email Google Anggota:</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nama.sales@gmail.com"
                        className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#C5D1DE] font-semibold">Nama Anggota / Tim:</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Contoh: Budi Santoso (Lead Scraper)"
                        className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#C5D1DE] font-semibold">Nomor WhatsApp (Opsional):</label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44] font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#C5D1DE] font-semibold">Peran (Role Akses):</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full mt-1 bg-[#16191D] border border-[#2A3038] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D4FF44]"
                      >
                        <option value="member">Member / Scraper (Ekstrak Data, Outreach WA, Kelola Leads)</option>
                        <option value="admin">Admin (Kelola Whitelist User & Database Penuh)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-[#C5D1DE] font-semibold">Catatan Khusus (Opsional):</label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Contoh: Tim Telemarketing Surabaya"
                        className="w-full mt-1 bg-[#16191D] border border-[#2A3038] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-2 text-xs text-[#7E8B99] hover:text-white bg-[#1D2126] rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-bold text-[#0F1113] bg-[#D4FF44] hover:bg-[#E2FF70] rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {isSubmitting ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#0F1113]/30 border-t-[#0F1113] rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      <span>Simpan & Buat Lisensi Akses</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Members Table */}
              <div className="bg-[#111316] border border-[#24292E] rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                  <div className="py-12 text-center text-[#7E8B99] space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D4FF44]" />
                    <p className="text-xs">Memuat daftar anggota...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-12 text-center text-[#7E8B99] space-y-2">
                    <Users className="w-8 h-8 mx-auto text-[#5A6675]" />
                    <p className="text-sm font-semibold text-white">Belum Ada Anggota Terdaftar</p>
                    <p className="text-xs">Klik tombol di atas untuk mendaftarkan email tim Anda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#16191D] text-[#7E8B99] font-mono border-b border-[#24292E] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Nama & Email Terdaftar</th>
                          <th className="py-3 px-4">Peran (Role)</th>
                          <th className="py-3 px-4">Status Akses</th>
                          <th className="py-3 px-4">Kunci Lisensi (Extension Key)</th>
                          <th className="py-3 px-4 text-right">Aksi Administrator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#24292E] text-[#C5D1DE]">
                        {users.map((user) => {
                          const isRoot = isRootAdminEmail(user.email);
                          const isRevealed = revealedKeyEmail === user.email;

                          return (
                            <tr key={user.email} className="hover:bg-[#16191D]/60 transition">
                              {/* User Email & Name */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{user.name || user.email.split('@')[0]}</span>
                                    {isRoot && (
                                      <span className="bg-[#D4FF44]/20 text-[#D4FF44] border border-[#D4FF44]/40 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                                        ROOT OWNER
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[11px] text-[#7E8B99] font-mono mt-0.5 flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#58A6FF]" />
                                  <span>{user.email}</span>
                                </div>
                                {user.whatsappPhone && (
                                  <div className="text-[11px] text-[#25D366] font-mono mt-0.5 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-[#25D366]" />
                                    <span>{user.whatsappPhone}</span>
                                  </div>
                                )}
                                {user.notes && (
                                  <div className="text-[10px] text-[#A0ACB9] italic mt-0.5">
                                    "{user.notes}"
                                  </div>
                                )}
                              </td>

                              {/* Role */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  user.role === 'admin' || isRoot
                                    ? 'bg-[#D4FF44]/15 text-[#D4FF44] border border-[#D4FF44]/30'
                                    : 'bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/30'
                                }`}>
                                  <Shield className="w-3 h-3" />
                                  <span>{user.role === 'admin' || isRoot ? 'ADMIN' : 'MEMBER'}</span>
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {user.status === 'active' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30 rounded text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Aktif</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF4444]/15 text-[#FF6B6B] border border-[#FF4444]/30 rounded text-[10px] font-bold">
                                    <UserX className="w-3 h-3" />
                                    <span>Ditangguhkan</span>
                                  </span>
                                )}
                              </td>

                              {/* License Key */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <span className="bg-[#16191D] border border-[#2A3038] px-2 py-1 rounded text-white font-semibold">
                                    {isRevealed ? user.licenseKey : `${user.licenseKey.slice(0, 10)}••••••••`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedKeyEmail(isRevealed ? null : user.email)}
                                    className="p-1 text-[#7E8B99] hover:text-white rounded cursor-pointer"
                                    title={isRevealed ? 'Sembunyikan' : 'Tampilkan Kunci'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Copy Full Invitation */}
                                  <button
                                    onClick={() => handleCopyInvitation(user)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-[#1D2126] hover:bg-[#252B32] border border-[#2A3038] rounded-md transition cursor-pointer"
                                    title="Salin format teks undangan & kunci akses"
                                  >
                                    {copiedEmail === user.email ? (
                                      <Check className="w-3.5 h-3.5 text-[#D4FF44]" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5 text-[#58A6FF]" />
                                    )}
                                    <span>{copiedEmail === user.email ? 'Tersalin!' : 'Kirim Akses'}</span>
                                  </button>

                                  {!isRoot && (
                                    <>
                                      {/* Toggle Active / Suspended */}
                                      <button
                                        onClick={() => handleToggleStatus(user)}
                                        className={`p-1.5 rounded-md border transition cursor-pointer ${
                                          user.status === 'active'
                                            ? 'text-[#FFA116] border-[#FFA116]/30 hover:bg-[#FFA116]/10'
                                            : 'text-[#3FB950] border-[#3FB950]/30 hover:bg-[#3FB950]/10'
                                        }`}
                                        title={user.status === 'active' ? 'Tangguhkan Akses (Suspend)' : 'Aktifkan Kembali'}
                                      >
                                        {user.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                      </button>

                                      {/* Regenerate Key */}
                                      <button
                                        onClick={() => handleRegenerateKey(user.email)}
                                        className="p-1.5 text-[#7E8B99] hover:text-[#58A6FF] hover:bg-[#1D2126] rounded-md transition cursor-pointer"
                                        title="Perbarui / Acak Ulang Kunci Lisensi"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Delete User */}
                                      <button
                                        onClick={() => handleDeleteUser(user)}
                                        className="p-1.5 text-[#7E8B99] hover:text-[#FF4444] hover:bg-[#FF4444]/10 rounded-md transition cursor-pointer"
                                        title="Hapus dari Whitelist"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* License Requests Tab */
            <div className="space-y-4">
              <div className="bg-[#111316] p-4 rounded-xl border border-[#24292E] space-y-1">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[#58A6FF]" />
                  <span>Antrean Permohonan Kunci Lisensi & Lupa Kunci</span>
                </h4>
                <p className="text-[#9BA7B4] text-[11px]">
                  Anggota yang mengajukan lisensi atau lupa kunci akan tercatat di sini beserta nomor WhatsApp aktif mereka.
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="py-12 text-center text-[#7E8B99] bg-[#111316] border border-[#24292E] rounded-xl space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-[#5A6675]" />
                  <p className="text-sm font-semibold text-white">Tidak Ada Permohonan Lisensi</p>
                  <p className="text-xs">Permohonan baru dari pengguna akan muncul otomatis di sini.</p>
                </div>
              ) : (
                <div className="bg-[#111316] border border-[#24292E] rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#16191D] text-[#7E8B99] font-mono border-b border-[#24292E] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Nama & Email Pemohon</th>
                          <th className="py-3 px-4">Nomor WhatsApp</th>
                          <th className="py-3 px-4">Alasan / Catatan</th>
                          <th className="py-3 px-4">Waktu Permohonan</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Tindakan Admin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#24292E] text-[#C5D1DE]">
                        {requests.map((req) => {
                          const isProcessing = processingRequestId === req.id;
                          return (
                            <tr key={req.id} className="hover:bg-[#16191D]/60 transition">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white">{req.name}</div>
                                <div className="text-[11px] text-[#7E8B99] font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#58A6FF]" />
                                  <span>{req.email}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-[#25D366] font-mono font-bold">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{req.whatsappPhone}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-[11px] text-[#A0ACB9] max-w-xs truncate">
                                {req.reason || '-'}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#7E8B99] font-mono">
                                {new Date(req.requestedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {req.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30 rounded text-[10px] font-bold">
                                    <Clock className="w-3 h-3" />
                                    <span>Menunggu</span>
                                  </span>
                                )}
                                {req.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30 rounded text-[10px] font-bold">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Disetujui</span>
                                  </span>
                                )}
                                {req.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF4444]/15 text-[#FF6B6B] border border-[#FF4444]/30 rounded text-[10px] font-bold">
                                    <XCircle className="w-3 h-3" />
                                    <span>Ditolak</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                {req.status === 'pending' ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleApproveRequest(req)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0F1113] bg-[#25D366] hover:bg-[#20bd5a] rounded-lg transition cursor-pointer shadow-sm disabled:opacity-50"
                                      title="Setujui dan kirim kunci lisensi via WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>Setujui & WA Kunci</span>
                                    </button>

                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleRejectRequest(req)}
                                      className="p-1.5 text-[#7E8B99] hover:text-[#FF6B6B] hover:bg-[#FF4444]/10 rounded-lg transition cursor-pointer disabled:opacity-50"
                                      title="Tolak Permohonan"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const cleanPhone = req.whatsappPhone.replace(/[^0-9]/g, '');
                                      const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                                      window.open(`https://wa.me/${targetPhone}`, '_blank');
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] text-[#25D366] hover:underline cursor-pointer"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>Chat WA</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guidelines Box */}
          <div className="bg-[#131518] border border-[#24292E] p-4 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <Chrome className="w-4 h-4 text-[#D4FF44]" />
              <span>Petunjuk untuk Anggota Tim:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#9BA7B4] text-[11px] leading-relaxed pl-1">
              <li>Anggota membuka <strong>Web App</strong> dan mengklik <em>"Login Akun Google"</em> dengan email yang sudah didaftarkan oleh Admin.</li>
              <li>Jika lupa Kunci Lisensi, anggota dapat mengklik <em>"Lupa Kunci Lisensi? Kirim Ulang via WhatsApp"</em> di layar login dengan menyertakan nomor WhatsApp.</li>
              <li>Pada <strong>Ekstensi Chrome</strong>, anggota memasukkan email dan <strong>Kunci Lisensi (License Key)</strong> mereka untuk otentikasi.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
