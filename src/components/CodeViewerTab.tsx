import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  FileCode
} from 'lucide-react';
import { EXTENSION_FILES } from '../extension-files/extensionData';
import { copyTextToClipboard } from '../utils/clipboard';

interface CodeViewerTabProps {
  onDownloadZip: () => void;
  isDownloadingZip: boolean;
}

export const CodeViewerTab: React.FC<CodeViewerTabProps> = ({
  onDownloadZip,
  isDownloadingZip
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = EXTENSION_FILES[selectedFileIndex] || EXTENSION_FILES[0];

  const handleCopyCode = async () => {
    if (!currentFile) return;
    const success = await copyTextToClipboard(currentFile.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16191D] border border-[#24292E] rounded-xl p-4 sm:p-5 text-white shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold font-sans">Kode Sumber Ekstensi Chrome (Manifest V3)</h2>
            <span className="bg-[#D4FF44]/15 text-[#D4FF44] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#D4FF44]/30 uppercase tracking-wider">
              {EXTENSION_FILES.length} File Lengkap
            </span>
          </div>
          <p className="text-xs text-[#9BA7B4] mt-1">
            Seluruh berkas ekstensi telah divalidasi dan siap dimuat ke Google Chrome melalui Developer Mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1D2126] hover:bg-[#252B32] text-[#E1E7EC] border border-[#2A3038] rounded-lg transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#D4FF44]" />
                <span className="text-[#D4FF44]">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#7E8B99]" />
                <span>Salin File Ini</span>
              </>
            )}
          </button>

          <button
            onClick={onDownloadZip}
            disabled={isDownloadingZip}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Paket .ZIP</span>
          </button>
        </div>
      </div>

      {/* File Tabs & Editor Box */}
      <div className="bg-[#131518] border border-[#24292E] rounded-xl shadow-lg overflow-hidden">
        {/* File Navigator Bar */}
        <div className="flex items-center space-x-1.5 p-2 bg-[#16191D] border-b border-[#24292E] overflow-x-auto scrollbar-none">
          {EXTENSION_FILES.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => {
                setSelectedFileIndex(idx);
                setCopied(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition whitespace-nowrap cursor-pointer ${
                selectedFileIndex === idx
                  ? 'bg-[#D4FF44] text-[#0F1113] font-bold shadow-sm'
                  : 'text-[#7E8B99] hover:text-[#E1E7EC] hover:bg-[#1D2126]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* File Description Bar */}
        {currentFile && (
          <div className="px-4 py-2 bg-[#101215] border-b border-[#24292E] flex items-center justify-between text-xs text-[#7E8B99]">
            <span>{currentFile.description}</span>
            <span className="font-mono text-[11px] text-[#D4FF44]/70">{currentFile.path}</span>
          </div>
        )}

        {/* Code Content Box */}
        {currentFile && (
          <div className="p-4 overflow-x-auto max-h-[550px] font-mono text-xs text-[#C5D1DE] leading-relaxed">
            <pre>
              <code>{currentFile.content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

