import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  MessageSquare, 
  Globe, 
  Stethoscope, 
  Sparkles, 
  FileText,
  Copy,
  Info
} from 'lucide-react';
import { WhatsAppTemplate, OutreachType } from '../types';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WhatsAppTemplate[];
  onSaveTemplates: (templates: WhatsAppTemplate[]) => void;
  onResetTemplates: () => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
  onResetTemplates
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    type: OutreachType;
    description: string;
    template: string;
  }>({
    name: '',
    type: 'website',
    description: '',
    template: ''
  });

  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'website' | 'rekam_medis' | 'custom'>('all');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setFormData({
      name: '',
      type: 'website',
      description: '',
      template: `Halo {name}, salam kenal.\n\nSaya melihat profil bisnis Anda di Google Maps ({category}) di {city} dengan {rating_text}.\n\n...\n\nSalam,\n{sender_name}`
    });
    setIsCreating(true);
    setEditingId(null);
  };

  const handleStartEdit = (tpl: WhatsAppTemplate) => {
    setFormData({
      name: tpl.name,
      type: tpl.type,
      description: tpl.description || '',
      template: tpl.template
    });
    setEditingId(tpl.id);
    setIsCreating(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.template.trim()) return;

    if (isCreating) {
      const newTpl: WhatsAppTemplate = {
        id: `tpl_custom_${Date.now()}`,
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || 'Template kustom buatan pengguna',
        template: formData.template,
        isCustom: true,
        createdAt: new Date().toISOString()
      };
      onSaveTemplates([...templates, newTpl]);
    } else if (editingId) {
      const updated = templates.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            name: formData.name.trim(),
            type: formData.type,
            description: formData.description.trim(),
            template: formData.template
          };
        }
        return t;
      });
      onSaveTemplates(updated);
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus template pesan ini?')) {
      const updated = templates.filter(t => t.id !== id);
      onSaveTemplates(updated);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      template: prev.template + variable
    }));
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const filteredTemplates = templates.filter(t => {
    if (activeTypeTab === 'all') return true;
    if (activeTypeTab === 'custom') return t.isCustom;
    return t.type === activeTypeTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#24292E] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manajemen Template Pesan WhatsApp</h3>
              <p className="text-xs text-[#9BA7B4]">
                Kelola variasi template penawaran Website, Rekam Medis (RME), atau buat template kustom baru.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9BA7B4] hover:text-white hover:bg-[#24292E] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Action Bar & Tabs */}
          {!isCreating && !editingId && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131518] p-3 rounded-lg border border-[#24292E]">
              {/* Type Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                <button
                  onClick={() => setActiveTypeTab('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    activeTypeTab === 'all'
                      ? 'bg-[#24292E] text-white border border-[#30363D]'
                      : 'text-[#9BA7B4] hover:text-white'
                  }`}
                >
                  Semua ({templates.length})
                </button>
                <button
                  onClick={() => setActiveTypeTab('website')}
                  className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    activeTypeTab === 'website'
                      ? 'bg-[#D4FF44]/10 text-[#D4FF44] border border-[#D4FF44]/30'
                      : 'text-[#9BA7B4] hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </button>
                <button
                  onClick={() => setActiveTypeTab('rekam_medis')}
                  className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    activeTypeTab === 'rekam_medis'
                      ? 'bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/30'
                      : 'text-[#9BA7B4] hover:text-white'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Rekam Medis</span>
                </button>
                <button
                  onClick={() => setActiveTypeTab('custom')}
                  className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    activeTypeTab === 'custom'
                      ? 'bg-[#A371F7]/10 text-[#A371F7] border border-[#A371F7]/30'
                      : 'text-[#9BA7B4] hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kustom ({templates.filter(t => t.isCustom).length})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('Kembalikan semua template ke versi default?')) {
                      onResetTemplates();
                    }
                  }}
                  title="Kembalikan template bawaan"
                  className="px-2.5 py-1.5 bg-[#1C2128] hover:bg-[#24292E] text-[#7E8B99] hover:text-white text-xs rounded-md border border-[#30363D] transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  onClick={handleStartCreate}
                  className="px-3 py-1.5 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Template Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Create / Edit */}
          {(isCreating || editingId) ? (
            <form onSubmit={handleSaveForm} className="bg-[#131518] border border-[#24292E] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#24292E] pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#D4FF44]/10 text-[#D4FF44]">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {isCreating ? 'Tambah Template Pesan Baru' : 'Edit Template Pesan'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="text-xs text-[#9BA7B4] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#9BA7B4] font-medium mb-1">Nama / Judul Template *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="misal: Penawaran Website Diskon Ramadhan"
                    className="w-full bg-[#16191D] border border-[#24292E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4FF44]"
                  />
                </div>

                <div>
                  <label className="block text-[#9BA7B4] font-medium mb-1">Kategori Penawaran *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as OutreachType })}
                    className="w-full bg-[#16191D] border border-[#24292E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4FF44]"
                  >
                    <option value="website">Website & Company Profile</option>
                    <option value="rekam_medis">Rekam Medis (RME & SIMKlinik SATUSEHAT)</option>
                    <option value="custom">Penawaran Kustom / Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9BA7B4] text-xs font-medium mb-1">Keterangan Singkat</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="misal: Fokus pada penawaran faskes pratama dengan demo gratis"
                  className="w-full bg-[#16191D] border border-[#24292E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF44]"
                />
              </div>

              {/* Variable Chips Inserter */}
              <div className="bg-[#16191D] border border-[#24292E] rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#D4FF44] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Variabel Otomatis (Klik untuk menyisipkan ke dalam teks):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{name}', desc: 'Nama Bisnis' },
                    { tag: '{category}', desc: 'Kategori' },
                    { tag: '{city}', desc: 'Kota/Lokasi' },
                    { tag: '{rating_text}', desc: 'Teks Rating' },
                    { tag: '{rating}', desc: 'Angka Rating' },
                    { tag: '{reviews}', desc: 'Jumlah Ulasan' },
                    { tag: '{address}', desc: 'Alamat' },
                    { tag: '{phone}', desc: 'No Telp' },
                    { tag: '{sender_name}', desc: 'Nama Pengirim' }
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariable(item.tag)}
                      className="px-2 py-1 bg-[#24292E] hover:bg-[#30363D] text-[#C5D1DE] hover:text-white rounded text-[10px] font-mono border border-[#30363D] transition flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-[#D4FF44] font-bold">{item.tag}</span>
                      <span className="text-[#7E8B99]">({item.desc})</span>
                    </button>
                  ))}
                </div>
                {copiedVar && (
                  <span className="text-[10px] text-[#7EE787] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Disisipkan {copiedVar}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[#9BA7B4] text-xs font-medium mb-1">Isi Pesan Template WhatsApp *</label>
                <textarea
                  required
                  rows={8}
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="Ketik isi pesan WhatsApp di sini..."
                  className="w-full bg-[#16191D] border border-[#24292E] rounded-lg p-3 text-xs text-white font-sans leading-relaxed focus:outline-none focus:border-[#D4FF44]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 bg-[#24292E] hover:bg-[#30363D] text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Template</span>
                </button>
              </div>
            </form>
          ) : (
            /* Template Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => {
                const isMed = tpl.type === 'rekam_medis';
                const isWeb = tpl.type === 'website';

                return (
                  <div
                    key={tpl.id}
                    className="bg-[#131518] border border-[#24292E] hover:border-[#30363D] rounded-xl p-4 flex flex-col justify-between space-y-3 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-md text-xs ${
                              isMed
                                ? 'bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/30'
                                : isWeb
                                ? 'bg-[#D4FF44]/10 text-[#D4FF44] border border-[#D4FF44]/30'
                                : 'bg-[#A371F7]/10 text-[#A371F7] border border-[#A371F7]/30'
                            }`}
                          >
                            {isMed ? <Stethoscope className="w-4 h-4" /> : isWeb ? <Globe className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{tpl.name}</h4>
                            <span className="text-[10px] text-[#7E8B99]">
                              {isMed ? 'Rekam Medis (RME)' : isWeb ? 'Website & Profil' : 'Kustom'}
                              {tpl.isCustom && ' • Buatan Pengguna'}
                            </span>
                          </div>
                        </div>

                        {/* Edit / Delete actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(tpl)}
                            title="Edit template ini"
                            className="p-1 text-[#9BA7B4] hover:text-white hover:bg-[#24292E] rounded transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {tpl.isCustom && (
                            <button
                              onClick={() => handleDelete(tpl.id)}
                              title="Hapus template"
                              className="p-1 text-[#9BA7B4] hover:text-[#F85149] hover:bg-[#F85149]/10 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {tpl.description && (
                        <p className="text-[11px] text-[#9BA7B4] line-clamp-2">
                          {tpl.description}
                        </p>
                      )}

                      <div className="bg-[#16191D] p-3 rounded-lg border border-[#24292E] text-[11px] text-[#C5D1DE] font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {tpl.template}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#7E8B99] pt-2 border-t border-[#24292E]">
                      <span>{tpl.template.length} Karakter</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tpl.template);
                          alert('Teks template berhasil disalin ke clipboard!');
                        }}
                        className="text-[#D4FF44] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin Teks</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#24292E] bg-[#131518] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#7E8B99]">
            <Info className="w-4 h-4 text-[#58A6FF]" />
            <span>Template yang disimpan akan langsung tersedia pada tombol kirim WhatsApp di tabel prospek.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#24292E] hover:bg-[#30363D] text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
