# 🛡️ AmanLapor — Platform Pengaduan Warga Anonim

**AmanLapor** adalah platform web pengaduan masyarakat berbasis layanan publik yang dirancang agar warga dapat menyampaikan keluhan (pungutan liar, korupsi, penyelewengan bantuan sosial, keterlambatan layanan, hingga kerusakan fasilitas umum) secara **100% anonim, aman, ramah pengguna, dan transparan** tanpa perlu membuat akun ataupun mencantumkan identitas pribadi (seperti nama, nomor KTP, atau nomor telepon).

Selain portal warga yang ramah dan menenangkan (*human-centered copywriting*), AmanLapor dilengkapi dengan **Dashboard Petugas (Admin)** yang memiliki fitur **Triase Cerdas Hibrida** menggunakan **Google Gemini 2.5 Flash AI** serta **Filter Fallback (Aturan Kata Kunci Lokal)** lengkap dengan indikator sumber kategorisasi yang transparan.

---

## 📋 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Bahasa Pemrograman & Teknologi yang Digunakan](#-bahasa-pemrograman--teknologi-yang-digunakan)
3. [Bahan & Prasyarat yang Dibutuhkan](#-bahan--prasyarat-yang-dibutuhkan)
4. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
5. [Panduan Instalasi & Cara Menjalankan Website (Dari Awal hingga Berjalan)](#-panduan-instalasi--cara-menjalankan-website-dari-awal-hingga-berjalan)
6. [Transparansi Kategorisasi: Gemini AI vs Filter Fallback](#-transparansi-kategorisasi-gemini-ai-vs-filter-fallback)
7. [Arsitektur Keamanan (End-to-End Hardening)](#-arsitektur-keamanan-end-to-end-hardening)
8. [Dokumentasi Endpoint API](#-dokumentasi-endpoint-api)
9. [AI Use Declaration (Deklarasi Penggunaan AI)](#-ai-use-declaration-deklarasi-penggunaan-ai)
10. [Third-Party Declaration (Deklarasi Pihak Ketiga)](#-third-party-declaration-deklarasi-pihak-ketiga)

---

## ✨ Fitur Utama

### 1. Portal Pelapor Anonim (Human-Centered & Ramah Warga)
- **Tanpa Registrasi & Identitas Pribadi**: Pelapor tidak diminta mengisi nama, NIK/KTP, email, maupun nomor ponsel.
- **Kode Rahasia Tiket Anda (`AMAN-XXXX-XXXX`)**: Setiap laporan menghasilkan kode tiket unik untuk memantau perkembangan penanganan dan berbalas pesan secara rahasia dengan petugas pemeriksa.
- **Bahasa yang Tenang & Empati**: Seluruh teks antarmuka dirancang menggunakan bahasa sehari-hari yang mudah dipahami oleh seluruh kalangan masyarakat.
- **Desain Responsif dengan Hamburger Menu**: Tampilan menyesuaikan layar ponsel (*mobile*), tablet, hingga komputer (*desktop*), dilengkapi tombol menu *hamburger* (`☰` / `✕`) pada perangkat layar kecil.

### 2. Komponen Input Tanggal Hibrida (`dd-mm-yyyy` + Kalender Visual)
- Pelapor dapat **mengetik tanggal kejadian secara manual** dengan format `dd-mm-yyyy` (contoh: `14-08-2025` dengan pemformatan otomatis saat mengetik) **atau memilih langsung dari pop-up kalender visual**.
- Dilengkapi **validasi pencegah tanggal masa depan (*future dates*)** di sisi klien (frontend) maupun server (backend).

### 3. Pembatasan Kuota Laporan per Perangkat (Device Quota Anti-Spam)
- Menggunakan `device_token` berbasis UUID pada `localStorage` peramban yang disinkronkan dengan pencatatan di server.
- Setiap perangkat dibatasi maksimal **3 laporan aktif** (status belum `Selesai`). Jika kuota penuh, tombol pengiriman dinonaktifkan otomatis disertai pemberitahuan ramah dan tautan langsung ke tiket aktif pelapor.

### 4. Triase Cerdas Dashboard Admin & Transparansi Sumber Analisis
- **Analisis Instan Saat Laporan Masuk**: Mengklasifikasikan laporan ke dalam kategori (`Pungli`, `Korupsi`, `Parkir Liar`, `Fasilitas Publik`, `Pelayanan Lambat`, `Spam/Tidak Penting`, atau `Lain-lain`) dan memberikan **Skor Urgensi (1–5)**.
- **Kejelasan Sumber Kategorisasi (`✨ Gemini AI` vs `⚙️ Filter Fallback`)**:
  - Menampilkan *banner* status mesin triase aktif di bagian atas Dashboard Admin.
  - Menampilkan lencana (*badge*) sumber analisis pada setiap baris laporan di tabel dan di panel rincian laporan.
  - Menyediakan filter khusus berdasarkan **Sumber Triase** (`Gemini AI` atau `Filter Fallback`), **Kategori AI**, **Skala Urgensi**, **Status Penanganan**, dan **Pencarian Kata Kunci / Kode Tiket**.
- **Privasi Penuh Hasil AI**: Hasil analisis kategori, skor urgensi, dan sumber triase **hanya ditampilkan di Dashboard Admin** dan tidak pernah dikirimkan ke halaman publik atau API cek status warga.

---

## 💻 Bahasa Pemrograman & Teknologi yang Digunakan

| Lapisan | Bahasa / Teknologi | Peran & Kegunaan |
| :--- | :--- | :--- |
| **Bahasa Pemrograman Utama** | **JavaScript (ES6+)** | Logika frontend interaktif di peramban dan backend server API berbasis Node.js. |
| **Markup & Struktur Halaman** | **HTML5 Semantik** | Struktur halaman publik (`index.html`, `lapor.html`, `status.html`, `panduan.html`) dan halaman petugas (`admin.html`). |
| **Styling & Desain Responsif** | **CSS3 & Tailwind CSS** | Sistem desain warna *Emerald Trust*, tipografi responsif, tata letak *grid/flexbox*, dan komponen *Hamburger Menu* mobile. |
| **Runtime & Server Backend** | **Node.js & Express.js** | Menjalankan server HTTP, melayani berkas statis, menyediakan REST API, rate-limiting, dan integrasi AI. |
| **Basis Data (Database)** | **SQLite (`better-sqlite3`)** | Penyimpanan relasional lokal berbasis berkas (`data/amanlapor.db`) yang cepat dengan mode `WAL` (*Write-Ahead Logging*). |
| **Kecerdasan Buatan (AI)** | **Google Gemini 2.5 Flash REST API** | Analisis teks laporan secara instan untuk menentukan kategori triase dan skor urgensi (1–5). |

---

## 🧰 Bahan & Prasyarat yang Dibutuhkan

Sebelum membangun dan menjalankan website AmanLapor di komputer Anda, siapkan bahan-bahan berikut:

1. **Sistem Operasi**: Linux, macOS, atau Windows (10/11).
2. **Node.js**: Versi **18.0.0 ke atas** (direkomendasikan Node.js LTS v20+ atau versi terbaru) beserta **NPM** (*Node Package Manager*).
3. **Peramban Web Modern (Browser)**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari.
4. **Koneksi Internet**:
   - Dibutuhkan untuk memuat aset tipografi (*Google Fonts*), ikon (*Material Symbols*), utilitas *Tailwind CSS CDN* pada browser, serta memanggil API Google Gemini 2.5 Flash (jika menggunakan API Key).
5. **Kunci API Google AI Studio (`GEMINI_API_KEY`) — *Opsional***:
   - Dapat diperoleh secara gratis melalui [Google AI Studio](https://aistudio.google.com/).
   - **Catatan Penting**: Jika Anda **belum memasukkan API Key**, website **tetap dapat berjalan 100% normal** karena dilengkapi mesin **Filter Fallback (Aturan Kata Kunci Lokal)** yang otomatis mengambil alih proses kategorisasi dan ditandai secara jujur sebagai `⚙️ Filter Fallback` di Dashboard Admin.

---

## 📂 Struktur Direktori Proyek

```text
AmanLapor/
├── data/
│   └── amanlapor.db          # Basis data SQLite (dibuat otomatis saat server berjalan)
├── uploads/                  # Direktori penyimpanan berkas bukti laporan warga (JPG, PNG, PDF)
├── public/                   # Berkas Frontend (HTML, JS)
│   ├── index.html            # Halaman Beranda (Landing Page & Cek Tiket Cepat)
│   ├── lapor.html            # Halaman Formulir Buat Pengaduan Warga
│   ├── status.html           # Halaman Cek Status Laporan & Percakapan Rahasia
│   ├── panduan.html          # Halaman Panduan Mudah Melapor untuk Warga
│   ├── admin.html            # Halaman Dashboard Petugas / Admin
│   └── js/
│       ├── common.js         # Utilitas bersama (Device Token, Kuota, Escape XSS, Hamburger Menu)
│       ├── index.js          # Logika pencarian cepat di halaman Beranda
│       ├── lapor.js          # Logika form pengaduan, tanggal hibrida, validasi berkas & kuota
│       ├── status.js         # Logika pelacakan tiket, cetak tanda terima & obrolan warga
│       └── admin.js          # Logika Dashboard Admin, filter AI/Fallback, & pembaruan status
├── server.js                 # Server utama Express.js, API Routes, Keamanan, SQLite & Gemini AI
├── package.json              # Daftar dependensi NPM dan metadata proyek
├── package-lock.json         # Pengunci versi paket NPM
└── README.md                 # Dokumentasi lengkap proyek AmanLapor
```

---

## 🚀 Panduan Instalasi & Cara Menjalankan Website (Dari Awal hingga Berjalan)

Ikuti langkah-langkah berikut secara berurutan untuk menjalankan website dari nol hingga siap digunakan:

### Langkah 1: Masuk ke Direktori Proyek
Buka terminal / *command prompt*, lalu arahkan ke folder proyek **AmanLapor**:

```bash
cd /path/ke/AmanLapor
```

### Langkah 2: Pasang Dependensi Paket (NPM Install)
Pasang seluruh pustaka pendukung (`express`, `better-sqlite3`, `multer`) menggunakan perintah:

```bash
npm install
```

### Langkah 3: Konfigurasi API Key Gemini 2.5 Flash (Opsional)
Anda dapat menjalankan AmanLapor dalam dua mode:

- **Opsi A — Mode Tanpa API Key (Otomatis menggunakan Filter Fallback Lokal):**
  Langsung lanjut ke **Langkah 4**. Dashboard Admin akan menampilkan status:
  > *"Mode Aktif: Filter Fallback (Aturan Kata Kunci Lokal) — GEMINI_API_KEY belum dipasang."*

- **Opsi B — Mode Google Gemini 2.5 Flash AI (Menggunakan API Key):**
  Ekspor variabel lingkungan `GEMINI_API_KEY` di terminal sebelum menjalankan server:
  ```bash
  export GEMINI_API_KEY="AIzaSyYourActualGeminiApiKeyHere"
  ```

### Langkah 4: Jalankan Server Website
Jalankan perintah berikut untuk menghidupkan server backend dan frontend:

```bash
node server.js
```
Jika berhasil, terminal akan menampilkan pesan:
```text
AmanLapor running on http://localhost:3000
```
*(Basis data SQLite beserta contoh data laporan awal akan otomatis dibuat di `data/amanlapor.db` pada saat pertama kali dijalankan).*

### Langkah 5: Akses Halaman Website di Browser
Buka peramban (browser) Anda dan kunjungi alamat berikut:

| Halaman | URL Akses | Kegunaan |
| :--- | :--- | :--- |
| **Beranda Warga** | `http://localhost:3000/` atau `http://localhost:3000/index.html` | Halaman utama informasi & pelacakan tiket cepat. |
| **Buat Pengaduan** | `http://localhost:3000/lapor.html` | Formulir pengaduan warga 3 langkah dengan lampiran bukti. |
| **Cek Status Laporan** | `http://localhost:3000/status.html` | Melihat tahapan penanganan & pesan dua arah dengan petugas. |
| **Panduan Warga** | `http://localhost:3000/panduan.html` | Penjelasan langkah-langkah melapor yang mudah dipahami. |
| **Dashboard Admin** | `http://localhost:3000/admin.html` | Panel khusus petugas untuk melihat triase AI/Fallback, memfilter laporan, mengunduh bukti, dan membalas laporan. |

---

## 🔍 Transparansi Kategorisasi: Gemini AI vs Filter Fallback

Untuk memastikan kejelasan bagi petugas di **Dashboard Admin (`admin.html`)**, setiap laporan yang masuk dicatat sumber kategorisasinya pada kolom `ai_source` di basis data dengan dua kemungkinan nilai:

1. **`✨ Gemini AI` (`ai_source: "gemini"`)**
   - Dihasilkan secara langsung oleh model **`gemini-2.5-flash`** melalui Google Generative Language API ketika `GEMINI_API_KEY` terpasang dan merespons dengan JSON valid.
   - Menggunakan `temperature: 0` dan `responseMimeType: "application/json"` untuk menjaga konsistensi output.

2. **`⚙️ Filter Fallback` (`ai_source: "fallback"`)**
   - Dihasilkan oleh mesin pencocokan kata kunci lokal (`fallbackAnalyzeReport`) pada `server.js`.
   - Aktif secara otomatis apabila `GEMINI_API_KEY` belum dikonfigurasi, koneksi internet/API sedang terputus, atau kuota API habis.
   - Ditampilkan dengan lencana abu-abu **`⚙️ Filter Fallback`** pada tabel laporan serta penjelasan transparan di panel rincian laporan agar petugas mengetahui bahwa hasil kategorisasi tersebut berasal dari filter kata kunci lokal, bukan dari model AI.

---

## 🔒 Arsitektur Keamanan (End-to-End Hardening)

Proyek ini telah melalui proses audit keamanan menyeluruh dari sisi klien hingga server:

1. **Keamanan Unggah Berkas (*File Upload Security & Magic-Bytes Inspection*)**:
   - Hanya mengizinkan berkas bukti berformat **JPG, PNG, dan PDF** dengan ukuran maksimum **5 MB** per berkas (maksimal 5 berkas per laporan).
   - Server melakukan validasi ganda: memeriksa `Content-Type` serta memeriksa **Magic Bytes (signature biner awal berkas)** secara langsung (`FF D8 FF` untuk JPEG, `89 50 4E 47` untuk PNG, dan `%PDF-` untuk PDF). Jika berkas berbahaya (seperti script `.php`, `.sh`, `.html`, atau `.exe` yang diubah namanya menjadi `.jpg`) diunggah, server langsung menghapus berkas tersebut dari disk dan menolak permintaan.
   - Nama berkas disimpan menggunakan nama acak kriptografis (`crypto.randomBytes`) dan disajikan dengan header `X-Content-Type-Options: nosniff` serta `Content-Security-Policy: default-src 'none'`.
2. **Perlindungan Cross-Site Scripting (XSS Sanitization)**:
   - Seluruh input teks dari pengguna disanitasi dari karakter kontrol berbahaya di server (`sanitizePlainText`) dan di-*escape* menggunakan `esc()` sebelum dirender ke DOM pada seluruh halaman frontend.
3. **Prompt Injection Shield untuk AI**:
   - Teks laporan warga dibungkus di dalam pembatas tag XML `<laporan>...</laporan>` (setelah mensterilkan tag penutup palsu) dan dikirim dengan *System Instruction* ketat serta `temperature: 0` agar instruksi manipulatif di dalam cerita warga tidak dapat membajak format respons AI.
4. **Rate Limiting & Anti-Bypass Kuota Perangkat**:
   - Selain pembatasan di `localStorage`, server menerapkan *rate limiter* berbasis IP (`rateLimit` middleware) pada endpoint pengiriman laporan, pengiriman pesan obrolan, dan pencarian tiket untuk mencegah serangan *brute-force* atau *spamming* melalui alat seperti Postman / cURL.
   - Kuota maksimal **3 laporan aktif per `device_token`** juga diverifikasi langsung terhadap database SQLite di server.

---

## 🔌 Dokumentasi Endpoint API

### Endpoint Publik (Warga)
| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/reports` | Mengirim laporan baru (`multipart/form-data`: `category`, `location`, `incident_date`, `chronology`, `device_token`, `files`). |
| `GET` | `/api/device-quota?device_token=...` | Memeriksa jumlah laporan aktif milik perangkat (`activeCount`, `maxActive`, `canSubmit`). |
| `GET` | `/api/reports/:code` | Mengambil status laporan, riwayat tahapan (*timeline*), lampiran, dan pesan obrolan berdasarkan kode tiket (tanpa menyertakan data analisis AI). |
| `POST` | `/api/reports/:code/messages` | Mengirim pesan tambahan dari pelapor anonim ke petugas pemeriksa. |

### Endpoint Privat (Khusus Dashboard Admin)
| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/admin/reports` | Mengambil daftar laporan beserta statistik, status konfigurasi AI (`aiConfigured`), hasil triase (`ai_category`, `ai_urgency`, `ai_source`), dan mendukung parameter filter `q`, `status`, `category`, `ai_category`, `urgensi`, serta `ai_source`. |
| `GET` | `/api/admin/reports/:code` | Mengambil rincian lengkap satu laporan untuk petugas admin (termasuk analisis AI & sumbernya). |
| `PATCH` | `/api/admin/reports/:code` | Memperbarui status penanganan laporan (`Baru`, `Dalam Pemeriksaan`, `Ditindaklanjuti`, `Selesai`), catatan perkembangan, dan penugasan unit pemeriksa. |
| `POST` | `/api/admin/reports/:code/messages` | Mengirim balasan pesan resmi dari petugas pemeriksa kepada pelapor. |

---

## 🤖 AI Use Declaration (Deklarasi Penggunaan AI)

Sesuai dengan prinsip transparansi pengembangan perangkat lunak dan tata kelola kecerdasan buatan, berikut adalah deklarasi penggunaan AI pada proyek **AmanLapor**:

1. **Penggunaan AI di Dalam Fitur Aplikasi (Runtime AI Triase)**:
   - Aplikasi ini mengintegrasikan model **Google Gemini 2.5 Flash (`gemini-2.5-flash`)** melalui layanan Google AI Studio REST API pada sisi server (`server.js`) semata-mata sebagai **alat bantu triase internal bagi petugas admin** untuk mengelompokkan kategori keluhan dan memperkirakan tingkat urgensi penanganan (skala 1–5).
   - **Perlindungan Privasi**: Data yang dikirim ke API Gemini hanyalah teks topik, lokasi umum, dan kronologi kejadian tanpa identitas pribadi pelapor. Hasil analisis AI bersifat privat untuk petugas admin dan tidak pernah ditampilkan kepada publik.
   - **Transparansi Fallback**: Apabila API AI tidak digunakan atau tidak tersedia, sistem beralih ke algoritma deterministik berbasis kata kunci lokal (`Filter Fallback`) dan memberikan label pembeda yang jelas (`✨ Gemini AI` vs `⚙️ Filter Fallback`) pada antarmuka Dashboard Admin agar petugas tidak salah mengartikan sumber analisis.
2. **Penggunaan AI dalam Proses Pengembangan (Development Assistance)**:
   - Asisten pengkodean berbasis AI (**Google DeepMind Antigravity**) digunakan selama proses *refactoring*, penyempurnaan *copywriting* ramah warga (*human-centered Bahasa Indonesia*), perancangan antarmuka responsif, penguatan keamanan (*security hardening*), serta penyusunan dokumentasi teknis ini di bawah arahan dan peninjauan langsung pengembang.

---

## 📦 Third-Party Declaration (Deklarasi Pihak Ketiga)

Proyek **AmanLapor** menggunakan pustaka sumber terbuka (*open-source libraries*), aset layanan web, dan API pihak ketiga berikut ini:

### 1. Paket Dependensi Backend (NPM Packages)
| Nama Paket | Versi | Lisensi | Kegunaan dalam Proyek |
| :--- | :--- | :--- | :--- |
| **[Express](https://expressjs.com/)** (`express`) | `^5.2.1` | MIT License | Kerangka kerja (*framework*) HTTP server dan perutean REST API. |
| **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** | `^12.8.0` | MIT License | Driver basis data SQLite sinkron berkinerja tinggi untuk Node.js. |
| **[Multer](https://github.com/expressjs/multer)** (`multer`) | `^2.1.1` | MIT License | Middleware penanganan `multipart/form-data` untuk unggah berkas bukti laporan. |

### 2. Pustaka & Aset Frontend Eksternal (CDN & Web Assets)
| Nama Layanan / Aset | Penyedia | Lisensi | Kegunaan dalam Proyek |
| :--- | :--- | :--- | :--- |
| **[Tailwind CSS Play CDN](https://tailwindcss.com/)** | Tailwind Labs Inc. | MIT License | Utilitas styling CSS responsif dan sistem tema desain pada halaman HTML. |
| **[Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)** | Google Fonts / Tokotype | Open Font License (OFL) | Tipografi utama antarmuka website agar bersih dan mudah dibaca. |
| **[Material Symbols Outlined](https://fonts.google.com/icons)** | Google Fonts | Apache License 2.0 | Ikonografi visual pada navigasi, tombol, lencana status, dan formulir. |

### 3. Layanan API Eksternal (Opsional Saat Runtime)
| Nama Layanan | Penyedia | Kegunaan dalam Proyek |
| :--- | :--- | :--- |
| **Google Generative Language API (`gemini-2.5-flash`)** | Google LLC (Google AI Studio) | Analisis triase kategori dan skor urgensi laporan masuk pada Dashboard Admin (opsional; otomatis beralih ke *Filter Fallback* lokal jika tidak dikonfigurasi). |

---

*Dokumentasi ini disusun untuk memastikan proyek **AmanLapor** mudah dipahami, diaudit, dipasang, dan dikembangkan lebih lanjut secara transparan.*
