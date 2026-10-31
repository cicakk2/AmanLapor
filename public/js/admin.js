// Dashboard petugas: semua data dari /api/admin/* (Privat khusus petugas)
let token = sessionStorage.getItem('tk'), cur = null;
const show = (el, on, d = 'flex') => {
  if (!el) return;
  el.classList.toggle('hidden', !on);
  el.classList.toggle(d, on);
};

async function api(path, body) {
  const res = await fetch('/api/admin' + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body && JSON.stringify(body),
  });
  const d = await res.json();
  if (res.status === 401 && token) logout();
  if (!res.ok) throw new Error(d.error || 'Terjadi kendala pada server.');
  return d;
}

function logout() {
  sessionStorage.clear();
  token = null;
  location.reload();
}

const opts = (sel, first, items) => {
  if (!sel) return;
  sel.replaceChildren(
    ...[...(first ? [['', first]] : []), ...items].map(([v, t]) => Object.assign(h('option', '', t), { value: v }))
  );
};

function renderUrgencyBadge(score) {
  const s = Number(score) || 3;
  const meta = URGENCY_META[s] || URGENCY_META[3];
  return h('span', `inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm ${meta.badge}`, `Skor ${s}/5`);
}

function renderAiCatBadge(aiCat) {
  const cat = aiCat || 'Lain-lain';
  const isSpam = cat === 'Spam/Tidak Penting';
  const isCritical = cat === 'Korupsi' || cat === 'Pungli';
  const cls = isSpam
    ? 'bg-surface-container-high text-outline'
    : isCritical
    ? 'bg-secondary-fixed text-on-secondary-fixed font-semibold'
    : 'bg-tertiary-fixed/60 text-on-tertiary-fixed font-medium';
  return h('span', `inline-block px-2 py-0.5 rounded font-label-sm text-label-sm ${cls}`, cat);
}

function enter() {
  show($('login'), false);
  show($('app'), true);
  show($('who'), true);
  $('whoName').textContent = sessionStorage.getItem('nm') || 'Petugas';

  opts($('fs'), 'Semua Status', STEPS.map((s, i) => [i, s.t]));
  opts($('fc'), 'Semua Kategori Warga', Object.entries(CATS));
  opts($('fAiCat'), 'Semua Kategori AI', AI_CATS.map(c => [c, `AI: ${c}`]));
  opts(
    $('fUrgency'),
    'Semua Skala Urgensi',
    [5, 4, 3, 2, 1].map(u => [u, `Urgensi: ${URGENCY_META[u].label}`])
  );

  loadList().catch(() => {});
}

async function loadList() {
  const qs = new URLSearchParams({
    q: $('q')?.value || '',
    status: $('fs')?.value || '',
    category: $('fc')?.value || '',
    ai_category: $('fAiCat')?.value || '',
    urgency: $('fUrgency')?.value || '',
  });
  const { reports, stats } = await api('/reports?' + qs.toString());

  $('stats').replaceChildren(
    ...[
      ['Total Laporan', stats.total],
      ['Masuk Hari Ini', stats.today],
      ['Urgensi Tinggi (4-5)', stats.criticalCount ?? 0],
      [STEPS[0].t, stats.byStatus[0]],
      [STEPS[3].t, stats.byStatus[3]],
    ].map(([t, n]) =>
      h('div', 'card p-space-md', '', [
        h('div', 'font-headline-md text-headline-md text-primary', String(n)),
        h('div', 'font-label-sm text-label-sm text-on-surface-variant', t),
      ])
    )
  );

  if (!reports.length) {
    $('rows').replaceChildren(
      h('tr', '', '', [
        Object.assign(
          h('td', 'p-space-lg text-center text-on-surface-variant', 'Tidak ada laporan yang cocok dengan filter pencarian.'),
          { colSpan: 6 }
        ),
      ])
    );
    return;
  }

  $('rows').replaceChildren(
    ...reports.map(r => {
      const tr = h(
        'tr',
        'cursor-pointer border-b border-surface-container/60 hover:bg-surface-container-low transition-colors ' +
          (r.code === cur ? 'bg-surface-container-low' : ''),
        '',
        [
          h('td', 'p-space-md font-semibold whitespace-nowrap', r.code),
          h('td', 'py-space-sm pr-2', '', [renderAiCatBadge(r.ai_category)]),
          h('td', 'py-space-sm pr-2 whitespace-nowrap', '', [renderUrgencyBadge(r.ai_urgency)]),
          h('td', 'py-space-sm pr-2 max-w-[140px] truncate', r.location || '-'),
          h('td', 'py-space-sm pr-2 whitespace-nowrap', '', [
            h(
              'span',
              'px-2 py-0.5 rounded font-label-sm text-label-sm ' +
                (r.status === 3 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'),
              STEPS[r.status]?.t || '-'
            ),
          ]),
          h('td', 'py-space-sm pr-space-md text-on-surface-variant whitespace-nowrap', fmt(r.created_at)),
        ]
      );
      tr.onclick = () => openDetail(r.code);
      return tr;
    })
  );
}

async function openDetail(code) {
  cur = code;
  const r = await api('/reports/' + encodeURIComponent(code));
  const sel = h('select', 'inp');
  opts(sel, null, STEPS.map((s, i) => [i, s.t]));
  sel.value = r.status;
  sel.onchange = async () => {
    try {
      await api(`/reports/${code}/status`, { status: +sel.value });
      showToast('Status laporan berhasil diperbarui.', 'success');
      loadList();
      openDetail(code);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const msg = h('input', 'inp flex-1', '');
  msg.placeholder = 'Tulis tanggapan ramah untuk pelapor...';
  msg.maxLength = 1000;
  const form = h('form', 'flex gap-space-sm', '', [msg, h('button', 'btn', 'Kirim')]);
  form.onsubmit = async e => {
    e.preventDefault();
    if (!msg.value.trim()) return;
    try {
      await api(`/reports/${code}/messages`, { body: msg.value });
      showToast('Pesan tanggapan terkirim ke pelapor.', 'success');
      openDetail(code);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const row = (k, v) =>
    h('div', '', '', [
      h('div', 'font-label-sm text-label-sm text-on-surface-variant', k),
      h('div', 'font-body-sm text-body-sm', v),
    ]);

  // Panel Khusus Hasil Analisis AI (Hanya tampil di Dashboard Admin)
  const urgScore = Number(r.ai_urgency) || 3;
  const urgMeta = URGENCY_META[urgScore] || URGENCY_META[3];
  const aiPanel = h('div', 'bg-surface-container-low rounded-xl p-space-md border border-outline-variant/40 flex flex-col gap-space-xs', '', [
    h('div', 'flex items-center justify-between gap-2', '', [
      h('span', 'font-label-sm text-label-sm font-semibold text-primary flex items-center gap-1', '', [
        icon('auto_awesome', 'text-[16px]'),
        h('span', '', 'Hasil Triase AI (Gemini 2.5 Flash • Khusus Petugas)'),
      ]),
    ]),
    h('div', 'grid grid-cols-2 gap-space-sm pt-1', '', [
      h('div', 'flex flex-col gap-1', '', [
        h('span', 'font-label-sm text-label-sm text-on-surface-variant', 'Kategori AI'),
        h('div', '', '', [renderAiCatBadge(r.ai_category)]),
      ]),
      h('div', 'flex flex-col gap-1', '', [
        h('span', 'font-label-sm text-label-sm text-on-surface-variant', 'Skor Urgensi (1-5)'),
        h('div', '', '', [
          h('span', `inline-block px-2 py-0.5 rounded font-label-sm text-label-sm ${urgMeta.badge}`, urgMeta.label),
        ]),
      ]),
    ]),
  ]);

  const atts = Array.isArray(r.attachments) ? r.attachments : [];
  const evidenceNodes = atts.length
    ? atts.map(att => {
        const isImg =
          (att.type && att.type.startsWith('image/')) || /\.(jpe?g|png)$/i.test(att.name || att.url || '');
        const sizeText = att.size ? ` (${Math.max(1, Math.round(att.size / 1024))} KB)` : '';
        const link = h(
          'a',
          'inline-flex items-center gap-1 text-primary font-label-sm text-label-sm hover:underline break-all',
          '',
          [
            icon(isImg ? 'image' : 'picture_as_pdf', 'text-[16px] shrink-0'),
            h('span', '', (att.name || 'Berkas Bukti') + sizeText),
            icon('open_in_new', 'text-[14px] shrink-0'),
          ]
        );
        link.href = att.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        if (!isImg && att.name) link.download = att.name;

        if (isImg) {
          const img = document.createElement('img');
          img.src = att.url;
          img.alt = att.name || 'Bukti laporan';
          img.className =
            'w-full max-h-60 object-contain rounded-lg bg-surface border border-outline-variant/40 cursor-pointer';
          img.onclick = () => window.open(att.url, '_blank', 'noopener,noreferrer');
          return h('div', 'bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-space-xs', '', [img, link]);
        }
        return h('div', 'bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between', '', [link]);
      })
    : [h('div', 'font-body-sm text-body-sm text-on-surface-variant italic', 'Tidak ada lampiran bukti.')];

  const evidenceSection = h('div', 'flex flex-col gap-space-xs', '', [
    h('div', 'font-label-sm text-label-sm text-on-surface-variant', `Bukti Pendukung (${atts.length})`),
    h('div', 'flex flex-col gap-space-sm', '', evidenceNodes),
  ]);

  $('detail').replaceChildren(
    h('div', 'flex items-center justify-between', '', [
      h('h2', 'font-title text-title', code),
      renderUrgencyBadge(r.ai_urgency),
    ]),
    aiPanel,
    row('Kategori Pilihan Warga', CATS[r.category] || r.category),
    row('Lokasi Kejadian', r.location || '-'),
    row('Tanggal Kejadian', fmtDate(r.incident_date)),
    row('Waktu Laporan Masuk', fmt(r.created_at)),
    h('div', 'flex flex-col gap-1', '', [
      h('div', 'font-label-sm text-label-sm text-on-surface-variant', 'Cerita / Keterangan Warga'),
      h('p', 'font-body-sm text-body-sm whitespace-pre-wrap break-words bg-surface-container-low rounded-lg p-space-md', r.description),
    ]),
    evidenceSection,
    row('Perbarui Status Penanganan', ''),
    sel,
    h('div', 'flex flex-col gap-space-xs max-h-64 overflow-y-auto', '',
      r.messages.map(m =>
        h(
          'div',
          'font-body-sm text-body-sm rounded-lg p-space-sm ' +
            (m.sender === 'citizen' ? 'bg-surface-container-low' : 'bg-tertiary-fixed/40'),
          '',
          [
            h('b', '', (m.sender === 'officer' ? m.name : m.sender === 'citizen' ? 'Pelapor' : 'Sistem') + ' · '),
            h('span', '', m.body),
            h('div', 'font-label-sm text-label-sm text-outline', fmt(m.created_at)),
          ]
        )
      )
    ),
    form
  );
  const box = $('detail').querySelector('.overflow-y-auto');
  if (box) box.scrollTop = box.scrollHeight;
}

$('login').onsubmit = async e => {
  e.preventDefault();
  $('err').textContent = '';
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: $('name').value, password: $('pass').value }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    token = d.token;
    sessionStorage.setItem('tk', token);
    sessionStorage.setItem('nm', d.name);
    enter();
  } catch (err) {
    $('err').textContent = err.message;
  }
};

$('logout').onclick = logout;

['q', 'fs', 'fc', 'fAiCat', 'fUrgency'].forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener(id === 'q' ? 'input' : 'change', () => loadList().catch(() => {}));
  }
});

$('resetFiltersBtn')?.addEventListener('click', () => {
  ['q', 'fs', 'fc', 'fAiCat', 'fUrgency'].forEach(id => {
    if ($(id)) $(id).value = '';
  });
  loadList().catch(() => {});
});

if (token) enter();
