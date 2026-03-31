# PRODUCT REQUIREMENTS DOCUMENT (PRD) - v3.1

**Nama Aplikasi:** Cerdas-CBT (Computer Based Test)
**Penulis:** EAS Creative Studio
**Kontak Developer:** eas.creative.studio@gmail.com
**Versi:** 3.1.0
**Tanggal:** 31 Maret 2026
**Status:** Final - Fase 1 (Online Mode) - Clarified

---

## 1. Ringkasan Proyek

**Cerdas-CBT** adalah aplikasi ujian berbasis web (Next.js) untuk memfasilitasi guru dalam manajemen soal, manajemen data siswa, dan pelaksanaan ujian pilihan ganda secara *real-time*. Aplikasi ini mendukung **mobile-first** design dengan target **200 concurrent users**.

### 1.1. Development Phases

| Fase | Mode | Status | Timeline |
|------|------|--------|----------|
| **Fase 1** | Online (Supabase + Vercel) | **Active** | 4-6 minggu |
| **Fase 2** | Offline (Docker + PostgreSQL) | Future | Setelah Fase 1 stabil |

### 1.2. Tech Stack (Fase 1)
* **Framework:** Next.js 14+ (App Router)
* **Hosting:** Vercel (auto-deploy dari GitHub)
* **Database:** Supabase PostgreSQL (managed)
* **Storage:** Supabase Storage (gambar soal, 1GB free tier)
* **Auth:** Supabase Auth (built-in)
* **Real-time:** Supabase Realtime (WebSocket built-in)

---

## 2. Role & Autentikasi

### 2.1. Role Pengguna

| Role | Deskripsi |
|------|-----------|
| **Super-admin** | Akun predefined (fix) di sistem. Full access ke semua data: guru, siswa, ujian, audit log. Bertugas membuat akun guru baru. |
| **Guru** | Akun dibuat oleh super-admin. Dapat mengelola kelas, siswa, soal, dan ujian. |
| **Siswa** | Akun dibuat oleh guru. Dapat mengikuti ujian dengan kode ujian. |

### 2.2. Autentikasi Guru & Super-admin
- **Login:** Menggunakan username dan password.
- **Super-admin:** Akun predefined di `.env` atau konfigurasi sistem (single akun).
- **Guru:** Akun dibuat oleh super-admin melalui dashboard admin.

### 2.3. Autentikasi Siswa
- **Login:** Menggunakan NISN (username) dan password.
- **Password Awal:** Dibuat oleh guru saat registrasi siswa.
- **Ganti Password:** Siswa dapat mengganti password sendiri setelah login.
- **Reset Password:** Jika siswa lupa password, guru atau super-admin dapat mereset password.

### 2.4. Setup Wizard (First-Run)
- **Trigger:** Setup wizard muncul saat aplikasi pertama kali di-deploy (belum ada data sekolah).
- **Proses Setup:**
  1. Buat akun super-admin (username & password)
  2. Input identitas sekolah (nama, NPSN, alamat, logo, tahun ajaran)
  3. Konfirmasi setup
- **Setelah Setup:**
  - Wizard tidak muncul lagi (flag `setup_completed = true` di database)
  - Super-admin dapat login dan mulai membuat akun guru
- **Reset Setup:** Jika ingin reset setup, jalankan script migration reset atau manual DB update.

---

## 3. Fitur Utama (Kebutuhan Fungsional)

### 3.1. Modul Manajemen Kelas
* Guru dapat **membuat, mengubah, dan menghapus** kelas.
* Atribut Kelas: Nama Kelas (contoh: "X IPA 1").
* Siswa dapat di-assign ke satu kelas.

### 3.2. Modul Manajemen Siswa
* **Atribut Data Siswa:** Nama, NISN (Primary Key), Kelas, Password.
* **Input Data:**
  * Penambahan data secara manual melalui formulir antarmuka.
  * Impor data massal melalui berkas Excel (.xlsx).
  * **Format Excel Import Siswa:**
    | NISN | Nama | Password | Kelas |
    |------|------|----------|-------|
    | 1234567890 | Siswa 1 | pass123 | X IPA 1 |
    * Kolom **Kelas** diisi dengan **Nama Kelas** (contoh: "X IPA 1"), bukan UUID.
    * Sistem akan match `nama_kelas` dengan data kelas yang sudah ada.
    * Error jika `nama_kelas` tidak ditemukan → row di-skip dengan warning.
* **Logika Impor Data Siswa:**
  * **Option 1 (Menimpa):** Update data siswa yang sudah ada (berdasarkan NISN) + tambah siswa baru yang belum ada.
  * **Option 2 (Skip existing):** Hanya tambah siswa baru, siswa dengan NISN yang sudah ada di-skip.
* **Manajemen Akun:** Guru dapat melihat daftar siswa, mengubah informasi, atau menghapus akun siswa.
* **Reset Password:** Guru dapat mereset password siswa yang lupa.

### 3.3. Modul Guru - Manajemen Soal
* **Pengaturan Format Soal:** Guru menetapkan jumlah opsi jawaban per ujian (contoh: 4 opsi, 5 opsi). Jumlah opsi **konsisten** untuk semua soal dalam satu ujian.
* **Format Soal:**
  * Soal dapat mengandung **teks, gambar, dan rumus matematika** (KaTeX).
  * **KaTeX Syntax:** Inline math dengan `$...$`, block math dengan `$$...$$`.
  * Contoh: `$\sqrt{16} = 4$`, `$$\frac{a}{b} + \frac{c}{d}$$`
  * Guru dapat upload gambar untuk soal (Supabase Storage).
* **Input Soal Manual:** Formulir dengan kolom: Teks Soal (rich text + gambar + LaTeX), Jawaban Benar, dan Pengecoh (sesuai jumlah opsi).
* **Impor Soal Excel (.xlsx):**
  * **Format Kolom:** `Soal`, `Gambar_URL`, `Jawaban Benar`, `Pengecoh 1`, `Pengecoh 2`, `Pengecoh 3`, `Pengecoh 4`.
  * Kolom `Gambar_URL` opsional (isi dengan URL gambar dari Supabase Storage atau kosong).
  * Kolom `Pengecoh` yang tidak digunakan (misal: Pengecoh 4 untuk ujian 4 opsi) dapat dikosongkan.
  * **LaTeX/Math Formula:** Gunakan format KaTeX dalam teks soal, contoh: `$\sqrt{16}$` atau `$$\frac{a}{b}$$`.
* **Revisi Soal:** Guru dapat mengubah soal **hanya jika ujian dalam status nonaktif**.

### 3.4. Modul Guru - Manajemen Ujian
* **Pengaturan Sesi Ujian:**
  * Judul ujian.
  * Durasi pengerjaan (dalam menit).
  * Jumlah opsi jawaban ( konsisten untuk semua soal).
  * Assign ke **multiple kelas** (bisa lebih dari satu kelas).
  * Status ujian: **Aktif/Nonaktif** (toggle).
  * Pengaturan visibility hasil siswa: **Tampilkan nilai akhir** atau **Sembunyikan**.
  * **Tidak ada deadline global** - ujian bisa dikerjakan kapan saja selama status aktif.
* **Kode Ujian:** Setiap ujian memiliki kode unik (join code) yang siswa gunakan untuk masuk.
* **Duplikasi Ujian:** Guru dapat duplikat ujian untuk membuat ujian baru dengan soal yang sama.
* **Hapus Ujian:** Tidak bisa hapus ujian jika ada siswa yang sedang mengerjakan (locked).

### 3.5. Modul Guru - Dashboard
* **Dashboard Ujian:** Daftar ujian yang dibuat, statistik hasil, dan riwayat.
* **Dashboard Siswa:** Daftar siswa per kelas, riwayat nilai, statistik.
* **Monitoring Real-time:** Nilai siswa muncul real-time saat siswa submit (WebSocket/polling).
* **Export Hasil:**
  * Export ke **Excel (.xlsx)** - detail per siswa.
  * Export ke **PDF** - untuk cetak.
* **Statistik Per Soal:** Jumlah benar/salah per soal (basic).

### 3.5.1. Modul Konfigurasi Identitas Sekolah (Super-admin & Guru)
* **Akses:** Menu konfigurasi tersedia di dashboard super-admin dan guru.
* **Atribut Identitas Sekolah:**
  * Nama Sekolah (contoh: "SMA Negeri 1 Jakarta")
  * NPSN (Nomor Pokok Sekolah Nasional)
  * Alamat Sekolah
  * Logo Sekolah (upload gambar, opsional)
  * Nomor Telepon (opsional)
  * Email Sekolah (opsional)
  * Website Sekolah (opsional)
  * Kepala Sekolah (nama, opsional)
  * Tahun Ajaran (contoh: "2025/2026")
* **Tampilan:**
  * Identitas sekolah akan ditampilkan di:
    - Header halaman login (siswa, guru, super-admin)
    - Header dashboard (semua role)
    - Halaman ujian siswa (header)
    - Header hasil ujian dan export PDF
  * Logo **Kemendikdasmen** ditampilkan di halaman login dan dashboard (fixed, tidak bisa diubah).
* **Logo Default:**
  * Logo Kemendikdasmen (`logo_kemendikdasmen.svg`) wajib ditampilkan di:
    - Halaman login siswa
    - Halaman login guru/super-admin
    - Header dashboard semua role
    - Halaman ujian siswa

### 3.6. Modul Siswa - Ujian
* **Masuk Ujian:** Siswa memasukkan kode ujian (join code) untuk masuk ke sesi ujian.
* **Timer:**
  * Timer mulai saat siswa klik tombol **"Mulai Ujian"**.
  * Timer berjalan di server-side.
  * Jika siswa refresh halaman, timer tetap berjalan (lanjut).
* **Layout Soal:** Satu soal per halaman dengan navigator.
* **Navigator Soal:**
  * Daftar nomor soal untuk loncat ke soal tertentu.
  * Indikator status: soal sudah dijawab / belum dijawab.
* **Pengacakan:**
  * Urutan soal diacak per siswa (randomized).
  * Urutan opsi jawaban diacak per siswa.
  * Urutan konsisten jika siswa refresh (seed disimpan di `hasil_ujian.seed_soal` & `hasil_ujian.seed_opsi`).
  * Seed generated saat siswa klik "Mulai Ujian", stored in DB for recovery.
* **Auto-save:** Jawaban tersimpan real-time setiap kali siswa memilih jawaban (server-side).
* **Warning Waktu:**
  * Popup warning muncul saat **sisa waktu ≤ 10% dari durasi ujian** (contoh: ujian 60 min → warning pada 6 min remaining).
  * Timer berubah warna (merah) saat waktu warning threshold.
  * Timer display format: `MM:SS` (contoh: `05:30`).
* **Pengumpulan:**
  * Submit manual dengan tombol "Kirim Jawaban".
  * Auto-submit jika waktu habis.
  * Siswa hanya bisa submit **1 kali** (tidak bisa submit ulang).
* **Anti-cheating:**
  * **Fullscreen mode:** Ujian harus dalam fullscreen, keluar fullscreen = warning.
  * **Deteksi tab switch:** Sistem mencatat jika siswa switch tab/window.

### 3.7. Modul Siswa - Hasil
* Setelah submit, siswa melihat **nilai akhir** (jika guru mengaktifkan visibility).
* Siswa tidak melihat jawaban benar/salah (hanya nilai).

---

## 4. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Internet putus saat ujian | Tampilkan error message, jawaban yang sudah tersimpan tetap aman di server. Siswa harus reconnect untuk melanjutkan. |
| Refresh halaman saat ujian | Timer lanjut (server-side), jawaban tersimpan, urutan soal konsisten (seed dari DB) |
| Submit berkali-kali | Hanya 1x submit diperbolehkan |
| Hapus ujian saat siswa mengerjakan | Locked - tidak bisa hapus |
| Edit soal saat ujian aktif | Tidak bisa edit - ujian harus nonaktif |
| Upload Excel gagal | Tampilkan error detail, data tidak berubah |
| Import Excel: Kelas tidak ditemukan | Error per row, siswa dengan kelas tidak valid di-skip dengan warning |

---

## 5. Kebutuhan Antarmuka Pengguna (UI/UX)

> **Detail Design System:** Lihat dokumentasi lengkap di `design_system.md`

### 5.1. Tech Stack UI
* **Framework:** Next.js 14+ (App Router)
* **Styling:** Tailwind CSS
* **UI Components:** Shadcn UI
* **Icons:** Lucide React
* **Math Rendering:** KaTeX (CDN: `https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js`)
* **Theme:** Light mode only

### 5.2. Tipografi & Warna
* **Font:** Inter (Google Fonts)
* **Background:** `bg-gray-50` (#F9FAFB)
* **Surface:** `bg-white` (#FFFFFF)
* **Primary:** `bg-blue-600` (#2563EB)
* **Text Primary:** `text-gray-900` (#111827)
* **Text Secondary:** `text-gray-500` (#6B7280)

### 5.3. Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (h-16, bg-white, border-b)                          │
├──────────────┬──────────────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT (bg-gray-50, p-8)              │
│  (w-64)      │                                              │
│  bg-white    │  - Page Header                               │
│  border-r    │  - Stats Grid (4 columns)                    │
│              │  - Content Cards                             │
└──────────────┴──────────────────────────────────────────────┘
```

### 5.4. Responsiveness
* **Mobile-first:** Prioritas tampilan mobile, siswa akan menggunakan ponsel.
* **Responsive:** UI responsif untuk desktop, tablet, dan smartphone.
* **Layout Soal:** Satu soal per halaman dengan navigator nomor soal.

### 5.5. Logo & Branding
* **Logo Kemendikdasmen:** Wajib ditampilkan di:
  - Halaman login siswa (posisi: header atau sidebar)
  - Halaman login guru/super-admin (posisi: header atau sidebar)
  - Header dashboard semua role
  - Halaman ujian siswa (header)
* **File Logo:** `logo_kemendikdasmen.svg` (disertakan dalam project)
* **Logo Sekolah:** Opsional, ditampilkan berdampingan dengan logo Kemendikdasmen jika dikonfigurasi.
* **Penempatan Logo:** Logo berada di sisi kiri header, diikuti dengan nama sekolah.

---

## 6. Spesifikasi Teknis

### 6.1. Framework & Platform (Fase 1)
* **Framework:** Next.js 14+ (App Router).
* **Styling:** Tailwind CSS.
* **UI Components:** Shadcn UI.
* **Icons:** Lucide React.
* **Math Rendering:** KaTeX (CDN, fast LaTeX rendering).
* **Hosting:** Vercel (auto-deploy dari GitHub).
* **Database:** Supabase PostgreSQL (managed, free tier 512MB).
* **Storage:** Supabase Storage (1GB free tier untuk gambar soal).
* **Auth:** Supabase Auth (built-in, free tier 50K users).
* **Real-time:** Supabase Realtime (WebSocket built-in).

### 6.2. Deployment (Fase 1 - Online)

```
GitHub Repository → Vercel Auto-deploy → Supabase (DB + Storage + Auth)
```

* Push ke GitHub → Vercel auto-build dan deploy.
* Database: Supabase PostgreSQL (free tier 512MB).
* Storage: Supabase Storage (free tier 1GB = ~2000 gambar @ 500KB).
* Auth: Supabase Auth (free tier 50K monthly active users).
* Access: `https://cbt-xxx.vercel.app`

**Biaya:**
- Vercel: Free (hobby project).
- Supabase: Free tier (cukup untuk 200 users, 500 soal bergambar).
- Total: **$0/bulan** untuk tahap awal.

### 6.3. Performance Target
* **Concurrent Users:** Target maksimal **200 siswa** ujian bersamaan.
* **Response Time:** < 500ms untuk API calls.
* **Image Load Time:** < 1 detik (CDN Supabase Storage).
* **Database Connection:** Connection pooling via Supabase.

### 6.4. Security
* **Password Hashing:** Supabase Auth (bcrypt default).
* **Anti-cheating:** Fullscreen mode + deteksi tab switch.
* **Audit Log:** Semua aktivitas dicatat (login, CRUD data, submit ujian).
* **CORS:** Whitelist untuk domain Vercel.
* **RLS (Row Level Security):** Supabase RLS policies untuk data isolation.

### 6.5. Future Plans (Fase 2 - Offline Mode)

Setelah Fase 1 stabil (3-6 bulan), akan dikembangkan offline mode:

```
Windows Installer → Docker Desktop → PostgreSQL + MinIO → Next.js App
```

* **Database:** PostgreSQL (Docker container, local).
* **Storage:** MinIO (S3-compatible, self-hosted).
* **Auth:** Custom auth (bcrypt).
* **Deployment:** Windows installer (Inno Setup + Docker).
* **Access:** `http://192.168.x.x:3000` (local network).

---

## 7. Entity Relationship (ERD Overview)

### 7.1. Entities

| Entity | Atribut Utama |
|--------|---------------|
| **super_admin** | id, username, password_hash |
| **guru** | id, username, password_hash, nama, created_by (super_admin_id) |
| **kelas** | id, nama_kelas, created_by (guru_id) |
| **siswa** | id, nisn (PK), nama, password_hash, kelas_id, created_by (guru_id) |
| **ujian** | id, kode_ujian (unique), judul, durasi, jumlah_opsi, status (aktif/nonaktif), show_result, created_by (guru_id) |
| **ujian_kelas** | id, ujian_id, kelas_id (relasi many-to-many) |
| **soal** | id, ujian_id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4 |
| **jawaban_siswa** | id, siswa_id, ujian_id, soal_id, jawaban_pilihan, waktu_submit |
| **hasil_ujian** | id, siswa_id, ujian_id, nilai, jumlah_benar, jumlah_salah, waktu_mulai, waktu_selesai |
| **audit_log** | id, user_id, role, action, timestamp, details |
| **identitas_sekolah** | id, nama_sekolah, npsn, alamat, logo_url, telepon, email, website, kepala_sekolah, tahun_ajaran, updated_by, updated_at |

### 7.2. Relasi
* guru → kelas (1:N, guru membuat kelas)
* kelas → siswa (1:N, siswa di satu kelas)
* guru → ujian (1:N, guru membuat ujian)
* ujian → ujian_kelas → kelas (N:M, ujian di multiple kelas)
* ujian → soal (1:N, soal dalam ujian)
* siswa → hasil_ujian (1:N, siswa ikut multiple ujian)
* siswa → jawaban_siswa (1:N, jawaban per soal)
* soal → jawaban_siswa (1:N, jawaban dari multiple siswa)

---

## 8. Fitur Tambahan (Nice-to-have / Future)

| Fitur | Prioritas | Status |
|-------|-----------|--------|
| Passing grade | Low | Future |
| Bobot per soal (weighted scoring) | Low | Future |
| Waktu rata-rata pengerjaan per soal | Low | Future |
| Backup/restore data | Low | Future |
| Retensi data policy | Low | Future |

---

## 9. Glossary

| Istilah | Definisi |
|---------|----------|
| NISN | Nomor Induk Siswa Nasional - identitas unik siswa |
| NPSN | Nomor Pokok Sekolah Nasional - identitas unik sekolah |
| Join Code | Kode unik untuk siswa masuk ke sesi ujian |
| Pengecoh | Opsi jawaban yang tidak benar (distractor) |
| Proper Case | Format teks dengan huruf kapital di awal kata |
| Seed | Nilai tetap untuk randomization yang konsisten |
| Kemendikdasmen | Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi |

---

## 10. Referensi

### 10.1. External Resources
* Next.js Documentation: https://nextjs.org/docs
* Supabase Documentation: https://supabase.com/docs
* Supabase Storage: https://supabase.com/docs/guides/storage
* Supabase Auth: https://supabase.com/docs/guides/auth
* Vercel Documentation: https://vercel.com/docs
* KaTeX Documentation: https://katex.org/
* Inter Font: https://fonts.google.com/specimen/Inter
* Tailwind CSS: https://tailwindcss.com/docs
* Shadcn UI: https://ui.shadcn.com

### 10.2. Project Documentation
* `design_system.md` - UI/UX Design System Specification
* `database_schema.md` - Database Schema & ERD
* `api_endpoints.md` - REST API Specification
* `deployment_config.md` - Deployment Configuration (Fase 1)

---

## 11. Asset Files

| File | Deskripsi | Lokasi |
|------|-----------|--------|
| `logo_kemendikdasmen.svg` | Logo Kemendikdasmen untuk header dan login | `/public/images/logo_kemendikdasmen.svg` |

---

**Document Status:** ✅ Final v3.1 - Fase 1 (Online Mode) Clarified & Ready for Development.