import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cbt-local-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
  id: string;
  role: 'super_admin' | 'guru' | 'siswa';
  username: string;
  nama?: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
    return null;
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Token decode failed:', error);
    return null;
  }
};

export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token, { complete: true }) as { payload: { exp?: number } } | null;
    if (!decoded || typeof decoded.payload.exp !== 'number') return null;
    return new Date(decoded.payload.exp * 1000);
  } catch {
    return null;
  }
};