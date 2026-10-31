// Dashboard petugas: semua data dari /api/admin/*
let token = sessionStorage.getItem('tk'), cur = null;
const show = (el, on, d = 'flex') => { el.classList.toggle('hidden', !on); el.classList.toggle(d, on); };

async function api(path, body) {
  const res = await fetch('/api/admin' + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body && JSON.stringify(body) });
  const d = await res.json();
  if (res.status === 401 && token) logout();
  if (!res.ok) throw new Error(d.error);
  return d;
}
function logout() { sessionStorage.clear(); token = null; location.reload(); }
const opts = (sel, first, items) => sel.replaceChildren(...[...(first ? [['', first]] : []), ...items].map(([v, t]) => Object.assign(h('option', '', t), { value: v })));

function enter() {
  show($('login'), false); show($('app'), true); show($('who'), true); $('whoName').textContent = sessionStorage.getItem('nm');
  opts($('fs'), 'Semua status', STEPS.map((s, i) => [i, s.t]));
  opts($('fc'), 'Semua kategori', Object.entries(CATS));
  loadList().catch(() => {});
}

async function loadList() {
  const qs = new URLSearchParams({ q: $('q').value, status: $('fs').value, category: $('fc').value });
  const { reports, stats } = await api('/reports?' + qs);
  $('stats').replaceChildren(...[['Total', stats.total], ['Hari ini', stats.today], ...STEPS.slice(0, 3).map((s, i) => [s.t, stats.byStatus[i]])]
    .map(([t, n]) => h('div', 'card p-space-md', '', [h('div', 'font-headline-md text-headline-md text-primary', n), h('div', 'font-label-sm text-label-sm text-on-surface-variant', t)])));
  $('rows').replaceChildren(...reports.map(r => {
    const tr = h('tr', 'cursor-pointer hover:bg-surface-container-low ' + (r.code === cur ? 'bg-surface-container-low' : ''), '', [
      h('td', 'p-space-md font-semibold', r.code), h('td', '', CATS[r.category] || r.category), h('td', '', r.location || '-'),
      h('td', '', '', [h('span', 'px-2 py-0.5 rounded font-label-sm text-label-sm ' + (r.status === 3 ? 'bg-primary-fixed' : 'bg-tertiary-fixed'), STEPS[r.status].t)]), h('td', '', fmt(r.created_at))]);
    tr.onclick = () => openDetail(r.code); return tr;
  }));
}

async function openDetail(code) {
  cur = code; const r = await api('/reports/' + code), sel = h('select', 'inp');
  opts(sel, null, STEPS.map((s, i) => [i, s.t])); sel.value = r.status;
  sel.onchange = async () => { await api(`/reports/${code}/status`, { status: +sel.value }); loadList(); openDetail(code); };
  const msg = h('input', 'inp flex-1', ''); msg.placeholder = 'Balas pelapor...'; msg.maxLength = 1000;
  const form = h('form', 'flex gap-space-sm', '', [msg, h('button', 'btn', 'Kirim')]);
  form.onsubmit = async e => { e.preventDefault(); if (!msg.value.trim()) return; await api(`/reports/${code}/messages`, { body: msg.value }); openDetail(code); };
  const row = (k, v) => h('div', '', '', [h('div', 'font-label-sm text-label-sm text-on-surface-variant', k), h('div', 'font-body-sm text-body-sm', v)]);
  $('detail').replaceChildren(
    h('h2', 'font-title text-title', code), row('Kategori', CATS[r.category] || r.category), row('Lokasi', r.location || '-'),
    row('Tanggal kejadian', r.incident_date || '-'), row('Dilaporkan', fmt(r.created_at)),
    h('p', 'font-body-sm text-body-sm whitespace-pre-wrap break-words bg-surface-container-low rounded-lg p-space-md', r.description),
    row('Ubah status', ''), sel,
    h('div', 'flex flex-col gap-space-xs max-h-64 overflow-y-auto', '', r.messages.map(m =>
      h('div', 'font-body-sm text-body-sm rounded-lg p-space-sm ' + (m.sender === 'citizen' ? 'bg-surface-container-low' : 'bg-tertiary-fixed/40'), '', [
        h('b', '', (m.sender === 'officer' ? m.name : m.sender === 'citizen' ? 'Pelapor' : 'Sistem') + ' · '), h('span', '', m.body), h('div', 'font-label-sm text-label-sm text-outline', fmt(m.created_at))]))),
    form);
  const box = $('detail').querySelector('.overflow-y-auto'); box.scrollTop = box.scrollHeight;
}

$('login').onsubmit = async e => {
  e.preventDefault(); $('err').textContent = '';
  try {
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('name').value, password: $('pass').value }) });
    const d = await res.json(); if (!res.ok) throw new Error(d.error);
    token = d.token; sessionStorage.setItem('tk', token); sessionStorage.setItem('nm', d.name); enter();
  } catch (err) { $('err').textContent = err.message; }
};
$('logout').onclick = logout;
['q', 'fs', 'fc'].forEach(id => $(id).addEventListener(id === 'q' ? 'input' : 'change', () => loadList().catch(() => {})));
if (token) enter();
