import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  Stethoscope, 
  Globe, 
  Phone,
  FileSpreadsheet
} from 'lucide-react';
import { BusinessLead } from '../types';
import { parseCSVLeads, CSVImportResult } from '../utils/csvImporter';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newLeads: BusinessLead[], mode: 'merge' | 'replace') => void;
  existingCount: number;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingCount
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CSVImportResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = parseCSVLeads(content);
        setParseResult(result);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    const result = parseCSVLeads(pastedText);
    setParseResult(result);
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.leads.length === 0) return;
    onImport(parseResult.leads, importMode);
    onClose();
  };

  const handleLoadSampleCSV = () => {
    const sample = `Nama Bisnis,Kategori,Rating,Jumlah Ulasan,Alamat Lengkap,Nomor Telepon,Status Website,URL Website Terdeteksi,Catatan / Analisis Domain,URL Google Maps
"Klinik Medika Sejahtera Pratama","Klinik Medis","4.8","128","Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan","0812-3456-7890","Belum Memiliki Website","-","Tanpa domain resmi","https://maps.google.com/?cid=1001"
"Apotek & Praktek dr. Hendra Sp.A","Praktek Dokter","4.9","84","Jl. Margonda Raya No. 12, Depok","0857-1122-3344","Belum Memiliki Website","-","Tanpa domain resmi","https://maps.google.com/?cid=1002"
"Klinik Gigi Smile Dental Care","Klinik Gigi & Mulut","4.7","95","Ruko Gading Serpong Blok AB No. 8, Tangerang","0813-8899-0011","Belum Memiliki Website","-","Tanpa domain resmi","https://maps.google.com/?cid=1003"
"Bengkel Motor Jaya Abadi","Bengkel Sepeda Motor","4.6","52","Jl. Raya Pasar Minggu No. 88, Jakarta Selatan","0819-2233-4455","Belum Memiliki Website","-","Tanpa domain resmi","https://maps.google.com/?cid=1004"
"Rumah Makan Padang Minang Asli","Restoran Masakan Padang","4.5","210","Jl. Tebet Timur Dalam No. 14, Jakarta Selatan","0821-5566-7788","Belum Memiliki Website","-","Tanpa domain resmi","https://maps.google.com/?cid=1005"
"Praktek Bidan Hj. Siti Rahma","Bidan & Bersalin","4.9","67","Jl. Kebon Jeruk Baru No. 23, Jakarta Barat","0878-9900-1122","Belum Memiliki Website","-","Tanpa domain resmi","https://maps.google.com/?cid=1006"`;

    setPastedText(sample);
    setActiveTab('paste');
    const result = parseCSVLeads(sample);
    setParseResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16191D] border border-[#2A3038] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-[#24292E] flex items-center justify-between bg-[#131518]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4FF44]/10 border border-[#D4FF44]/30 flex items-center justify-center text-[#D4FF44]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">Import Data Prospek dari CSV</h3>
              <p className="text-xs text-[#7E8B99]">Unggah file CSV hasil scrape Google Maps atau paste teks tabel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7E8B99] hover:text-white p-1.5 rounded-lg hover:bg-[#1D2126] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#24292E] space-x-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'text-[#D4FF44] border-b-2 border-[#D4FF44]'
                  : 'text-[#7E8B99] hover:text-[#C5D1DE]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-3 transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'paste'
                  ? 'text-[#D4FF44] border-b-2 border-[#D4FF44]'
                  : 'text-[#7E8B99] hover:text-[#C5D1DE]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tempel (Paste) Teks CSV</span>
            </button>
          </div>

          {/* Tab Upload */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                isDragging
                  ? 'border-[#D4FF44] bg-[#D4FF44]/5'
                  : 'border-[#2A3038] hover:border-[#D4FF44]/50 bg-[#101215]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#1D2126] border border-[#2A3038] flex items-center justify-center text-[#D4FF44]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {fileName ? fileName : 'Klik untuk memilih file CSV atau seret ke sini'}
                </p>
                <p className="text-xs text-[#7E8B99] mt-1">
                  Format .csv atau .txt (Mendukung delimiter koma, titik koma, dan tab)
                </p>
              </div>
            </div>
          )}

          {/* Tab Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (e.target.value.trim().length > 10) {
                    const res = parseCSVLeads(e.target.value);
                    setParseResult(res);
                  }
                }}
                placeholder={`Tempelkan isi CSV di sini...\nContoh:\nNama Bisnis,Kategori,Rating,Jumlah Ulasan,Alamat,Nomor Telepon,Status Website\n"Klinik Medika Pratama","Klinik","4.8","120","Jl. Gatot Subroto No. 10","08123456789","Belum Memiliki Website"`}
                rows={6}
                className="w-full bg-[#101215] border border-[#2A3038] rounded-xl p-3 text-xs font-mono text-[#C5D1DE] placeholder:text-[#5A6675] focus:outline-none focus:border-[#D4FF44]"
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleLoadSampleCSV}
                  className="text-xs text-[#D4FF44] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Muat Contoh Data CSV (Klinik & Usaha)</span>
                </button>
                <button
                  type="button"
                  onClick={handleParsePasted}
                  className="px-3 py-1.5 bg-[#24292E] hover:bg-[#2F353C] text-[#E1E7EC] text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Periksa Format
                </button>
              </div>
            </div>
          )}

          {/* Parsing Results Breakdown */}
          {parseResult && (
            <div className="bg-[#101215] border border-[#24292E] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4FF44]" />
                  <span className="text-xs font-bold text-white">Hasil Analisis File CSV</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1D2126] text-[#D4FF44] border border-[#D4FF44]/30">
                  {parseResult.validCount} Baris Siap Diimport
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#24292E]">
                  <div className="text-[10px] text-[#7E8B99]">Total Baris</div>
                  <div className="font-bold text-white font-mono text-sm mt-0.5">{parseResult.totalRows}</div>
                </div>
                <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#24292E]">
                  <div className="text-[10px] text-[#7E8B99] flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3 text-[#D4FF44]" />
                    <span>Ada No HP</span>
                  </div>
                  <div className="font-bold text-[#D4FF44] font-mono text-sm mt-0.5">
                    {parseResult.leads.filter(l => l.phone && l.phone !== '-').length}
                  </div>
                </div>
                <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#24292E]">
                  <div className="text-[10px] text-[#7E8B99] flex items-center justify-center gap-1">
                    <Stethoscope className="w-3 h-3 text-[#58A6FF]" />
                    <span>Faskes / Medis</span>
                  </div>
                  <div className="font-bold text-[#58A6FF] font-mono text-sm mt-0.5">{parseResult.medicalCount}</div>
                </div>
                <div className="bg-[#16191D] p-2.5 rounded-lg border border-[#24292E]">
                  <div className="text-[10px] text-[#7E8B99] flex items-center justify-center gap-1">
                    <Globe className="w-3 h-3 text-[#FFA116]" />
                    <span>Bisnis Umum</span>
                  </div>
                  <div className="font-bold text-[#FFA116] font-mono text-sm mt-0.5">
                    {parseResult.validCount - parseResult.medicalCount}
                  </div>
                </div>
              </div>

              {/* Preview top 3 rows */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-[#7E8B99] font-semibold">Pratinjau Prospek yang Terdeteksi:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {parseResult.leads.slice(0, 3).map((lead, idx) => (
                    <div key={idx} className="text-[11px] bg-[#16191D] p-2 rounded border border-[#24292E] flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="font-bold text-white">{lead.name}</span>
                        <span className="text-[#7E8B99] ml-1.5 font-mono text-[10px]">({lead.category})</span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {lead.isMedicalLead && (
                          <span className="text-[10px] bg-[#58A6FF]/15 text-[#58A6FF] px-1.5 py-0.5 rounded border border-[#58A6FF]/30">
                            Medis / RME
                          </span>
                        )}
                        <span className="text-[10px] bg-[#1D2126] text-[#A0ACB9] px-1.5 py-0.5 rounded font-mono">
                          {lead.phone}
                        </span>
                      </div>
                    </div>
                  ))}
                  {parseResult.leads.length > 3 && (
                    <div className="text-[10px] text-center text-[#7E8B99] py-0.5">
                      + {parseResult.leads.length - 3} prospek lainnya
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings if any */}
              {parseResult.warnings.length > 0 && (
                <div className="text-[11px] text-[#FFA116] bg-[#FFA116]/10 border border-[#FFA116]/30 p-2.5 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{parseResult.warnings[0]}</div>
                </div>
              )}
            </div>
          )}

          {/* Import Mode Selector */}
          {parseResult && parseResult.validCount > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#C5D1DE]">Metode Penggabungan Data:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                    importMode === 'merge'
                      ? 'border-[#D4FF44] bg-[#D4FF44]/5 text-white'
                      : 'border-[#24292E] bg-[#101215] text-[#7E8B99] hover:border-[#3A424B]'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-[#D4FF44]"
                  />
                  <div>
                    <div className="font-semibold text-white">Gabungkan (Merge)</div>
                    <div className="text-[11px] text-[#7E8B99]">Tambahkan ke {existingCount} prospek yang sudah ada</div>
                  </div>
                </label>

                <label
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                    importMode === 'replace'
                      ? 'border-[#FF4444] bg-[#FF4444]/5 text-white'
                      : 'border-[#24292E] bg-[#101215] text-[#7E8B99] hover:border-[#3A424B]'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-[#FF4444]"
                  />
                  <div>
                    <div className="font-semibold text-white">Ganti Semua (Replace)</div>
                    <div className="text-[11px] text-[#7E8B99]">Hapus data lama dan gantikan dengan CSV ini</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-[#24292E] bg-[#131518] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#7E8B99] hover:text-white rounded-lg transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parseResult || parseResult.validCount === 0}
            className="px-5 py-2.5 bg-[#D4FF44] hover:bg-[#E2FF70] disabled:bg-[#24292E] disabled:text-[#5A6675] text-[#0F1113] text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import {parseResult ? `${parseResult.validCount} Prospek` : 'Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
