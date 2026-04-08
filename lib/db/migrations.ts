import { getDb } from './client';

export const runMigrations = (): void => {
  const db = getDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS super_admin (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS guru (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nama TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS kelas (
      id TEXT PRIMARY KEY,
      nama_kelas TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS siswa (
      id TEXT PRIMARY KEY,
      nisn TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      kelas_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES guru(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ujian (
      id TEXT PRIMARY KEY,
      kode_ujian TEXT UNIQUE NOT NULL,
      judul TEXT NOT NULL,
      durasi INTEGER NOT NULL DEFAULT 60,
      jumlah_opsi INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'nonaktif' CHECK(status IN ('aktif', 'nonaktif')),
      show_result INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES guru(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ujian_kelas (
      id TEXT PRIMARY KEY,
      ujian_id TEXT NOT NULL,
      kelas_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (ujian_id) REFERENCES ujian(id) ON DELETE CASCADE,
      FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
      UNIQUE (ujian_id, kelas_id)
    );

    CREATE TABLE IF NOT EXISTS soal (
      id TEXT PRIMARY KEY,
      ujian_id TEXT NOT NULL,
      teks_soal TEXT NOT NULL,
      gambar_url TEXT,
      jawaban_benar TEXT NOT NULL,
      pengecoh_1 TEXT NOT NULL,
      pengecoh_2 TEXT NOT NULL,
      pengecoh_3 TEXT,
      pengecoh_4 TEXT,
      urutan INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (ujian_id) REFERENCES ujian(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hasil_ujian (
      id TEXT PRIMARY KEY,
      siswa_id TEXT NOT NULL,
      ujian_id TEXT NOT NULL,
      nilai REAL NOT NULL DEFAULT 0,
      jumlah_benar INTEGER NOT NULL DEFAULT 0,
      jumlah_salah INTEGER NOT NULL DEFAULT 0,
      waktu_mulai TEXT NOT NULL,
      waktu_selesai TEXT,
      seed_soal INTEGER NOT NULL,
      seed_opsi INTEGER NOT NULL,
      is_submitted INTEGER NOT NULL DEFAULT 0,
      tab_switch_count INTEGER NOT NULL DEFAULT 0,
      fullscreen_exit_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
      FOREIGN KEY (ujian_id) REFERENCES ujian(id) ON DELETE CASCADE,
      UNIQUE (siswa_id, ujian_id)
    );

    CREATE TABLE IF NOT EXISTS jawaban_siswa (
      id TEXT PRIMARY KEY,
      siswa_id TEXT NOT NULL,
      ujian_id TEXT NOT NULL,
      soal_id TEXT NOT NULL,
      jawaban_pilihan TEXT NOT NULL,
      urutan_soal INTEGER NOT NULL,
      urutan_opsi TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
      FOREIGN KEY (ujian_id) REFERENCES ujian(id) ON DELETE CASCADE,
      FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'guru', 'siswa')),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS anti_cheating_log (
      id TEXT PRIMARY KEY,
      hasil_ujian_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_time TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (hasil_ujian_id) REFERENCES hasil_ujian(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS identitas_sekolah (
      id TEXT PRIMARY KEY,
      nama_sekolah TEXT NOT NULL,
      npsn TEXT,
      alamat TEXT,
      logo_url TEXT,
      telepon TEXT,
      email TEXT,
      website TEXT,
      kepala_sekolah TEXT,
      tahun_ajaran TEXT NOT NULL,
      setup_wizard_completed INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'guru', 'siswa')),
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas_id);
    CREATE INDEX IF NOT EXISTS idx_ujian_status ON ujian(status);
    CREATE INDEX IF NOT EXISTS idx_soal_ujian ON soal(ujian_id);
    CREATE INDEX IF NOT EXISTS idx_hasil_siswa ON hasil_ujian(siswa_id);
    CREATE INDEX IF NOT EXISTS idx_hasil_ujian ON hasil_ujian(ujian_id);
    CREATE INDEX IF NOT EXISTS idx_jawaban_siswa_ujian ON jawaban_siswa(siswa_id, ujian_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
  `);
  
  console.log('[DB] Migrations completed successfully');
};

export const checkDatabaseInitialized = (): boolean => {
  const db = getDb();
  const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='identitas_sekolah'").get();
  return result !== undefined;
};

export const getSetupStatus = (): { initialized: boolean; hasSuperAdmin: boolean; hasSchool: boolean } => {
  const db = getDb();
  
  const hasTables = checkDatabaseInitialized();
  
  const superAdminCount = hasTables ? db.prepare('SELECT COUNT(*) as count FROM super_admin').get() as { count: number } : { count: 0 };
  const schoolCount = hasTables ? db.prepare('SELECT COUNT(*) as count FROM identitas_sekolah').get() as { count: number } : { count: 0 };
  
  return {
    initialized: hasTables,
    hasSuperAdmin: superAdminCount.count > 0,
    hasSchool: schoolCount.count > 0,
  };
};