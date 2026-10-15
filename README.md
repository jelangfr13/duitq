# DuitQ — Aplikasi Keuangan Pribadi Minimalis

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend%20API-000000?style=for-the-badge&logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20ACID-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Types-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## 📌 Tentang DuitQ

**DuitQ** adalah aplikasi web manajemen keuangan pribadi berbasis **PWA (Progressive Web App)** yang dirancang dengan filosofi **"Kotak Uang Nyata" (*Envelope Budgeting & Real-world Money Box*)**. Aplikasi ini memisahkan konsep keuangan pribadi ke dalam dua dimensi yang jelas:

1. **Sumber Dana (*Funding Sources*)**: Tempat fisik uang disimpan (Dompet Tunai, Rekening Bank BCA/Mandiri, E-Wallet GoPay/OVO, dll.).
2. **Ruang Penyimpanan (*Storage Spaces*)**: Pos alokasi anggaran tujuan uang (Kebutuhan Pokok, Transportasi, Hiburan, Tabungan Darurat, dll.).

Pendekatan ini memberikan gambaran yang akurat mengenai **di mana uang Anda berada** dan **untuk apa uang tersebut dialokasikan**, didukung oleh pencatatan transaksi instan (*Quick-Add*) dan pelacakan piutang opsional.

---

## 🚀 Fitur Utama

- 🔐 **Autentikasi & Keamanan Berlapis**:
  - Pendaftaran & Masuk akun dengan enkripsi password `bcrypt`.
  - Manajemen sesi berbasis **JWT** yang disimpan dalam **HttpOnly, Secure, SameSite Cookies** (mencegah XSS).
  - Fitur **Lupa Kata Sandi** dengan pengiriman tautan pemulihan aman via **Gmail SMTP / Nodemailer** (berlaku 15 menit dengan proteksi anti-email enumeration).
  - *Rate Limiting* (5 request / 15 menit) pada rute kritis untuk menangkal serangan *Brute Force*.
- 💼 **Sumber Dana (Dompet & Rekening)**:
  - Kelola multi-rekening: Tunai, Bank, dan E-Wallet.
  - Dukungan penyesuaian saldo manual (*Balance Adjustment*) dengan pencatatan mutasi otomatis.
- 📦 **Ruang Penyimpanan (Pos Anggaran)**:
  - Buat ruang penyimpanan kustom dengan ikon, warna, dan target batas anggaran bulanan.
  - Ringkasan visual alokasi dan sisa pagu anggaran.
- ⚡ **Pencatatan Transaksi Cepat (*Quick-Add Sheet*)**:
  - *Bottom sheet* ramah ibu jari (*mobile-first thumb-zone*) yang dapat diakses dari halaman mana saja.
  - Mendukung transaksi **Uang Keluar**, **Uang Masuk**, dan **Transfer Antar Rekening**.
  - Kalkulator bawaan pada kolom nominal untuk perhitungan instan.
- 🤝 **Manajemen Piutang (*Receivables Tracking*)**:
  - Catat pinjaman uang yang diberikan ke pihak lain beserta tanggal jatuh tempo.
  - Dukungan pelunasan bertahap (*Partial Payment*) maupun pelunasan penuh (*Full Settlement*).
  - Integrasi mutasi: Uang pelunasan piutang langsung menambah saldo Sumber Dana yang dipilih.
- 📊 **Dashboard Analitik Finansial**:
  - **Donut Chart**: Visualisasi proporsi pengeluaran per Ruang Penyimpanan.
  - **Bar Chart**: Perbandingan arus kas bulanan (Uang Masuk vs. Uang Keluar).
  - Filter rentang waktu: Bulan Ini, Bulan Lalu, dan Rentang Tanggal Kustom.
- 📱 **Progressive Web App (PWA)**:
  - Dapat diinstal di layar utama smartphone (*Add to Home Screen*) selayaknya aplikasi native.

---

## 🛠️ Tech Stack

### Frontend (`frontend/`)
- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **State & Server Cache**: TanStack React Query v5 & Zustand
- **Visualisasi Data**: Recharts (Donut & Bar Charts)
- **Ikon**: Lucide React
- **Validasi**: Zod

### Backend (`backend/`)
- **Runtime**: Node.js & Express.js (TypeScript)
- **Database**: MongoDB dengan ODM Mongoose
- **Integritas Data**: MongoDB ACID Multi-Document Transactions (`mongoose.startSession()`)
- **Keamanan**: Helmet, CORS, Express Rate Limit, Cookie-Parser
- **Email Service**: Nodemailer (Gmail SMTP) & Mailtrap SDK

### Kontrak Bersama (`shared/`)
- Monorepo TypeScript Interfaces & Zod Schemas bersama (`@shared/*`) untuk menjamin keselarasan tipe data (*Type-safety*) antara Frontend dan Backend.

---

## 📁 Struktur Direktori

```text
DuitQ/
├── backend/                  # REST API Express.js + MongoDB
│   ├── src/
│   │   ├── config/           # Database, SMTP Mailer, & Environment Config
│   │   ├── controllers/      # HTTP Request Handlers
│   │   ├── middlewares/      # Auth (JWT), Rate Limiter, Zod Validation, Error Handler
│   │   ├── models/           # Mongoose Document Models
│   │   ├── routes/           # Router Express (/api/v1/...)
│   │   ├── services/         # Logika Bisnis & ACID Transactions
│   │   ├── app.ts            # Konfigurasi Express & CORS
│   │   └── server.ts         # Inisialisasi Server
│   ├── .env.example          # Template konfigurasi backend
│   └── tsconfig.json
├── frontend/                 # Next.js App Router Mobile Web
│   ├── src/
│   │   ├── app/              # Halaman App Router ((auth), (main), manifest.ts)
│   │   ├── components/       # UI Components, Charts, Transactions Quick-Add
│   │   ├── hooks/            # Custom React Query & Auth Hooks
│   │   └── lib/              # Axios API Client & Currency Helpers
│   ├── .env.example          # Template konfigurasi frontend
│   └── tsconfig.json
├── shared/                   # Skema Zod & Type Definitions Bersama
│   └── types/                # User, Transaction, FundingSource, StorageSpace, Receivable
├── prd/                      # Dokumen Spesifikasi Produk (PRD)
├── .gitignore                # Proteksi Git terhadap credential & environment files
└── README.md                 # Dokumentasi proyek
```

---

## ⚙️ Panduan Menjalankan di Lokal (Development)

### Prasyarat
- [Node.js](https://nodejs.org/) versi `>= 20.0.0`
- Akun atau instans [MongoDB](https://www.mongodb.com/) (Lokal atau MongoDB Atlas)

### 1. Clone Repositori
```bash
git clone https://github.com/username/duitq.git
cd duitq
```

### 2. Konfigurasi Backend
1. Masuk ke folder backend:
   ```bash
   cd backend
   npm install
   ```
2. Buat file `.env` dari template:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan nilai di `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/duitq?retryWrites=true&w=majority
   JWT_SECRET=super_secret_jwt_key_duitq_change_me_in_production
   FRONTEND_URL=http://localhost:3000

   # Konfigurasi Gmail SMTP
   EMAIL_PROVIDER=gmail
   SMTP_SERVICE=gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=emailanda@gmail.com
   SMTP_PASS=app_password_google_16_karakter
   SMTP_FROM="DuitQ <emailanda@gmail.com>"
   ```
4. Jalankan server backend:
   ```bash
   npm run dev
   ```
   *Backend aktif di `http://localhost:5001` (Health check: `http://localhost:5001/api/v1/health`)*

### 3. Konfigurasi Frontend
1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Buat file `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Isi nilai `NEXT_PUBLIC_API_URL`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
   ```
4. Jalankan Next.js:
   ```bash
   npm run dev
   ```
   *Frontend aktif di `http://localhost:3000`*

---

## 🌐 Panduan Deployment ke Production

### Arsitektur Rekomendasi
- **Frontend**: [Vercel](https://vercel.com/) / [Cloudflare Pages](https://pages.cloudflare.com/)
- **Backend**: [Railway](https://railway.app/) / [Render](https://render.com/) / VPS Linux
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (M0 Free Tier atau Dedicated)

### 1. Menyiapkan Backend (misal di Railway/Render)
1. Hubungkan repositori GitHub Anda.
2. Tentukan **Root Directory**: `backend`.
3. Build Command: `npm run build`
4. Start Command: `npm run start`
5. Atur **Environment Variables** di dashboard platform:
   - `NODE_ENV`: `production`
   - `PORT`: `5001` (atau sesuaikan dengan variabel `$PORT` penyedia)
   - `MONGODB_URI`: *Connection string MongoDB Atlas Anda*
   - `JWT_SECRET`: *String acak unik minimal 32 karakter (generate via `openssl rand -hex 32`)*
   - `FRONTEND_URL`: Domain frontend Anda (contoh: `https://duitq.vercel.app`)
   - `COOKIE_SAME_SITE`: `none` *(Wajib jika domain backend dan frontend berbeda platform)*
   - `EMAIL_PROVIDER`: `gmail`
   - `SMTP_USER` & `SMTP_PASS`: Kredensial App Password Gmail Anda

### 2. Menyiapkan Frontend (misal di Vercel)
1. Hubungkan repositori GitHub yang sama ke Vercel.
2. Tentukan **Root Directory**: `frontend`.
3. Framework Preset: **Next.js**.
4. Atur **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: URL backend production Anda (contoh: `https://api-duitq.up.railway.app/api/v1`).
5. Klik **Deploy**.

---

## 🔒 Keamanan & Praktik Terbaik

- **Zero Secret Leakage**: File `.env` dilindungi oleh [.gitignore](.gitignore) di level root dan sub-folder sehingga rahasia database dan token email tidak akan pernah terunggah ke Git.
- **Production Guard**: Backend secara otomatis menolak inisialisasi jika mendeteksi penggunaan `JWT_SECRET` default saat `NODE_ENV=production`.
- **CORS Multi-Domain**: Backend dapat menerima beberapa domain frontend sekaligus dengan memisahkan alamat URL menggunakan tanda koma pada `FRONTEND_URL`.

---

## 📄 Lisensi

Proyek ini dibuat dan dikembangkan untuk keperluan pengelolaan keuangan pribadi minimalis.
Didistribusikan di bawah lisensi [MIT](LICENSE).
