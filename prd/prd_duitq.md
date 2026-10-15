# Product Requirements Document (PRD): DuitQ — Aplikasi Web Mobile Manajemen Keuangan Pribadi

| Atribut Dokumen | Detail Spesifikasi |
| :--- | :--- |
| **Nama Produk** | DuitQ |
| **Platform Target** | Mobile-First Web Application (Responsive Web / Progressive Web App) |
| **Frontend Stack** | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query (React Query), Recharts |
| **Backend Stack** | Express.js, TypeScript, Mongoose ODM, Zod, JWT (`HttpOnly` Cookie), Nodemailer / Resend |
| **Database Utama** | MongoDB (Replica Set / MongoDB Atlas dengan dukungan Multi-Document ACID Transactions) |
| **Status Dokumen** | Spesifikasi Produk & Teknis v1.1 |
| **Fokus Desain** | Minimalis, Fungsional, Cepat, dan Tersinkronisasi Penuh |

## 1. Ringkasan Eksekutif: DuitQ Menyatukan Pencatatan Kas, Ruang Anggaran, dan Piutang dalam Satu Aplikasi Web Mobile Minimalis

**DuitQ** adalah aplikasi manajemen keuangan pribadi berbasis web yang dirancang khusus untuk pengalaman layar ponsel (*mobile-first web application*) menggunakan arsitektur **Next.js (TypeScript)** di sisi *frontend* dan **Express.js (TypeScript) + MongoDB** di sisi *backend*. Aplikasi ini menjawab permasalahan umum pengguna yang kesulitan melacak arus kas akibat terpisahnya catatan rekening bank, alokasi anggaran harian (seperti uang makan), dan catatan piutang.

DuitQ mengintegrasikan empat pilar utama dalam satu antarmuka minimalis yang saling tersinkronisasi secara otomatis:
1. **Sumber Dana (*Funding Sources*)**: Representasi tempat uang disimpan secara nyata (misalnya Rekening BCA, Dompet Tunai, GoPay, OVO).
2. **Ruang Penyimpanan Kustom (*Custom Pockets / Spaces*)**: Wadah alokasi atau kategori khusus buatan pengguna (misalnya "Uang Makan", "Tagihan Kos", "Dana Liburan") yang memiliki catatan uang masuk dan uang keluar tersendiri.
3. **Mesin Transaksi & Dashboard Tersinkronisasi**: Setiap pencatatan uang masuk dan keluar memperbarui saldo Sumber Dana, Ruang Penyimpanan, serta grafik rincian di Dashboard secara *real-time*.
4. **Modul Piutang Opsional**: Fitur yang dapat diaktifkan sesuai kebutuhan untuk mencatat piutang yang langsung memotong atau menambah saldo Sumber Dana saat piutang diberikan maupun dilunasi.

## 2. Arsitektur Teknis: Sinergi Next.js, Express.js, dan MongoDB dengan TypeScript End-to-End

Pemisahan *frontend* (**Next.js**) dan *backend REST API* (**Express.js**) dengan **TypeScript** memberikan keamanan tipe data (*type safety*) yang ketat, terutama saat memproses angka nominal uang dan relasi antar dokumen MongoDB.

| Lapisan (*Layer*) | Teknologi & Library Utama | Peran dalam Sistem DuitQ |
| :--- | :--- | :--- |
| **Frontend Web Mobile** | Next.js 14/15 (App Router) + TypeScript | Merender antarmuka *mobile-first*, mengelola navigasi halaman, mendukung PWA (*manifest* & *service worker*), serta menangani halaman publik seperti `/reset-password`. |
| **State & Sinkronisasi UI** | TanStack Query (React Query) + Zustand | Mengelola *caching* data API dan melakukan *automatic query invalidation* pada Sumber Dana, Ruang Penyimpanan, Piutang, dan Grafik Dashboard setiap kali transaksi baru disimpan. |
| **Styling & Grafik** | Tailwind CSS + Recharts + Lucide Icons | Membangun komponen minimalis berukuran ramah ibu jari (*thumb-zone*) dan grafik interaktif yang ringan di perangkat mobile. |
| **Backend REST API** | Express.js + TypeScript | Menjalankan logika bisnis keuangan, middleware autentikasi JWT, *rate limiting*, serta orkestrasi transaksi database. |
| **Validasi & Keamanan** | Zod + Bcrypt + Helmet + CORS | Memvalidasi *payload* request di sisi *frontend* dan *backend* dengan skema TypeScript yang seragam, serta mengamankan *endpoint* Express. |
| **Database & ODM** | MongoDB + Mongoose (TypeScript) | Menyimpan dokumen per `userId` dan mengeksekusi **ACID Multi-Document Transactions** (`mongoose.startSession()`) agar mutasi saldo selalu konsisten. |
| **Layanan Email** | Nodemailer (SMTP) / Resend SDK | Mengirimkan email berisi tautan URL unik (`https://duitq.app/reset-password?token=...`) untuk fitur Lupa Kata Sandi. |

### Struktur Direktori Proyek (*Monorepo / Fullstack Workspace*)
```text
duitq/
├── shared/                      # Skema Zod & TypeScript Interfaces bersama
│   └── types/                   # Definisi tipe Transaction, FundingSource, StorageSpace, Receivable
├── backend/                     # Express.js + TypeScript REST API
│   ├── src/
│   │   ├── config/              # Koneksi MongoDB, SMTP Email, & Environment Variables
│   │   ├── middlewares/         # auth.middleware.ts (JWT), validate.middleware.ts (Zod), error.middleware.ts
│   │   ├── models/              # Mongoose Schemas (User, FundingSource, StorageSpace, Transaction, Receivable)
│   │   ├── controllers/         # Handler HTTP per modul
│   │   ├── services/            # Logika bisnis & MongoDB ACID Transaction Session
│   │   ├── routes/              # Definisi rute Express (/api/v1/...)
│   │   └── app.ts               # Konfigurasi utama Express
│   └── tsconfig.json
└── frontend/                    # Next.js (App Router) + TypeScript Mobile Web
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/          # /login, /register, /forgot-password, /reset-password
    │   │   ├── (main)/          # /dashboard, /wallets, /spaces, /receivables, /settings
    │   │   └── manifest.ts      # Konfigurasi PWA Mobile
    │   ├── components/
    │   │   ├── ui/              # Komponen dasar minimalis (BottomSheet, Card, Button, Input)
    │   │   ├── charts/          # DonutChart Ruang Penyimpanan & BarChart Arus Kas
    │   │   └── transactions/    # QuickAddTransactionSheet.tsx
    │   ├── hooks/               # Custom hooks TanStack Query (useDashboard, useTransactions, dll.)
    │   └── lib/                 # Axios/Fetch instance dengan kredensial Cookie/JWT
    └── tsconfig.json
```

## 3. Arsitektur Logika Keuangan: Setiap Transaksi Menyinkronkan Sumber Dana, Ruang Penyimpanan, dan Piutang Secara Otomatis

Agar data keuangan selalu akurat dan tidak terjadi selisih perhitungan (*discrepancy*), *service layer* pada **Express.js** menerapkan aturan sinkronisasi mutasi satu pintu (*Single Source of Truth*) di atas database MongoDB.

| Jenis Aktivitas Keuangan | Dampak pada Sumber Dana (Misal: Rekening BCA) | Dampak pada Ruang Penyimpanan (Misal: Uang Makan) | Dampak pada Modul Piutang | Dampak pada Grafik Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **Uang Masuk Umum** (Misal: Gaji Bulanan masuk ke Rekening BCA) | Saldo Rekening BCA **bertambah** sebesar nominal masuk | Opsional: Dapat langsung dialokasikan ke Ruang tertentu atau masuk ke *Saldo Bebas* | Tidak berdampak | Menambah total Pemasukan & Saldo Bersih |
| **Alokasi / Masuk ke Ruang Penyimpanan** (Misal: Isi Ruang "Uang Makan" dari BCA) | Saldo total BCA tetap (atau berpindah status menjadi dana teralokasi) | Saldo Ruang "Uang Makan" **bertambah** (`totalIn` & `currentBalance` naik) | Tidak berdampak | Memperbarui porsi alokasi Ruang Penyimpanan |
| **Uang Keluar pada Ruang Penyimpanan** (Misal: Beli makan siang dari Ruang "Uang Makan" pakai BCA) | Saldo Rekening BCA **berkurang** otomatis | Saldo Ruang "Uang Makan" **berkurang** otomatis (`totalOut` naik, `currentBalance` turun) | Tidak berdampak | Menambah total Pengeluaran & rincian grafik "Uang Makan" |
| **Pindah Dana Antar Sumber Dana** (Misal: Top-up GoPay dari Rekening BCA) | Saldo BCA **berkurang**, Saldo GoPay **bertambah** | Tidak berdampak | Tidak berdampak | Saldo Bersih tetap; komposisi Sumber Dana diperbarui |
| **Pencatatan Piutang Baru** (Misal: Meminjamkan uang ke Budi via Rekening BCA) | Saldo Rekening BCA **berkurang** sebesar pinjaman | Opsional: Bisa ditautkan ke Ruang tertentu jika diperlukan | Saldo Piutang Aktif **bertambah** | Tercatat sebagai Aset Piutang & Arus Kas Keluar Piutang |
| **Pelunasan Piutang** (Misal: Budi membayar utang ke Rekening BCA) | Saldo Rekening BCA **bertambah** sebesar pembayaran | Opsional: Mengembalikan saldo Ruang terkait | Saldo Piutang Aktif **berkurang** / Lunas | Memperbarui grafik Piutang & Saldo Sumber Dana |

### Alur Sinkronisasi Frontend–Backend (Next.js + Express + MongoDB)
1. Pengguna menekan tombol simpan pada *Quick-Add Bottom Sheet* di **Next.js**.
2. **Express.js** menerima *payload*, memvalidasinya dengan **Zod**, lalu membuka sesi transaksi MongoDB (`const session = await mongoose.startSession()`).
3. Di dalam satu blok `session.withTransaction()`, Express menyimpan dokumen `Transaction`, memperbarui `currentBalance` pada `FundingSource`, memperbarui `totalIn`/`totalOut`/`currentBalance` pada `StorageSpace` (jika dipilih), serta memperbarui `Receivable` (jika terkait piutang).
4. Setelah Express mengembalikan status `201 Created`, **TanStack Query** di Next.js langsung memicu `queryClient.invalidateQueries({ queryKey: ['dashboard', 'funding-sources', 'storage-spaces', 'receivables'] })` sehingga seluruh kartu saldo dan grafik langsung tersinkronisasi tanpa *page reload*.

## 4. Spesifikasi Kebutuhan Fungsional: Tujuh Modul Inti Menjamin Kendali Penuh atas Arus Kas Pengguna

### Modul 4.1: Autentikasi & Isolasi Data Multi-User (Express + MongoDB)
Setiap pengguna memiliki akun pribadi dengan isolasi data penuh di server MongoDB.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **AUTH-01** | Registrasi Pengguna Baru | Pengguna mendaftar menggunakan Nama Lengkap, Email unik, dan Kata Sandi (minimal 8 karakter, kombinasi huruf dan angka). Express memvalidasi input menggunakan Zod dan memeriksa keunikan email di koleksi `users`. |
| **AUTH-02** | Enkripsi Kata Sandi | Kata sandi wajib di-*hash* menggunakan `bcrypt` (cost factor minimal 10) di Express sebelum disimpan ke MongoDB. |
| **AUTH-03** | Login & Manajemen Sesi JWT | Pengguna masuk dengan Email dan Kata Sandi. Express menerbitkan `accessToken` dan `refreshToken` yang disimpan di dalam `HttpOnly, Secure, SameSite=Lax Cookie` agar aman dari serangan XSS di browser mobile. |
| **AUTH-04** | Middleware Isolasi `userId` | Middleware `requireAuth` di Express menyuntikkan `req.user.id` bertipe ketat (TypeScript `Request` extension). Setiap *query* Mongoose wajib menyertakan filter `{ userId: req.user.id }`. |
| **AUTH-05** | Proteksi Rute Next.js | `middleware.ts` pada Next.js memeriksa keberadaan sesi autentikasi dan mengalihkan pengguna yang belum login dari rute privat (`/dashboard`, `/wallets`, `/spaces`, `/receivables`) ke `/login`. |

### Modul 4.2: Pemulihan Kata Sandi via Email URL (Forgot & Reset Password)
Memungkinkan pengguna memulihkan akses akun secara mandiri melalui tautan URL aman yang dikirim ke email terdaftar.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **PWD-01** | Permintaan Reset Kata Sandi | Pengguna memasukkan email pada halaman `/forgot-password` di Next.js. Express selalu mengembalikan respons generik ("Jika email terdaftar, tautan reset kata sandi telah dikirim") untuk mencegah *email enumeration*. |
| **PWD-02** | Pembuatan Token & Pengiriman URL | Express membuat token acak (`crypto.randomBytes(32).toString('hex')`), menyimpan *hash* SHA-256 token tersebut di koleksi `password_reset_tokens` dengan masa berlaku 15 menit (*MongoDB TTL Index*), dan mengirim email berisi URL Next.js: `${FRONTEND_URL}/reset-password?token=${rawToken}`. |
| **PWD-03** | Halaman Reset & Pembaruan Sandi | Halaman `/reset-password` di Next.js membaca *query parameter* `token` dan mengirim kata sandi baru ke `POST /api/v1/auth/reset-password`. Express memverifikasi *hash* token yang belum kedaluwarsa, memperbarui *passwordHash* pengguna, dan menghapus dokumen token reset (*one-time use*). |

### Modul 4.3: Manajemen Sumber Dana (*Funding Sources*)
Mengelola rekening bank, dompet digital (*e-wallet*), atau uang tunai milik pengguna yang saling tersinkronisasi.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **FND-01** | Pembuatan Sumber Dana | Pengguna dapat membuat Sumber Dana baru dengan atribut: Nama Sumber Dana (misal: "Rekening BCA", "Dompet Tunai", "GoPay"), Tipe (`BANK`, `EWALLET`, `CASH`, `OTHER`), Saldo Awal, serta Warna/Ikon. |
| **FND-02** | Sinkronisasi Mutasi Otomatis | Setiap pencatatan uang masuk ke Sumber Dana otomatis menambah `currentBalance`, dan uang keluar otomatis mengurangi `currentBalance` menggunakan operator atomik `$inc` di dalam sesi transaksi MongoDB. |
| **FND-03** | Transfer Antar Sumber Dana | Pengguna dapat memindahkan saldo dari Sumber Dana A (asal) ke Sumber Dana B (tujuan). Express mengurangi saldo Sumber Dana A dan menambah saldo Sumber Dana B secara atomik. |
| **FND-04** | Riwayat Mutasi per Sumber Dana | Menampilkan daftar seluruh uang masuk, uang keluar, transfer, dan transaksi piutang yang melibatkan Sumber Dana tersebut secara kronologis. |

### Modul 4.4: Pengelolaan Ruang Penyimpanan Kustom (*Custom Storage Spaces / Pockets*)
Memungkinkan pengguna membuat ruang/kantong khusus sebagai kategori anggaran yang memiliki catatan arus kas masuk dan keluar sendiri.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **SPC-01** | Pembuatan Ruang Kustom | Pengguna dapat menambahkan Ruang Penyimpanan secara kustom (misal: "Uang Makan", "Bensin & Transport", "Belanja Bulanan", "Dana Darurat") lengkap dengan target/batas anggaran opsional dan ikon minimalis. |
| **SPC-02** | Pencatatan Uang Masuk Ruang | Pengguna dapat mencatat uang masuk/alokasi ke dalam Ruang Penyimpanan (misal: menyisihkan Rp1.500.000 dari Gaji di Rekening BCA ke ruang "Uang Makan"). Nilai `totalIn` dan `currentBalance` pada ruang "Uang Makan" bertambah. |
| **SPC-03** | Pencatatan Uang Keluar Ruang | Pengguna dapat mencatat pengeluaran khusus di dalam Ruang Penyimpanan (misal: beli makan malam Rp35.000 dari ruang "Uang Makan" menggunakan Sumber Dana "Rekening BCA"). Saldo ruang "Uang Makan" dan saldo "Rekening BCA" berkurang secara serentak. |
| **SPC-04** | Ringkasan Status Ruang | Menampilkan total uang masuk ke ruang, total uang keluar dari ruang, dan sisa saldo ruang saat ini beserta *progress bar* persentase pemakaian. |

### Modul 4.5: Pencatatan Transaksi (Uang Masuk & Uang Keluar)
Inti pencatatan harian yang dirancang agar selesai dalam waktu kurang dari 10 detik.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **TRX-01** | Pencatatan Uang Masuk (*Income*) | Form input mencakup: Nominal, Judul/Keterangan (misal: "Gaji Bulanan"), Sumber Dana Tujuan (misal: "Rekening BCA"), Ruang Penyimpanan Tujuan (opsional), dan Tanggal/Waktu. |
| **TRX-02** | Pencatatan Uang Keluar (*Expense*) | Form input mencakup: Nominal, Judul/Keterangan, Sumber Dana yang Digunakan (misal: "Rekening BCA"), Ruang Penyimpanan yang Dikenai (misal: "Uang Makan"), dan Tanggal/Waktu. |
| **TRX-03** | Edit & Hapus Transaksi dengan Rekalkulasi | Jika pengguna mengubah nominal, mengganti Sumber Dana/Ruang, atau menghapus transaksi lama, *TransactionService* di Express wajib membalikkan (*rollback*) efek saldo lama sebelum menerapkan efek saldo baru di dalam satu sesi MongoDB. |

### Modul 4.6: Dashboard Utama & Grafik Perincian Tersinkronisasi
Pusat informasi visual di Next.js yang langsung mencerminkan perubahan dari setiap transaksi yang dicatat.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **DSH-01** | Kartu Ringkasan Saldo Utama | Menampilkan Total Saldo Gabungan seluruh Sumber Dana (dengan tombol sembunyikan nominal/privasi), Total Uang Masuk periode aktif, dan Total Uang Keluar periode aktif. |
| **DSH-02** | Grafik Distribusi Ruang Penyimpanan | Menggunakan komponen `ResponsiveContainer` + `PieChart` (Donut) dari **Recharts** untuk merinci proporsi pengeluaran dan sisa dana pada setiap Ruang Penyimpanan Kustom. |
| **DSH-03** | Grafik Perbandingan Arus Kas | Menggunakan `BarChart` / `AreaChart` dari **Recharts** untuk membandingkan Uang Masuk vs Uang Keluar secara harian, mingguan, atau bulanan. |
| **DSH-04** | Komposisi Sumber Dana & Piutang | Menampilkan daftar ringkas saldo tiap Sumber Dana beserta ringkasan total Piutang belum tertagih (jika fitur Piutang diaktifkan). |
| **DSH-05** | Sinkronisasi *Real-Time* & Filter | Setiap kali pengguna menambah/mengubah transaksi, TanStack Query menyegarkan data `GET /api/v1/dashboard/summary` secara instan. Mendukung filter rentang waktu (Bulan Ini, Bulan Lalu, Kustom). |

### Modul 4.7: Fitur Opsional Manajemen Piutang Tersinkronisasi
Modul khusus untuk mencatat uang pengguna yang dipinjam oleh pihak lain (piutang), yang bersifat opsional dan terhubung langsung dengan Sumber Dana.

| ID Kebutuhan | Fitur / Kemampuan | Aturan Bisnis & Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **RCV-01** | Sakelar Aktivasi Modul (*Optional Toggle*) | Pengguna dapat mengaktifkan atau menonaktifkan tampilan fitur Piutang (`enableReceivablesModule: boolean`). Saat dinonaktifkan, tab Piutang di *Bottom Navigation* Next.js disembunyikan agar antarmuka tetap minimalis. |
| **RCV-02** | Pencatatan Piutang Baru (*Disbursement*) | Mencatat Nama Peminjam, Nominal Piutang, Tanggal Pinjam, Tanggal Jatuh Tempo (opsional), Catatan, dan **Sumber Dana Asal** (misal: uang dipinjamkan dari "Rekening BCA"). Jika Sumber Dana dipilih, saldo Sumber Dana tersebut otomatis berkurang dan tercatat di riwayat transaksi. |
| **RCV-03** | Pencatatan Pembayaran / Cicilan Piutang | Mendukung pelunasan penuh maupun pembayaran bertahap (*partial payment*). Pengguna memilih **Sumber Dana Tujuan** tempat uang pelunasan diterima (misal: ditransfer balik ke "Rekening BCA"). Saldo Sumber Dana tujuan otomatis bertambah dan sisa piutang berkurang. |
| **RCV-04** | Sinkronisasi ke Perincian Keuangan | Menampilkan nilai "Total Piutang Aktif (Uang di Luar)" sebagai bagian dari rincian kekayaan pengguna di Dashboard sehingga pengguna tahu berapa uang cair di rekening dan berapa uang yang masih berupa piutang. |

## 5. Rancangan Skema Database MongoDB & TypeScript Interfaces (Mongoose)

Berikut adalah kontrak tipe data **TypeScript** dan struktur koleksi **MongoDB** yang digunakan pada *backend* Express.js.

### 5.1 Koleksi `users` (`IUser`)
```typescript
export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  preferences: {
    currency: 'IDR';
    enableReceivablesModule: boolean;
    hideBalanceDefault: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indeks MongoDB**: `{ email: 1 }` (*Unique*).

### 5.2 Koleksi `password_reset_tokens` (`IPasswordResetToken`)
```typescript
export interface IPasswordResetToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string; // SHA-256 hash dari token URL
  expiresAt: Date;   // Otomatis dihapus MongoDB saat lewat waktu
  used: boolean;
  createdAt: Date;
}
```
* **Indeks MongoDB**: `{ expiresAt: 1 }` dengan `{ expireAfterSeconds: 0 }` (*TTL Index*), serta `{ tokenHash: 1 }`.

### 5.3 Koleksi `funding_sources` (`IFundingSource` — Sumber Dana)
```typescript
export type FundingSourceType = 'BANK' | 'EWALLET' | 'CASH' | 'OTHER';

export interface IFundingSource {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;           // Misal: "Rekening BCA"
  type: FundingSourceType;
  initialBalance: number;
  currentBalance: number; // Tersinkronisasi otomatis setiap ada mutasi
  color: string;          // Hex color, misal "#0066AE"
  icon: string;           // Nama ikon Lucide
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indeks MongoDB**: `{ userId: 1, isArchived: 1 }`.

### 5.4 Koleksi `storage_spaces` (`IStorageSpace` — Ruang Penyimpanan Kustom)
```typescript
export interface IStorageSpace {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;                // Misal: "Uang Makan"
  description?: string;
  totalIn: number;             // Akumulasi uang masuk ke ruang ini
  totalOut: number;            // Akumulasi uang keluar dari ruang ini
  currentBalance: number;      // Sisa dana ruang (totalIn - totalOut)
  monthlyBudgetLimit?: number; // Opsional batas anggaran bulanan
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indeks MongoDB**: `{ userId: 1, isArchived: 1 }`.

### 5.5 Koleksi `transactions` (`ITransaction` — Catatan Mutasi & Sinkronisasi)
```typescript
export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'SPACE_ALLOCATION'
  | 'RECEIVABLE_OUT'
  | 'RECEIVABLE_IN';

export interface ITransaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  title: string;
  notes?: string;
  transactionDate: Date;
  sourceFundingId?: Types.ObjectId | null;      // Sumber dana yang berkurang (uang keluar/transfer/piutang keluar)
  destinationFundingId?: Types.ObjectId | null; // Sumber dana yang bertambah (uang masuk/transfer/pelunasan piutang)
  storageSpaceId?: Types.ObjectId | null;       // Ruang penyimpanan terkait (misal: "Uang Makan")
  spaceFlowType?: 'IN' | 'OUT' | null;          // Menentukan apakah menambah atau mengurangi saldo Ruang
  receivableId?: Types.ObjectId | null;         // Referensi ke dokumen Piutang jika terkait
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indeks MongoDB**: `{ userId: 1, transactionDate: -1 }`, `{ userId: 1, sourceFundingId: 1 }`, `{ userId: 1, destinationFundingId: 1 }`, `{ userId: 1, storageSpaceId: 1 }`.

### 5.6 Koleksi `receivables` (`IReceivable` — Piutang Opsional)
```typescript
export interface IRepaymentItem {
  _id: Types.ObjectId;
  amount: number;
  destinationFundingId: Types.ObjectId; // Sumber dana tempat uang pelunasan masuk
  transactionId: Types.ObjectId;        // Tautan ke dokumen transaksi RECEIVABLE_IN
  paidAt: Date;
  notes?: string;
}

export interface IReceivable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  debtorName: string;
  debtorContact?: string;
  title: string;
  initialAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  sourceFundingId?: Types.ObjectId | null; // Sumber dana saat uang dipinjamkan
  storageSpaceId?: Types.ObjectId | null;
  loanDate: Date;
  dueDate?: Date | null;
  repayments: IRepaymentItem[];
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indeks MongoDB**: `{ userId: 1, status: 1, dueDate: 1 }`.

## 6. Spesifikasi Endpoint REST API (Express.js + TypeScript)

Seluruh *endpoint* berada di bawah *prefix* `/api/v1` dan mengembalikan format JSON standar `{ success: boolean, data?: T, message?: string, errors?: any }`.

| Grup Modul | Method & Endpoint | Deskripsi Fungsi Utama di Express.js |
| :--- | :--- | :--- |
| **Autentikasi** | `POST /api/v1/auth/register` | Validasi Zod, hash password dengan `bcrypt`, buat user baru di MongoDB. |
| **Autentikasi** | `POST /api/v1/auth/login` | Verifikasi kredensial, terbitkan JWT di dalam `HttpOnly` cookie. |
| **Autentikasi** | `POST /api/v1/auth/logout` | Hapus `HttpOnly` cookie dan akhiri sesi pengguna. |
| **Autentikasi** | `GET /api/v1/auth/me` | Mengambil profil pengguna aktif beserta preferensi modul Piutang. |
| **Pemulihan Sandi** | `POST /api/v1/auth/forgot-password` | Buat token kriptografi, simpan hash ke MongoDB, kirim URL Next.js ke email. |
| **Pemulihan Sandi** | `POST /api/v1/auth/reset-password` | Verifikasi token dari URL dan perbarui password di MongoDB. |
| **Sumber Dana** | `GET /api/v1/funding-sources` | Ambil seluruh daftar Sumber Dana beserta `currentBalance` terkini. |
| **Sumber Dana** | `POST /api/v1/funding-sources` | Tambah Sumber Dana baru (misal: Rekening BCA) beserta saldo awal. |
| **Sumber Dana** | `PATCH /api/v1/funding-sources/:id` | Perbarui nama/warna/ikon Sumber Dana atau arsipkan. |
| **Ruang Penyimpanan** | `GET /api/v1/storage-spaces` | Ambil seluruh Ruang Penyimpanan Kustom beserta `totalIn`, `totalOut`, dan `currentBalance`. |
| **Ruang Penyimpanan** | `POST /api/v1/storage-spaces` | Buat Ruang Penyimpanan baru (misal: Uang Makan). |
| **Ruang Penyimpanan** | `GET /api/v1/storage-spaces/:id/transactions` | Ambil mutasi uang masuk dan keluar khusus pada ruang tersebut. |
| **Transaksi** | `POST /api/v1/transactions` | Catat uang masuk/keluar/pindah dana & sinkronkan saldo dalam 1 transaksi MongoDB. |
| **Transaksi** | `PUT /api/v1/transactions/:id` | Ubah transaksi, *rollback* efek saldo lama, dan terapkan efek saldo baru secara atomik. |
| **Transaksi** | `DELETE /api/v1/transactions/:id` | Hapus transaksi dan kembalikan (*revert*) saldo Sumber Dana & Ruang terkait. |
| **Dashboard** | `GET /api/v1/dashboard/summary` | Agregasi `$facet` MongoDB untuk total saldo, arus kas, rincian grafik Ruang, Sumber Dana, & Piutang. |
| **Piutang (Opsional)** | `PATCH /api/v1/users/preferences/receivables` | Toggle aktif/nonaktif modul Piutang (`enableReceivablesModule`). |
| **Piutang (Opsional)** | `POST /api/v1/receivables` | Catat piutang baru, potong `currentBalance` Sumber Dana asal, & buat dokumen `RECEIVABLE_OUT`. |
| **Piutang (Opsional)** | `POST /api/v1/receivables/:id/repay` | Catat pelunasan/cicilan, tambah `currentBalance` Sumber Dana tujuan, & buat dokumen `RECEIVABLE_IN`. |

## 7. Panduan Desain UI/UX Next.js: Antarmuka Mobile-First Minimalis & Fungsional

Karena DuitQ diakses sebagai **aplikasi mobile berbasis website**, *layout* utama pada Next.js (`app/(main)/layout.tsx`) menggunakan kontainer terpusat (`max-w-md mx-auto min-h-dvh bg-slate-50 relative pb-20 shadow-sm`) sehingga tampil persis seperti aplikasi *native* di layar ponsel maupun saat dibuka di browser desktop.

### 7.1 Struktur Navigasi Bawah (*Bottom Navigation Bar*)
Menggunakan maksimal 4 tab utama ditambah 1 tombol aksi cepat (*Floating/Center Action Button*) di tengah:
1. **Beranda (`/dashboard`)**: Ringkasan total saldo, grafik proporsi pengeluaran per Ruang, dan transaksi terakhir.
2. **Dompet & Ruang (`/wallets` & `/spaces`)**: Tab terpadu dengan *segmented control* di bagian atas untuk berpindah cepat antara **Sumber Dana** (Rekening BCA, Tunai, E-Wallet) dan **Ruang Penyimpanan** (Uang Makan, Transport, dll.).
3. **Tombol `[+]` (Catat Cepat)**: Membuka *Bottom Sheet Drawer* instan dari bawah layar untuk mencatat Uang Masuk, Uang Keluar, Pindah Dana, atau Alokasi Ruang tanpa berpindah halaman.
4. **Piutang (`/receivables`)** *(Muncul dinamis jika `enableReceivablesModule === true`, atau digantikan oleh tab Riwayat `/transactions`)*: Daftar piutang aktif, jatuh tempo, dan tombol "Catat Pelunasan".
5. **Profil (`/settings`)**: Pengaturan akun, sakelar fitur Piutang opsional, ubah kata sandi, dan keluar akun.

### 7.2 Sistem Warna Semantik & Tipografi (Tailwind CSS)
* **Permukaan & Kartu**: Latar belakang `bg-slate-50` (`#F8FAFC`) dengan kartu putih bersih `bg-white` (`#FFFFFF`), sudut membulat `rounded-2xl`, dan bayangan halus `shadow-xs border border-slate-100`.
* **Warna Aksen Semantik**:
  * **Hijau Emerald (`text-emerald-600` / `#10B981`)**: Indikator Uang Masuk, pertumbuhan saldo, dan pelunasan piutang diterima.
  * **Merah Rose (`text-rose-600` / `#F43F5E`)**: Indikator Uang Keluar dan peringatan ruang penyimpanan yang mendekati batas.
  * **Biru Royal (`bg-blue-600` / `#2563EB`)**: Identitas utama DuitQ, Sumber Dana, dan transfer internal.
  * **Kuning Amber (`text-amber-600` / `#F59E0B`)**: Indikator Piutang belum lunas / menunggu pembayaran.
* **Tipografi Angka**: Menggunakan `Plus Jakarta Sans` atau `Inter` melalui `next/font/google` dengan kelas utilitas `tabular-nums` agar nominal Rupiah (`Rp 1.500.000`) sejajar rapi.

## 8. Kebutuhan Non-Fungsional & Keamanan Sistem

| Kategori | Spesifikasi Teknis (Next.js + Express + MongoDB) |
| :--- | :--- |
| **Integritas Transaksi (ACID)** | Menyimpan nominal Rupiah sebagai bilangan bulat (`Number` integer tanpa desimal pecahan sen) dan mewajibkan penggunaan `mongoose.startSession()` + `session.withTransaction()` pada setiap mutasi yang menyentuh lebih dari satu koleksi. |
| **Performa & Responsivitas** | Menggunakan *MongoDB Aggregation Pipeline* (`$facet`) pada `GET /api/v1/dashboard/summary` agar seluruh data kartu dan grafik Dashboard terambil dalam 1 kali panggilan HTTP dengan waktu respons < 250 ms. |
| **Keamanan API & Auth** | Menerapkan `express-rate-limit` pada rute `/auth/login` dan `/auth/forgot-password` (maksimal 5 request / 15 menit), konfigurasi `cors({ origin: process.env.FRONTEND_URL, credentials: true })`, dan validasi input berlapis dengan **Zod**. |
| **Dukungan PWA Mobile** | Menyediakan `app/manifest.ts` di Next.js agar pengguna Android dan iOS dapat memasang **DuitQ** ke layar utama (*Add to Home Screen*) dengan mode `display: 'standalone'`. |

## 9. Peta Jalan Pengembangan (*Development Roadmap*)

1. **Fase 1 — Setup Workspace, Express Auth, & Forgot Password (Minggu 1–2)**:
   * Inisialisasi proyek `backend` (Express + TypeScript + Mongoose) dan `frontend` (Next.js App Router + TypeScript + Tailwind CSS).
   * Implementasi model `User` & `PasswordResetToken`, endpoint JWT Auth, serta pengiriman email URL Reset Password menggunakan Nodemailer/Resend.
2. **Fase 2 — Mesin Sinkronisasi Sumber Dana, Ruang Penyimpanan, & Transaksi (Minggu 3–4)**:
   * Pembuatan model dan endpoint CRUD untuk `FundingSource` (Rekening BCA, dll.) dan `StorageSpace` (Uang Makan, dll.).
   * Implementasi `TransactionService` di Express dengan *MongoDB Transaction Session* serta komponen *Quick-Add Bottom Sheet* di Next.js.
3. **Fase 3 — Dashboard Grafik Recharts & Modul Piutang Opsional (Minggu 5–6)**:
   * Pembuatan endpoint agregasi Dashboard dan komponen visualisasi grafik Recharts yang tersinkronisasi melalui TanStack Query.
   * Implementasi modul `Receivable` (Piutang baru, cicilan/pelunasan, sinkronisasi ke Sumber Dana) dan sakelar pengaktifan modul di halaman Pengaturan.
4. **Fase 4 — Optimasi Mobile Viewport, Pengujian End-to-End, & Deployment (Minggu 7)**:
   * Pengujian akurasi saldo pada skenario edit/hapus transaksi, konfigurasi PWA manifest, serta *deployment* (misalnya Frontend di Vercel dan Backend Express + MongoDB Atlas di Railway/Render/VPS).