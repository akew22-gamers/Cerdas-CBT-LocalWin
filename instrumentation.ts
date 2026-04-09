import { runMigrations } from '@/lib/db/migrations';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Server] Initializing database...');
    try {
      runMigrations();
      console.log('[Server] Database initialized successfully');
    } catch (error) {
      console.error('[Server] Database initialization failed:', error);
    }
  }
}