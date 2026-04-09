import { runMigrations } from './migrations';

let initialized = false;

export const initializeDatabase = (): void => {
  if (initialized) {
    return;
  }

  try {
    console.log('[DB] Initializing database...');
    runMigrations();
    initialized = true;
    console.log('[DB] Database initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
};

initializeDatabase();