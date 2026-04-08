import { getDb } from './client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const createInitialSuperAdmin = async (username: string, password: string): Promise<{ id: string; username: string } | null> => {
  const db = getDb();
  
  try {
    const existingAdmin = db.prepare('SELECT id FROM super_admin LIMIT 1').get();
    if (existingAdmin) {
      console.log('[Seed] Super admin already exists');
      return null;
    }
    
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    
    db.prepare(`
      INSERT INTO super_admin (id, username, password_hash)
      VALUES (?, ?, ?)
    `).run(id, username, passwordHash);
    
    console.log('[Seed] Initial super admin created:', username);
    return { id, username };
  } catch (error) {
    console.error('[Seed] Error creating super admin:', error);
    return null;
  }
};

export const createInitialSchool = (data: {
  nama_sekolah: string;
  npsn?: string;
  alamat?: string;
  logo_url?: string;
  telepon?: string;
  email?: string;
  website?: string;
  kepala_sekolah?: string;
  tahun_ajaran: string;
}): { id: string } | null => {
  const db = getDb();
  
  try {
    const existingSchool = db.prepare('SELECT id FROM identitas_sekolah LIMIT 1').get();
    if (existingSchool) {
      console.log('[Seed] School identity already exists');
      return null;
    }
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO identitas_sekolah (
        id, nama_sekolah, npsn, alamat, logo_url, telepon, email, website, 
        kepala_sekolah, tahun_ajaran, setup_wizard_completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      data.nama_sekolah,
      data.npsn || null,
      data.alamat || null,
      data.logo_url || null,
      data.telepon || null,
      data.email || null,
      data.website || null,
      data.kepala_sekolah || null,
      data.tahun_ajaran
    );
    
    console.log('[Seed] School identity created:', data.nama_sekolah);
    return { id };
  } catch (error) {
    console.error('[Seed] Error creating school:', error);
    return null;
  }
};

export const resetDatabase = (): boolean => {
  const db = getDb();
  
  try {
    db.exec(`
      DELETE FROM jawaban_siswa;
      DELETE FROM anti_cheating_log;
      DELETE FROM hasil_ujian;
      DELETE FROM soal;
      DELETE FROM ujian_kelas;
      DELETE FROM ujian;
      DELETE FROM siswa;
      DELETE FROM kelas;
      DELETE FROM guru;
      DELETE FROM audit_log;
      DELETE FROM super_admin;
      DELETE FROM identitas_sekolah;
    `);
    
    console.log('[Seed] Database reset completed');
    return true;
  } catch (error) {
    console.error('[Seed] Error resetting database:', error);
    return false;
  }
};

export const initializeDatabase = async (): Promise<void> => {
  const db = getDb();
  
  try {
    const tablesExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='super_admin'").get();
    
    if (!tablesExist) {
      console.log('[Seed] Initializing fresh database...');
    } else {
      console.log('[Seed] Database already initialized');
    }
  } catch (error) {
    console.error('[Seed] Error checking database:', error);
  }
};