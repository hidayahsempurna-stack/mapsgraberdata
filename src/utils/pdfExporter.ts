import { BusinessLead } from '../types';
import { extractCityFromAddress } from './whatsappTemplates';

interface PDFReportOptions {
  title?: string;
  generatedBy?: string;
  filterLabel?: string;
}

export function generateLeadsPDFReport(leads: BusinessLead[], options: PDFReportOptions = {}) {
  const title = options.title || 'Laporan Ringkasan Prospek Bisnis (Google Maps Leads)';
  const generatedBy = options.generatedBy || 'Tim Konsultan Digital';
  const filterLabel = options.filterLabel || 'Semua Data';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate statistics
  const total = leads.length;
  const withPhone = leads.filter(l => l.phone && l.phone !== '-').length;
  const medicalLeads = leads.filter(l => l.isMedicalLead).length;
  const generalLeads = total - medicalLeads;
  const contacted = leads.filter(l => l.firstContactedAt || l.contactStatus === 'contacted' || l.contactStatus === 'interested' || l.contactStatus === 'deal').length;
  const noWebsite = leads.filter(l => l.websiteStatus === 'NO_WEBSITE').length;

  const rowsHtml = leads.map((lead, index) => {
    const city = lead.city || extractCityFromAddress(lead.address);
    const isMed = lead.isMedicalLead;
    const phone = lead.phone && lead.phone !== '-' ? lead.phone : 'Tidak Ada';
    const outreachInfo = lead.firstContactedAt
      ? `<span class="badge contacted">Sudah (${lead.firstContactedAt})</span>`
      : `<span class="badge new">Belum Dihubungi</span>`;

    const statusBadge = `<span class="badge ${lead.contactStatus || 'new'}">${
      lead.contactStatus === 'deal' ? 'Deal Closing' :
      lead.contactStatus === 'interested' ? 'Tertarik' :
      lead.contactStatus === 'contacted' ? 'Dihubungi' :
      lead.contactStatus === 'not_interested' ? 'Menolak' : 'Baru'
    }</span>`;

    const targetBadge = isMed 
      ? '<span class="badge medical">Rekam Medis (RME)</span>' 
      : '<span class="badge web">Website</span>';

    return `
      <tr>
        <td class="text-center font-mono">${index + 1}</td>
        <td>
          <div class="font-bold text-gray-900">${lead.name}</div>
          <div class="text-xs text-gray-500">${lead.category} ${targetBadge}</div>
        </td>
        <td>
          <div class="text-xs text-gray-700">${lead.address || '-'}</div>
          <div class="text-xs font-semibold text-blue-800">Kota: ${city}</div>
        </td>
        <td class="text-center">
          <div class="font-bold text-amber-700">★ ${lead.rating || '-'}</div>
          <div class="text-xs text-gray-500">(${lead.reviewCount || 0} ulasan)</div>
        </td>
        <td>
          <div class="font-mono text-xs font-bold text-gray-800">${phone}</div>
          <div class="text-xs text-gray-500">${lead.websiteStatus === 'NO_WEBSITE' ? 'Tanpa Website' : 'Ada Website'}</div>
        </td>
        <td class="text-center">
          <div>${statusBadge}</div>
          <div class="mt-1">${outreachInfo}</div>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 12mm 12mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1a202c;
          background: #ffffff;
          margin: 0;
          padding: 16px;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .header h1 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .header p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
        }
        .stat-card .label {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 2px;
        }
        .stat-card .value {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 6px;
          text-align: left;
          border: 1px solid #0f172a;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          vertical-align: top;
        }
        tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge.medical {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
        .badge.web {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .badge.new {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
        .badge.contacted {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }
        .badge.interested {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .badge.deal {
          background: #dbeafe;
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        }
        .badge.not_interested {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .footer {
          margin-top: 16px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
        }
        .print-btn-bar {
          position: sticky;
          top: 0;
          background: #ffffff;
          padding: 10px 0;
          margin-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn-print {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }
        .btn-close {
          background: #64748b;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }
        @media print {
          .print-btn-bar { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF (Print)</button>
        <button class="btn-close" onclick="window.close()">Tutup Jendela</button>
        <span style="font-size: 12px; color: #475569;">Tips: Di jendela cetak browser, pilih <strong>Destination: Save as PDF</strong> (Simpan sebagai PDF) untuk mengunduh dokumen.</span>
      </div>

      <div class="header">
        <div>
          <h1>${title}</h1>
          <p>Filter: <strong>${filterLabel}</strong> &bull; Dicetak pada: ${currentDate}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: #0f172a; font-size: 13px;">GOOGLE MAPS LEAD SCRAPER & OUTREACH</div>
          <div style="color: #64748b; font-size: 10px;">Dibuat oleh: ${generatedBy}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Prospek</div>
          <div class="value">${total}</div>
        </div>
        <div class="stat-card">
          <div class="label">Ada Kontak HP</div>
          <div class="value" style="color: #16a34a;">${withPhone}</div>
        </div>
        <div class="stat-card">
          <div class="label">Tanpa Website</div>
          <div class="value" style="color: #ea580c;">${noWebsite}</div>
        </div>
        <div class="stat-card">
          <div class="label">Target Rekam Medis</div>
          <div class="value" style="color: #0284c7;">${medicalLeads}</div>
        </div>
        <div class="stat-card">
          <div class="label">Target Web Bisnis</div>
          <div class="value" style="color: #059669;">${generalLeads}</div>
        </div>
        <div class="stat-card">
          <div class="label">Sudah Dihubungi</div>
          <div class="value" style="color: #7c3aed;">${contacted}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px;" class="text-center">No</th>
            <th style="width: 220px;">Nama Bisnis & Kategori</th>
            <th>Alamat & Kota</th>
            <th style="width: 85px;" class="text-center">Rating</th>
            <th style="width: 140px;">Kontak & Website</th>
            <th style="width: 130px;" class="text-center">Status Outreach</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" class="text-center" style="padding: 20px;">Tidak ada data prospek yang sesuai filter.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div>Dokumen Rekapitulasi Prospek Bisnis &bull; Sistem Otomasi Penawaran Website & Rekam Medis</div>
        <div>Halaman 1 dari 1 (Otomatis menyesuaikan jumlah baris)</div>
      </div>
    </body>
    </html>
  `;

  // Create printable popup window or fallback hidden iframe
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      // Fallback: inject hidden iframe for print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 300);
      }
    }
  } catch (err) {
    console.error('Print window error:', err);
    // Direct trigger fallback
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-leads-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
