import JSZip from 'jszip';
import { EXTENSION_FILES } from '../extension-files/extensionData';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // Tambahkan seluruh file ekstensi utama
  EXTENSION_FILES.forEach(file => {
    zip.file(file.name, file.content);
  });

  // Tambahkan file README petunjuk instalasi
  const readmeContent = `# Google Maps Lead Scraper (No-Website Finder)
Ekstensi Google Chrome (Manifest V3) untuk mencari dan menyaring prospek bisnis di Google Maps yang belum memiliki website resmi.

## Cara Pemasangan (Chrome Developer Mode):
1. Ekstrak file ZIP ini ke dalam sebuah folder di komputer Anda.
2. Buka browser Google Chrome dan ketik pada address bar: \`chrome://extensions/\`
3. Aktifkan toggle **"Developer mode"** (Mode Pengembang) di pojok kanan atas.
4. Klik tombol **"Load unpacked"** (Muat yang belum dibongkar) di pojok kiri atas.
5. Pilih folder hasil ekstrak tadi.
6. Ekstensi siap digunakan!

## Cara Menggunakan:
1. Buka [https://www.google.com/maps](https://www.google.com/maps)
2. Masukkan kata kunci pencarian, contoh: "Bengkel mobil di Surabaya", "Klinik gigi di Bandung", "Restoran di Jakarta Selatan".
3. Buka ikon ekstensi pada toolbar Chrome.
4. Atur batas maksimum profil yang ingin diperiksa (misal: 50 profil).
5. Klik **"Mulai Pindai"**. Ekstensi akan memeriksa satu per satu profil bisnis dan mendeteksi ketiadaan website resmi.
6. Setelah selesai atau dihentikan, klik **"Unduh CSV"** untuk mengekspor database prospek.

## Kolom CSV yang Dihasilkan:
- Nama
- Kategori
- Rating
- Jumlah Ulasan
- Alamat
- Telepon
- URL Google Maps

Catatan: Semua bisnis yang diekspor terjamin tidak memiliki website resmi (ideal untuk penawaran jasa pembuatan website & SEO).
`;

  zip.file('README.md', readmeContent);

  // Generate binary zip
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

export function downloadExtensionZip(blob: Blob, filename = 'gmaps-no-website-scraper-extension.zip'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
