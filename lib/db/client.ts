import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

const getDataDir = (): string => {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
};

const getDbPath = (): string => {
  return path.join(getDataDir(), 'cbt-data.db');
};

let db: Database.Database | null = null;

export const getDb = (): Database.Database => {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    
    console.log(`[DB] Connected to SQLite at: ${dbPath}`);
    
    // Run migrations on first connection
    try {
      runMigrations();
    } catch (error) {
      console.error('[DB] Migration error:', error);
    }
  }
  return db;
};

export const closeDb = (): void => {
  if (db) {
    db.close();
    db = null;
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB] Connection closed');
    }
  }
};

export const getDataDirectory = getDataDir;
export const getUploadsDir = (): string => {
  const uploadsDir = path.join(getDataDir(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

export const getExportsDir = (): string => {
  const exportsDir = path.join(getDataDir(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  return exportsDir;
};

export const getBackupsDir = (): string => {
  const backupsDir = path.join(getDataDir(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  return backupsDir;
};