// Halaman Cek Status: hanya menampilkan progres & percakapan untuk pelapor (TANPA data analisis AI)
(() => {
  const params = new URLSearchParams(location.search);
  let CODE = (params.get('code') || '').trim().toUpperCase();

  // Jika belum ada kode di URL, ambil tiket terbaru dari riwayat perangkat bila ada
  const stored = getStoredTickets();
  if (!CODE && stored.length > 0) {
    CODE = stored[0].code;
  }

  $('secretCodeBadge').textContent = CODE || 'Belum Dipilih';
  if ($('lookupTicketInput') && CODE) {
    $('lookupTicketInput').value = CODE;
  }

  let last = -1;

  function renderDeviceTicketShortcuts() {
    const bar = $('myDeviceTicketsBar');
    if (!bar) return;
    const list = getStoredTickets();
    if (!list.length) {
      bar.replaceChildren();
      return;
    }
    bar.replaceChildren(
      h('span', 'font-label-sm text-label-sm text-on-surface-variant', 'Tiket tersimpan di perangkat ini:'),
      ...list.map(t => {
        const a = h(
          'a',
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-label-sm text-label-sm transition-colors ' +
            (t.code === CODE
              ? 'bg-primary text-on-primary font-semibold'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'),
          t.code
        );
        a.href = 'status.html?code=' + encodeURIComponent(t.code);
        return a;
      })
    );
  }

  const stepNode = (s, i, r) => {
    const done = i === 0 || i < r.status || r.status === 3;
    const active = !done && i === r.status;
    const cls = done
      ? 'bg-primary text-on-primary'
      : active
      ? 'bg-primary-container text-on-primary-container ring-4 ring-primary-fixed/40'
      : 'bg-surface-container-high text-outline';
    const when = i === 0 ? r.created_at : i === r.status || (r.status === 3 && i === 3) ? r.updated_at : null;
    return h('div', 'relative z-10 flex items-start gap-space-md ' + (done || active ? '' : 'opacity-60'), '', [
      h('div', `w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${cls}`, '', [
        icon(done ? 'check' : active ? 'sync' : 'hourglass_empty', 'text-[18px]'),
      ]),
      h('div', 'flex flex-col pt-0.5', '', [
        h(
          'span',
          'font-label-md text-label-md font-semibold ' + (active ? 'text-primary' : 'text-on-surface'),
          s.t + (active ? ' • Sedang Berlangsung' : '')
        ),
        h('span', 'font-body-sm text-body-sm text-on-surface-variant mt-0.5', s.d),
        ...(when && (done || active) ? [h('span', 'font-label-sm text-label-sm text-outline mt-1', fmt(when))] : []),
      ]),
    ]);
  };

  const msgNode = m => {
    const mine = m.sender === 'citizen';
    const off = m.sender === 'officer';
    const name = off ? `${m.name || 'Petugas'} • Petugas Pemeriksa` : mine ? 'Anda (Pelapor Anonim)' : 'Informasi Sistem';
    const ini = off
      ? (m.name || 'P')
          .split(/\s+/)
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : mine
      ? 'A'
      : 'i';
    return h('div', 'flex items-start gap-space-sm max-w-[85%] ' + (mine ? 'self-end flex-row-reverse' : 'self-start'), '', [
      h(
        'div',
        `w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          mine ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
        }`,
        '',
        [h('span', 'font-label-sm text-label-sm font-bold', ini)]
      ),
      h('div', 'flex flex-col gap-1 ' + (mine ? 'items-end' : ''), '', [
        h(
          'div',
          `p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs ${
            mine ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'
          }`,
          '',
          [
            h('span', 'font-label-sm text-label-sm font-semibold ' + (mine ? 'text-primary-fixed' : 'text-primary'), name),
            h('p', 'font-body-sm text-body-sm leading-relaxed whitespace-pre-wrap break-words', m.body),
          ]
        ),
        h('span', 'font-label-sm text-label-sm text-outline ml-1', fmt(m.created_at)),
      ]),
    ]);
  };

  async function load() {
    renderDeviceTicketShortcuts();
    const box = $('chatMessages');
    if (!CODE) {
      box.replaceChildren(
        h(
          'p',
          'p-space-md text-on-surface-variant font-body-sm text-body-sm',
          'Silakan masukkan Kode Rahasia Tiket Anda pada kotak pencarian di atas untuk melihat perkembangan laporan.'
        )
      );
      return;
    }
    try {
      const res = await fetch('/api/reports/' + encodeURIComponent(CODE));
      const r = await res.json();
      if (!res.ok) {
        box.replaceChildren(h('p', 'p-space-md text-error font-body-sm text-body-sm', r.error || 'Kode tiket tidak ditemukan.'));
        return;
      }
      // Sinkronkan status terbaru ke LocalStorage perangkat agar kuota otomatis ter-update
      saveStoredTicket(CODE, r.status);
      renderDeviceTicketShortcuts();

      $('secretCodeBadge').textContent = r.code;
      $('regDate').textContent = fmt(r.created_at);
      $('catLabel').textContent = CATS[r.category] || r.category;
      $('stateBadge').textContent = r.status === 3 ? 'Selesai Ditindaklanjuti' : 'Sedang Ditangani';
      $('offOrg').textContent = r.org;
      $('offName').textContent =
        [...r.messages].reverse().find(m => m.sender === 'officer')?.name || 'Tim Petugas Pemeriksa';
      $('timeline').replaceChildren(
        h('div', 'absolute left-[1.625rem] top-4 bottom-4 w-0.5 bg-surface-container-high'),
        ...STEPS.map((s, i) => stepNode(s, i, r))
      );
      if (r.messages.length !== last) {
        box.replaceChildren(...r.messages.map(msgNode));
        box.scrollTop = box.scrollHeight;
        last = r.messages.length;
      }
    } catch {
      box.replaceChildren(
        h('p', 'p-space-md text-on-surface-variant', 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
      );
    }
  }

  $('lookupTicketForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const val = ($('lookupTicketInput')?.value || '').trim().toUpperCase();
    if (!val) {
      showToast('Silakan masukkan Kode Rahasia Tiket Anda terlebih dahulu.', 'error');
      return;
    }
    location.search = '?code=' + encodeURIComponent(val);
  });

  $('chatForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!CODE) {
      showToast('Pilih atau masukkan Kode Rahasia Tiket Anda terlebih dahulu.', 'error');
      return;
    }
    const body = $('chatInput').value.trim();
    if (!body) return;
    const res = await fetch(`/api/reports/${encodeURIComponent(CODE)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || 'Gagal mengirim pesan.', 'error');
      return;
    }
    $('chatInput').value = '';
    showToast('Pesan Anda berhasil dikirim.', 'success');
    load();
  });

  $('copyCodeBtn')?.addEventListener('click', () => {
    if (!CODE) return;
    navigator.clipboard.writeText(CODE).then(() => {
      $('copyLabel').textContent = 'Tersalin!';
      showToast('Kode Rahasia Tiket Anda berhasil disalin.', 'success');
      setTimeout(() => ($('copyLabel').textContent = 'Salin Kode'), 2000);
    });
  });

  $('printReceiptBtn')?.addEventListener('click', () => print());

  load();
  setInterval(load, 15000);
})();
