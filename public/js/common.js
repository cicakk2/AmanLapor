// Util bersama (dipakai di seluruh halaman AmanLapor)
const STEPS = [
  { t: 'Laporan Diterima', d: 'Laporan Anda sudah masuk dengan aman dan tercatat di sistem kami.' },
  { t: 'Sedang Diperiksa Petugas', d: 'Tim kami sedang mempelajari keterangan dan bukti yang Anda lampirkan.' },
  { t: 'Tindak Lanjut Lapangan', d: 'Petugas sedang melakukan pengecekan dan koordinasi langsung di lokasi.' },
  { t: 'Selesai Ditindaklanjuti', d: 'Penanganan laporan telah tuntas dan langkah perbaikan sudah dikonfirmasi.' },
];

const CATS = {
  pungli: 'Pungutan Liar',
  bansos: 'Bantuan Sosial (Bansos)',
  pelayanan: 'Pelayanan Publik Lambat',
  fasilitas: 'Fasilitas Umum Rusak',
};

const AI_CATS = [
  'Pungli',
  'Korupsi',
  'Parkir Liar',
  'Fasilitas Publik',
  'Pelayanan Lambat',
  'Spam/Tidak Penting',
  'Lain-lain',
];

const URGENCY_META = {
  5: { label: '5 - Sangat Kritis', badge: 'bg-error-container text-on-error-container font-semibold' },
  4: { label: '4 - Tinggi', badge: 'bg-secondary-fixed text-on-secondary-fixed font-semibold' },
  3: { label: '3 - Sedang', badge: 'bg-tertiary-fixed text-on-tertiary-fixed font-medium' },
  2: { label: '2 - Rendah', badge: 'bg-surface-container-high text-on-surface-variant' },
  1: { label: '1 - Sangat Rendah', badge: 'bg-surface-container text-outline' },
};

const $ = id => document.getElementById(id);

// Sanitasi string & pembuatan elemen DOM aman dari XSS (selalu textContent)
const escapeHtml = str =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const h = (tag, cls = '', text = '', kids = []) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== '' && text !== null && text !== undefined) e.textContent = String(text);
  if (kids && kids.length) e.append(...kids);
  return e;
};

const icon = (name, cls = '') => h('span', 'material-symbols-outlined ' + cls, name);

const fmt = d =>
  d ? new Date(String(d).replace(' ', 'T') + (String(d).includes('Z') ? '' : 'Z')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

const fmtDate = d => {
  if (!d) return '-';
  const m = String(d).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(d);
};

// ---- Toast Notification Ramah Pengguna ----
function showToast(message, type = 'info') {
  let container = document.getElementById('amanlapor-toast-container');
  if (!container) {
    container = h('div', 'fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none');
    container.id = 'amanlapor-toast-container';
    document.body.appendChild(container);
  }
  const isError = type === 'error';
  const isSuccess = type === 'success';
  const bgCls = isError
    ? 'bg-error text-on-error'
    : isSuccess
    ? 'bg-primary text-on-primary'
    : 'bg-inverse-surface text-inverse-on-surface';
  const icName = isError ? 'error' : isSuccess ? 'check_circle' : 'info';

  const toast = h(
    'div',
    `pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 ${bgCls}`,
    '',
    [
      icon(icName, 'text-[20px] shrink-0 mt-0.5'),
      h('span', 'font-body-sm text-body-sm leading-snug flex-1', message),
    ]
  );
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

// ---- Device Token & Pelacakan Kuota Laporan (LocalStorage) ----
const DEVICE_TOKEN_KEY = 'device_token';
const DEVICE_TICKETS_KEY = 'amanlapor_tickets';
const MAX_ACTIVE_REPORTS = 3;

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDeviceToken() {
  try {
    let tk = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (!tk || tk.length < 10) {
      tk = generateUUID();
      localStorage.setItem(DEVICE_TOKEN_KEY, tk);
    }
    return tk;
  } catch {
    return 'anon-device';
  }
}

function getStoredTickets() {
  try {
    const raw = localStorage.getItem(DEVICE_TICKETS_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter(x => x && typeof x.code === 'string') : [];
  } catch {
    return [];
  }
}

function setStoredTickets(tickets) {
  try {
    localStorage.setItem(DEVICE_TICKETS_KEY, JSON.stringify(tickets));
  } catch {}
}

function saveStoredTicket(code, status = 0) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return;
  const list = getStoredTickets();
  const idx = list.findIndex(t => t.code === cleanCode);
  if (idx >= 0) {
    list[idx].status = Number(status);
  } else {
    list.unshift({ code: cleanCode, status: Number(status), created_at: new Date().toISOString() });
  }
  setStoredTickets(list);
}

async function syncDeviceQuota() {
  const token = getDeviceToken();
  const localTickets = getStoredTickets();
  const codesParam = localTickets.map(t => t.code).join(',');
  try {
    const qs = new URLSearchParams({ device_token: token, codes: codesParam });
    const res = await fetch('/api/device-tickets?' + qs.toString());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tickets)) {
        setStoredTickets(data.tickets);
        const activeTickets = data.tickets.filter(t => Number(t.status) < 3);
        return {
          tickets: data.tickets,
          activeTickets,
          activeCount: activeTickets.length,
          maxActive: MAX_ACTIVE_REPORTS,
          isQuotaReached: activeTickets.length >= MAX_ACTIVE_REPORTS,
        };
      }
    }
  } catch {}
  const activeTickets = localTickets.filter(t => Number(t.status) < 3);
  return {
    tickets: localTickets,
    activeTickets,
    activeCount: activeTickets.length,
    maxActive: MAX_ACTIVE_REPORTS,
    isQuotaReached: activeTickets.length >= MAX_ACTIVE_REPORTS,
  };
}

// Inisialisasi device_token otomatis saat halaman dibuka
getDeviceToken();

const year = new Date().getFullYear();
document.querySelectorAll('footer span').forEach(e => {
  e.textContent = e.textContent.replace(/© \d{4}/, '© ' + year);
});
