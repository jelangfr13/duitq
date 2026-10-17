# DuitQ — Aplikasi Keuangan Pribadi Minimalis (Update v1.2)

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.2.0-blue?style=for-the-badge" alt="Version 1.2.0" />
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

DuitQ v1.2 hadir dengan tampilan modern yang mendukung **Mode Gelap (*Dark Mode*)**, **Kustomisasi Tema Warna Dinamis**, **Manajemen Foto Profil Canvas**, **Sensor Privasi Saldo**, **Menu Histori Transaksi Mendalam**, serta arsitektur **Total Keseluruhan Aset**.

---

## 🚀 Rangkuman Fitur Utama (Update v1.2)

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
  - Tombol mata praktis tepat di sebelah nominal saldo utama di Beranda.
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

### 📜 Histori Transaksi Mendalam (`/transactions`)
- 🔍 **Pencarian Real-Time**: Telusuri transaksi berdasarkan nama toko, judul, atau catatan transaksi.
- 🏷️ **Filter Lengkap**:
  - Filter *chips* horizontal tipe transaksi (*Semua, Uang Masuk, Uang Keluar, Pindah Dana, Piutang*).
  - Filter dropdown Sumber Dana, Pos Budgeting, dan Periode Waktu.
- 📊 **Ringkasan Dinamis**: Menghitung total Uang Masuk dan Uang Keluar dari hasil pencarian/filter aktif.
- 📅 **Pengelompokan Tanggal**: Transaksi dikelompokkan secara rapi (*Hari Ini*, *Kemarin*, *Tanggal Spesifik*).

---

### 🤝 Modul Piutang (*Receivables Tracking*)
- Catat dana yang dipinjamkan ke pihak lain beserta kontak dan tanggal jatuh tempo.
- Mendukung pelunasan bertahap (*Partial Payment*) maupun pelunasan lunas (*Full Settlement*).
- Otomasi mutasi: Dana pelunasan otomatis menambah saldo ke Sumber Dana tujuan.
- Submenu akses khusus yang dapat diaktifkan/dinonaktifkan melalui menu Pengaturan.

---

### ⚡ Performa & Pengalaman Pengguna (UX)
- 💀 **Skeleton Loading**: Animasi kerangka visual (`DashboardSkeleton`, `TransactionsSkeleton`, `WalletsSkeleton`, `BudgetsSkeleton`, `ReceivablesSkeleton`) mencegah kedipan atau lonjakan angka saat API dipanggil.
- 🚀 **Lazy Loading (Next.js Dynamic Imports)**:
  - Komponen grafik berat Recharts (`TotalAssetsOverview`, `BarChart`) dan form modal (`QuickAddTransactionSheet`) dimuat secara *lazy* (`ssr: false`) dengan *placeholder skeleton*.
  - Atribut `loading="lazy"` pada gambar dan avatar profil.

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
│   │   ├── config/                # Database, Mailer, & Environment Config (JWT_EXPIRES_IN: 1d)
│   │   ├── controllers/           # Auth, Budget, FundingSource, Transaction, User
│   │   ├── middlewares/           # Auth JWT, Rate Limiter, Zod Validation, Error Handler
│   │   ├── models/                # User, Budget, FundingSource, Transaction, Receivable
│   │   ├── routes/                # Router Express (/api/v1/...)
│   │   ├── services/              # Logika Bisnis & Transaksi ACID
│   │   ├── app.ts                 # Konfigurasi Express, Body Parser (5MB), & CORS
│   │   └── server.ts              # Inisialisasi Server
│   ├── .env.example               # Template environment backend
│   └── tsconfig.json
├── frontend/                      # Next.js App Router Mobile Web
│   ├── src/
│   │   ├── app/                   # App Router: (auth), (main), manifest.ts
│   │   │   └── (main)/            # dashboard, budgets, wallets, transactions, receivables, settings
│   │   ├── components/            # UI Components, Charts, ThemeProvider, Skeleton
│   │   │   ├── charts/            # TotalAssetsOverview, BarChart, DonutChart
│   │   │   ├── theme/             # ThemeProvider & Preset Warna
│   │   │   ├── transactions/      # QuickAddTransactionSheet Drawer
│   │   │   └── ui/                # Button, Card, BottomSheet, Input, Select, Skeleton
│   │   ├── hooks/                 # Custom React Query Hooks (useAuth, useBudgets, dll.)
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

   # Konfigurasi SMTP (Opsional untuk Reset Password)
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
3. Pastikan endpoint backend mengarah ke port backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
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
- `FRONTEND_URL`: `https://duitq.vercel.app` (domain frontend Anda)
- `COOKIE_SAME_SITE`: `none` *(Wajib jika backend dan frontend berada pada domain/platform berbeda)*

### Konfigurasi Environment Frontend Production:
- `NEXT_PUBLIC_API_URL`: URL API backend production (contoh: `https://api.duitq.com/api/v1`)

---

## 📄 Lisensi

Didistribusikan di bawah lisensi [MIT](LICENSE).
