# DuitQ — Aplikasi Keuangan Pribadi Minimalis (Update v1.2.2)

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.2.2-blue?style=for-the-badge" alt="Version 1.2.2" />
  <img src="https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend%20API-000000?style=for-the-badge&logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20ACID-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Types-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## 📌 Tentang DuitQ

**DuitQ** adalah aplikasi web manajemen keuangan pribadi berbasis **PWA (Progressive Web App)** yang mengusung filosofi **"Kotak Uang Nyata" (*Real-world Envelope Budgeting*)**. Aplikasi ini dirancang agar setiap rupiah memiliki kepastian alokasi dan lokasi penyimpanan:

1. **Sumber Dana (*Funding Sources*)**: Tempat fisik/digital dana disimpan (Dompet Tunai, Rekening Bank BCA/Mandiri, E-Wallet GoPay/OVO, dll.).
2. **Pos Budgeting (*Budgets*)**: Pagu anggaran belanja terikat langsung ke Sumber Dana tertentu tanpa memotong saldo awal dompet. Saldo dompet dan anggaran otomatis terpotong ketika transaksi pengeluaran dicatat dengan pos budget tersebut.

DuitQ v1.2.2 menghadirkan penyempurnaan menyeluruh: **Admin Panel Khusus Developer (`/settings/admin`)**, **Fitur Lupa Kata Sandi 2 Metode (Bantuan Admin & Email Mandiri)**, **Penjaminan Tautan Email Bebas Localhost (*Zero-Localhost Guarantee*)**, **Validasi Integritas Saldo Budgeting**, **Kestabilan Tata Letak Form Statis (*Zero Horizontal Shift*)**, **Brand Asset & Ikon Aplikasi HTML/PWA**, serta fitur v1.2.1 seperti **Halaman Khusus Mutasi Rekening (`/wallets/[id]`)**, **Anti-Zoom PWA**, dan **Pencarian Histori Bebas Lag**.

---

## 🚀 Rangkuman Fitur Utama (Update v1.2.2)

### 🛡️ Admin Panel Developer (`/settings/admin`) *(Baru di v1.2.2)*
- 🔐 **Akses Terproteksi Khusus Developer Admin**:
  - Submenu Admin Panel di Pengaturan hanya muncul jika akun yang login cocok dengan konfigurasi environment `DEV_ADMIN_EMAIL` dan `NEXT_PUBLIC_DEV_ADMIN_EMAIL`.
  - Alamat email admin tidak di-hardcode di kode program sehingga sepenuhnya aman dari kebocoran publik.
  - Dilindungi middleware otorisasi backend `requireAdmin`.
- 📊 **Dasbor Kontrol Akun Pengguna**:
  - **Statistik KPI Kompak**: Total Pengguna, Pengguna Butuh Reset Sandi, Total Dompet, dan Total Transaksi.
  - **Tab Filter Cepat**: Berpindah dalam 1 klik antara tab *Semua Pengguna* dan tab *Butuh Reset* (dengan indikator status aktif).
  - **Pencarian Cepat**: Filter pencarian instan berdasarkan nama lengkap atau alamat email pengguna.
- 🔑 **Reset Kata Sandi Pengguna Fleksibel**:
  - **Mode Sandi Kustom**: Admin dapat memasukkan kata sandi spesifik yang langsung aktif, dilengkapi tombol *Salin Kata Sandi*.
  - **Mode Force Reset Saat Login**: Jika kotak kata sandi dikosongkan oleh admin, sistem menandai akun `mustResetPassword = true`. Ketika pengguna mencoba login kembali di halaman masuk, mereka akan **langsung dialihkan untuk membuat kata sandi baru**.
- 🚨 **Hapus Akun Permanen (*Danger Action*)**:
  - Tombol aksi berwarna **Merah Terang / Danger** dengan dialog konfirmasi ketik teks (`HAPUS PENGGUNA`) untuk menghapus akun dan kaskade seluruh data keuangannya secara permanen dari MongoDB.
  - Proteksi mandiri: Akun Developer Utama tidak dapat dihapus melalui antarmuka admin panel.

---

### 🔑 Fitur Lupa Kata Sandi 2 Metode & Tautan Bersih *(Baru di v1.2.2)*
- 🔄 **Dua Pilihan Metode Pemulihan Akun**:
  1. **Opsi 1: Minta Bantuan Developer / Admin** *(Disarankan)*:
     - Solusi ketika pengguna kehilangan akses kotak masuk email atau email tidak menerima kode OTP/verifikasi.
     - Pengguna memasukkan email dan catatan kendala (opsional). Permintaan dicatat di basis data dan mengirimkan notifikasi ke Developer Admin.
     - Akun pengguna langsung ditandai dengan badge peringatan amber `🔔 Meminta Reset Kata Sandi` di Admin Panel untuk segera diproses admin.
  2. **Opsi 2: Kirim Kode & Tautan ke Email Terdaftar** *(Mandiri)*:
     - Sistem mengirimkan email berisi **tombol reset langsung**, **tautan URL resmi**, dan **kode token verifikasi 64-karakter**.
- 🌐 **Jaminan Tautan Email Bebas Localhost (*Zero-Localhost Guarantee*)**:
  - Fungsi resolver cerdas `getCleanFrontendUrl()` menyaring multi-origin CORS, secara ketat mengeliminasi alamat `localhost` atau `127.0.0.1`, dan selalu menggunakan domain resmi production (`https://duitq.vercel.app`).
- ✍️ **Fleksibilitas Input Kode Verifikasi (`/reset-password`)**:
  - Halaman `/reset-password` mendukung pembukaan otomatis lewat query parameter tautan URL (`?token=...`) maupun penginputan kode verifikasi secara manual jika pengguna datang langsung ke halaman reset sandi.

---

### 🛑 Validasi Batasan Saldo Budgeting *(Baru di v1.2.2)*
- ⚖️ **Integritas Alokasi Dana**:
  - Pagu anggaran (*budgeting limit*) tidak dapat dibuat jika nominalnya melebihi sisa saldo yang tersedia pada Sumber Dana yang dipilih.
  - Validasi ganda di tingkat frontend (peringatan instan) dan backend Express (pemeriksaan saldo real-time) untuk mencegah alokasi anggaran minus atau fiktif.

---

### 🎨 Brand Ikon Aplikasi & PWA Favicon *(Baru di v1.2.2)*
- 💎 **Brand Assets Resmi**:
  - Penyematan ikon resmi DuitQ (*squircle* biru royal `#2563EB` dengan siluet dompet putih elegan) pada favicon peramban web (`public/icon.svg`), rute metadata dinamis Next.js (`app/icon.tsx`, `app/apple-icon.tsx`), dan manifes web (`manifest.webmanifest`).
  - Menjamin konsistensi visual identitas merek di halaman login, tab browser desktop/mobile, dan saat ditambahkan ke layar utama (*Add to Home Screen*) pada iOS dan Android.

---

### 📐 Kestabilan Layout Form Transaksi (*Zero Horizontal Shift*) *(Baru di v1.2.2)*
- 🔒 **Fixed Viewport & Form Statis**:
  - Memperbaiki tata letak drawer *Catat Transaksi Cepat* (`BottomSheet.tsx`) yang sebelumnya dapat bergeser ke kiri/kanan.
  - Penerapan aturan `overflow-x: hidden`, `overscroll-behavior: contain`, serta penataan kontainer form statis memastikan antarmuka tetap kokoh dan stabil di semua perangkat mobile.

---

### 💳 Halaman Khusus Mutasi Rekening (`/wallets/[id]`) *(Fitur v1.2.1)*
- 📑 **Dedicated Mutation Page**: Tombol *"Lihat Mutasi"* pada setiap kartu rekening mengarahkan pengguna ke halaman terdedikasi (`/wallets/[id]`).
- 🏛️ **Hero Card & Saldo Terkini**: Menampilkan nama dompet, tipe rekening, ikon, warna aksen, dan saldo terkini lengkap dengan sensor privasi (*hide balance*).
- 📊 **Ringkasan Arus Kas Rekening**: Metrik visual **Total Uang Masuk** dan **Total Uang Keluar** khusus untuk rekening yang sedang dibuka.
- 🔍 **Pencarian & Filter Khusus Rekening**:
  - Kolom pencarian teks mutasi transaksi rekening terpilih.
  - Filter *chips* cepat: *Semua*, *Uang Masuk*, *Uang Keluar*, *Pindah Dana*.
- 📅 **Daftar Mutasi Kronologis**: Transaksi dikelompokkan rapi berdasarkan tanggal (*Hari Ini*, *Kemarin*, dll.) dengan ikon semantik, badge transfer (*"Dari Dompet"* / *"Ke Dompet"*), badge pos anggaran, nominal tabular berformat `+Rp` / `-Rp`, serta modal rincian transaksi lengkap dengan opsi hapus transaksi.

---

### 📱 Pengalaman Mobile & Anti-Zoom PWA *(Fitur v1.2.1)*
- 🔒 **Disabled Web Zooming (Anti-Zoom)**:
  - Konfigurasi `viewport` Next.js (`maximumScale: 1`, `userScalable: false`, `viewportFit: 'cover'`).
  - Aturan CSS `touch-action: pan-x pan-y` dan `touch-action: manipulation` pada elemen interaktif untuk mencegah *pinch-to-zoom* dan *double-tap-to-zoom*.
  - Listener event pencegah gesture Safari iOS (`gesturestart`, `gesturechange`, `gestureend`) memastikan aplikasi berjalan stabil layaknya aplikasi native tanpa pergeseran rasio layar yang tidak diinginkan.

---

### 📜 Histori Transaksi Mendalam & Pencarian Bebas Lag (`/transactions`)
- ⚡ **Pencarian Cepat 60 FPS (300ms Debounce)**:
  - Mengeliminasi jeda pengetikan huruf per huruf dengan memisahkan state input dan state kueri API melalui mekanisme *debounce* 300ms.
  - Penggunaan TanStack Query `placeholderData` menjaga daftar transaksi tetap utuh di layar selama proses pengambilan data tanpa kedipan (*skeleton unmounting*).
  - Indikator pemuatan halus (*spinner*) di dalam bilah pencarian saat data sedang disegarkan di latar belakang (`isFetching`).
- 🏷️ **Filter Komprehensif**:
  - Filter *chips* horizontal tipe transaksi (*Semua, Uang Masuk, Uang Keluar, Pindah Dana, Piutang*).
  - Filter dropdown Sumber Dana, Pos Budgeting, dan Periode Waktu (*Bulan Ini*, *Bulan Lalu*, *Semua Waktu*, *Kustom Tanggal*).
  - Sinkronisasi otomatis dengan query URL parameter (misal: `/transactions?fundingSourceId=...`).
- 📊 **Ringkasan Dinamis**: Menghitung total Uang Masuk dan Uang Keluar dari hasil pencarian/filter aktif.

---

### 🎨 Tampilan & Personalisasi Pengguna
- 🌙 **Mode Gelap (Dark Mode)**: Beralih mulus antara mode terang dan gelap dengan kontras warna nyaman di mata pada seluruh komponen, form, modal *Bottom Sheet*, dan bar navigasi.
- 🎨 **Kustomisasi Tema Warna Dinamis**:
  - 6 Pilihan Preset Elegan: *Royal Blue (`#2563EB`)*, *Emerald Green (`#059669`)*, *Violet Purple (`#7C3AED`)*, *Rose Pink (`#E11D48`)*, *Amber Gold (`#D97706`)*, *Indigo Night (`#4F46E5`)*.
  - **Color Picker Kustom**: Pengguna bebas memilih warna aksen aplikasi menggunakan *color picker* visual atau memasukkan kode HEX.
- 👤 **Kustomisasi Foto Profil & Avatar**:
  - Unggah foto profil dari perangkat dengan kompresi dan *center-crop* otomatis via HTML5 Canvas (ukuran `256x256` JPEG kualitas `0.8`, ukuran ringan < 40KB).
  - Pilihan koleksi avatar preset SVG mandiri (*offline-ready*) atau kembali ke avatar inisial nama.
  - Tampilan foto profil interaktif di pojok kanan atas Beranda yang terhubung langsung ke Pengaturan.
- 👁️ **Sensor Privasi Saldo (*Hide Balance*)**:
  - Tombol mata praktis tepat di sebelah nominal saldo utama di Beranda dan seluruh kartu rekening.
  - Menyamarkan nominal saldo (`Rp ••••••••` / `Rp ••••••`) di seluruh kartu, grafik, dan riwayat transaksi.

---

### 📊 Analitik & Ikhtisar Finansial Lengkap
- 🏛️ **Total Keseluruhan Aset (*Net Wealth Overview*)**:
  - **Estimasi Kekayaan Bersih**: Akumulasi total saldo kas dari seluruh rekening/dompet ditambah piutang aktif yang belum tertagih.
  - **Status Arus Kas Bersih**: Lencana indikator surplus atau defisit kas periode berjalan.
  - **Grafik Donut Interaktif 2 Tab**: Beralih antara *Komposisi Saldo per Dompet* dan *Plafon Alokasi Budgeting*.
  - **5 Pilar Finansial Utama**: Metrik ringkas Total Saldo, Pemasukan, Pengeluaran, Pos Budgeting (plafon & sisa), dan Piutang Tertagih.
- 📈 **Grafik Tren Arus Kas (*Cash Flow Bar Chart*)**:
  - Perbandingan batang visual uang masuk vs uang keluar harian/bulanan.
  - Filter rentang waktu: *Bulan Ini*, *Bulan Lalu*, dan *Rentang Tanggal Kustom*.

---

### 🎯 Manajemen Budgeting & Sumber Dana
- 💳 **Sumber Dana (Dompet & Rekening)**:
  - Kelola multi-rekening: Bank, E-Wallet, Uang Tunai, dan Lainnya.
  - Fitur **Hapus Permanen** dengan dialog konfirmasi aman dan penghapusan kaskade (*cascading cleanup*) pada pos budget terkait.
- 🏷️ **Sistem Budgeting Nyata (*Envelope Budgeting*)**:
  - Tentukan pagu belanja bulanan yang terhubung langsung dengan Sumber Dana tertentu.
  - Konsep **Uang Berkurang**: Bilah progres menyusut ke kiri saat dana digunakan, dengan indikator sisa saldo dan persentase yang jelas.
  - Laci riwayat mutasi detail per pos anggaran.

---

### 🤝 Modul Piutang (*Receivables Tracking*)
- Catat dana yang dipinjamkan ke pihak lain beserta kontak dan tanggal jatuh tempo.
- Mendukung pelunasan bertahap (*Partial Payment*) maupun pelunasan lunas (*Full Settlement*).
- Otomasi mutasi: Dana pelunasan otomatis menambah saldo ke Sumber Dana tujuan.
- Submenu akses khusus yang dapat diaktifkan/dinonaktifkan melalui menu Pengaturan.

---

### ⚡ Performa & Pengalaman Pengguna (UX)
- 💀 **Skeleton Loading**: Animasi kerangka visual (`DashboardSkeleton`, `TransactionsSkeleton`, `WalletsSkeleton`, `BudgetsSkeleton`, `ReceivablesSkeleton`) mencegah kedipan atau lonjakan angka saat API dipanggil.
- 🚀 **Lazy Loading (Next.js Dynamic Imports & Partial Prerendering)**:
  - Komponen grafik berat Recharts (`TotalAssetsOverview`, `BarChart`) dan form modal (`QuickAddTransactionSheet`) dimuat secara *lazy* (`ssr: false`) dengan *placeholder skeleton*.
  - Atribut `loading="lazy"` pada gambar dan avatar profil.
  - Navigasi bawah dibungkus `<Suspense>` untuk mendukung *Partial Prerendering* (PPR) pada rute statis maupun dinamis (`/wallets/[id]`).

---

### 🔒 Autentikasi & Keamanan Sesi
- **Masa Kedaluwarsa JWT 1 Hari (24 Jam)**: Token sesi (`accessToken` & `refreshToken`) serta cookie browser dikonfigurasi aktif selama 1 hari untuk keamanan optimal.
- **Auto-Logout Sesi Kedaluwarsa**: Axios interceptor menangkap respon HTTP 401 dan secara otomatis membersihkan sisa sesi serta mengarahkan ke halaman `/login`.
- **Hapus Akun Permanen**: Tombol teks di bawah tombol Keluar Akun dengan dialog konfirmasi (*danger modal*) untuk menghapus seluruh data pengguna secara permanen dari basis data.
- **Proteksi Brute-Force & Reset Password**: Enkripsi password `bcrypt`, rate limiting pada rute autentikasi, serta tautan reset sandi aman via Nodemailer/SMTP.

---

## 🛠️ Tech Stack

### Frontend (`frontend/`)
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 (Full Dark Mode & CSS Theme Variables)
- **State & Server Cache**: TanStack React Query v5 & Zustand
- **Visualisasi Data**: Recharts (Donut & Bar Charts dengan Dynamic Lazy Loading)
- **Ikon**: Lucide React
- **Validasi Formulir**: Zod

### Backend (`backend/`)
- **Runtime**: Node.js & Express.js (TypeScript)
- **Database**: MongoDB dengan ODM Mongoose
- **Integritas Data**: Multi-Document ACID Transactions (`mongoose.startSession()`)
- **Keamanan**: Helmet, CORS, Express Rate Limit, Cookie-Parser, JWT
- **Email Service**: Nodemailer (Gmail SMTP) & Mailtrap SDK

### Kontrak Bersama (`shared/`)
- Monorepo TypeScript Interfaces & Zod Schemas bersama (`@shared/*`) untuk menjamin keselarasan tipe data (*Type-safety*) antara Frontend dan Backend.

---

## 📁 Struktur Direktori

```text
DuitQ/
├── backend/                       # REST API Express.js + MongoDB
│   ├── src/
│   │   ├── config/                # Database, Mailer, & Clean APP_URL Env Config
│   │   ├── controllers/           # Admin, Auth, Budget, FundingSource, Transaction, User
│   │   ├── middlewares/           # Auth JWT, Admin Guard, Rate Limiter, Zod Validation, Error Handler
│   │   ├── models/                # User, Budget, FundingSource, Transaction, Receivable, PasswordResetToken
│   │   ├── routes/                # Router Express (/api/v1/auth, /admin, /budgets, dll.)
│   │   ├── services/              # Logika Bisnis, Admin Service, & Transaksi ACID
│   │   ├── app.ts                 # Konfigurasi Express, Body Parser (5MB), & CORS
│   │   └── server.ts              # Inisialisasi Server
│   ├── .env.example               # Template environment backend
│   └── tsconfig.json
├── frontend/                      # Next.js App Router Mobile Web
│   ├── public/                    # Icon SVG, Favicon, & Manifest Assets
│   ├── src/
│   │   ├── app/                   # App Router: (auth), (main), manifest.ts, icon.tsx, apple-icon.tsx
│   │   │   ├── (auth)/            # login, register, forgot-password, reset-password
│   │   │   └── (main)/            # dashboard, budgets, wallets, transactions, receivables, settings
│   │   │       ├── settings/      # page.tsx (pengaturan), admin/page.tsx (admin panel)
│   │   │       └── wallets/       # page.tsx (daftar dompet), [id]/page.tsx (halaman mutasi)
│   │   ├── components/            # UI Components, Charts, ThemeProvider, Skeleton
│   │   │   ├── charts/            # TotalAssetsOverview, BarChart, DonutChart
│   │   │   ├── theme/             # ThemeProvider & Preset Warna
│   │   │   ├── transactions/      # QuickAddTransactionSheet Drawer
│   │   │   └── ui/                # Button, Card, BottomSheet, Input, Select, Skeleton
│   │   ├── hooks/                 # React Query Hooks (useAuth, useAdmin, useBudgets, dll.)
│   │   ├── lib/                   # Axios API Client, Interceptor 401, Currency Formatters
│   │   └── middleware.ts          # Route Guard Next.js Middleware
│   ├── .env.example               # Template environment frontend
│   └── tsconfig.json
├── shared/                        # Skema Zod & Type Definitions Bersama
│   └── types/                     # user, budget, funding-source, transaction, receivable, dashboard
├── prd/                           # Dokumen Spesifikasi Produk (PRD)
├── .gitignore                     # Proteksi credential, lockfiles, dan environment files
└── README.md                      # Dokumentasi proyek
```

---

## ⚙️ Panduan Menjalankan di Lokal (Development)

### Prasyarat
- [Node.js](https://nodejs.org/) versi `>= 20.0.0`
- Instans [MongoDB](https://www.mongodb.com/) (Lokal atau MongoDB Atlas)

### 1. Clone Repositori
```bash
git clone https://github.com/jelangfr13/duitq.git
cd duitq
```

### 2. Menjalankan Backend
1. Masuk ke folder backend dan pasang dependensi:
   ```bash
   cd backend
   npm install
   ```
2. Buat file `.env` dari template:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan konfigurasi di `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/duitq
   JWT_SECRET=super_secret_jwt_key_duitq_change_in_production
   JWT_EXPIRES_IN=1d
   FRONTEND_URL=http://localhost:3000

   # Developer / Super Admin Email (Untuk Mengakses Admin Panel)
   DEV_ADMIN_EMAIL=dev@dev.com

   # Konfigurasi SMTP (Opsional untuk Reset Password Email)
   EMAIL_PROVIDER=gmail
   SMTP_SERVICE=gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=emailanda@gmail.com
   SMTP_PASS=app_password_google
   SMTP_FROM="DuitQ <emailanda@gmail.com>"
   ```
4. Jalankan backend:
   ```bash
   npm run dev
   ```
   *Backend aktif di `http://localhost:5001` (Health check: `http://localhost:5001/api/v1/health`)*

### 3. Menjalankan Frontend
1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Buat file `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Sesuaikan konfigurasi di `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
   NEXT_PUBLIC_DEV_ADMIN_EMAIL=dev@dev.com
   ```
4. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```
   *Frontend aktif di `http://localhost:3000`*

---

## 🌐 Panduan Deployment ke Production

### Arsitektur yang Disarankan
- **Frontend**: [Vercel](https://vercel.com/)
- **Backend**: [Railway](https://railway.app/) / [Render](https://render.com/) / VPS Linux
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas)

### Konfigurasi Environment Backend Production:
- `NODE_ENV`: `production`
- `PORT`: `5001` (atau `$PORT`)
- `MONGODB_URI`: *Connection string MongoDB Atlas*
- `JWT_SECRET`: *String rahasia unik minimal 32 karakter*
- `JWT_EXPIRES_IN`: `1d`
- `FRONTEND_URL`: `https://duitq.vercel.app` (domain frontend production)
- `COOKIE_SAME_SITE`: `none` *(Wajib jika backend dan frontend berada pada domain/platform berbeda)*
- `DEV_ADMIN_EMAIL`: *Alamat email developer/super admin Anda*

### Konfigurasi Environment Frontend Production:
- `NEXT_PUBLIC_API_URL`: URL API backend production (contoh: `https://api.duitq.com/api/v1`)
- `NEXT_PUBLIC_DEV_ADMIN_EMAIL`: *Alamat email developer/super admin Anda*

---

## 📄 Lisensi

Didistribusikan di bawah lisensi [MIT](LICENSE).
