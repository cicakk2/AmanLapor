# Guide Book AmanLapor

Platform pengaduan warga anonim + dashboard petugas. Node.js, Express 5, SQLite.

## Struktur
```
amanlapor/
├─ server.js          # API + file statis (satu-satunya backend)
├─ data/              # database SQLite (dibuat otomatis)
├─ public/
│  ├─ index.html, mobile.html, panduan.html, lapor.html   # halaman warga
│  ├─ status.html     # cek status + chat  (js/status.js)
│  ├─ admin.html      # dashboard petugas  (js/admin.js)
│  └─ js/common.js    # helper & konstanta bersama
├─ docs/              # GUIDE.md, DESIGN.md
└─ .env.example
```

## Menjalankan
```
npm install
ADMIN_PASSWORD=sandi-kuat ORG_NAME="Inspektorat Kota X" node server.js
```
Buka `http://localhost:3000`, dashboard di `/admin.html`. Jika `ADMIN_PASSWORD` kosong, sandi acak dicetak di terminal.

## Alur
- **Warga**: `lapor.html` -> dapat kode `AMAN-XXXX-XXXX` -> `status.html?code=...` (tahapan + chat). Tanpa akun.
- **Petugas**: `admin.html` -> masuk (nama bebas + sandi) -> statistik, cari/filter, buka laporan, ubah status, balas pelapor. Nama petugas tampil di chat warga.

## API
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/reports` | buat laporan -> `{code}` |
| GET | `/api/reports/:code` | detail + pesan + nama instansi |
| POST | `/api/reports/:code/messages` | pesan warga |
| POST | `/api/admin/login` | `{name,password}` -> token (8 jam) |
| GET | `/api/admin/reports?status=&category=&q=` | daftar + statistik |
| GET | `/api/admin/reports/:code` | detail lengkap |
| POST | `/api/admin/reports/:code/status` | `{status:0-3}` |
| POST | `/api/admin/reports/:code/messages` | balasan petugas |

Endpoint admin memakai header `Authorization: Bearer <token>`.

## Environment
`ADMIN_PASSWORD`, `ORG_NAME`, `PORT`, `TRUST_PROXY=1` (bila di belakang proxy agar rate limit membaca IP asli).

## Patch keamanan di versi ini
- Kunci `admin123` dihapus -> login sandi + token sesi acak (8 jam, perbandingan timing-safe).
- Rate limit: buat laporan, lookup kode, chat, login.
- Validasi: kategori whitelist, panjang input dibatasi, format kode dicek, body JSON maks 20 KB.
- Header keamanan + CSP; semua data pengguna dirender via `textContent` (anti-XSS).
- Folder `data/` dibuat otomatis; DB lama dimigrasi otomatis.

## Belum ada (tahap berikut sesuai proposal)
Enkripsi sisi client, Turnstile, Gemini AI triage, upload bukti, Supabase.
Teks UI "Pesan Terenkripsi Ujung-ke-Ujung" dan "enkripsi nir-jejak" masih klaim desain, belum diimplementasikan.
Sesi admin disimpan di memori (hilang saat server restart).
