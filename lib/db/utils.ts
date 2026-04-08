import { getDb } from './client';
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const executeTransaction = <T>(fn: () => T): T => {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction();
};

export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

export const parseJsonField = <T>(value: string | null | undefined): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const toJsonField = (value: unknown): string | null => {
  if (!value) return null;
  return JSON.stringify(value);
};

export const getTimestamp = (): string => {
  const now = new Date();
  return formatDate(now);
};