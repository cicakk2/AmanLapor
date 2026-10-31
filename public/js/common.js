// Util bersama (dipakai status.html & admin.html)
const STEPS = [
  { t: 'Laporan Diterima', d: 'Berkas pengaduan telah masuk ke sistem.' },
  { t: 'Verifikasi Data', d: 'Petugas memeriksa kelengkapan dan keabsahan laporan.' },
  { t: 'Peninjauan Lapangan', d: 'Tim menindaklanjuti dan memeriksa langsung laporan.' },
  { t: 'Solusi & Penyelesaian Berkas', d: 'Rekomendasi perbaikan dikeluarkan dan tindakan korektif dikonfirmasi tuntas.' },
];
const CATS = { pungli: 'Pungutan Liar', bansos: 'Bansos / Bantuan', pelayanan: 'Pelayanan Publik Lambat', fasilitas: 'Fasilitas Umum Rusak' };
const $ = id => document.getElementById(id);
// Buat elemen aman dari XSS (selalu textContent, tidak pernah innerHTML)
const h = (tag, cls = '', text = '', kids = []) => { const e = document.createElement(tag); e.className = cls; e.textContent = text; e.append(...kids); return e; };
const icon = (name, cls = '') => h('span', 'material-symbols-outlined ' + cls, name);
const fmt = d => d ? new Date(String(d).replace(' ', 'T') + 'Z').toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const fmtDate = d => {
  if (!d) return '-';
  const m = String(d).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(d);
};
const year = new Date().getFullYear();
document.querySelectorAll('footer span').forEach(e => e.textContent = e.textContent.replace(/© \d{4}/, '© ' + year));
