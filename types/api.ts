// API Response Types for Cerdas-CBT

// ============================================
// Generic Response Types
// ============================================
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================
// Setup Wizard Types
// ============================================

export interface SetupStatusResponse {
  setup_completed: boolean
}

// GET /api/setup/validate
export interface SetupValidateResponse {
  token_valid: boolean
  message?: string
}

// POST /api/setup/complete - Request
export interface SetupCompleteRequest {
  super_admin: {
    username: string
    password: string
    nama?: string
  }
  sekolah: {
    nama_sekolah: string
    npsn?: string
    alamat?: string
    telepon?: string
    email?: string
    website?: string
    kepala_sekolah?: string
    tahun_ajaran: string
    logo_url?: string
  }
}

// POST /api/setup/complete - Response
export interface SetupCompleteResponse {
  message: string
  super_admin: {
    id: string
    username: string
    nama?: string
  }
  sekolah: {
    id: string
    nama_sekolah: string
    npsn?: string
  }
}

// Setup Error Codes
export type SetupErrorCode =
  | 'SETUP_ALREADY_COMPLETED'
  | 'INVALID_SETUP_TOKEN'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'

// ============================================
// Authentication Types
// ============================================

// POST /api/auth/login - Request
export interface LoginRequest {
  username: string
  password: string
  role: 'super_admin' | 'guru' | 'siswa'
}

// POST /api/auth/login - Response
export interface LoginResponse {
  user: {
    id: string
    username: string
    nama?: string
    role: 'super_admin' | 'guru' | 'siswa'
  }
  token: string
  expires_at: string
}

// GET /api/auth/me - Response
export interface CurrentUserResponse {
  id: string
  username: string
  nama?: string
  role: 'super_admin' | 'guru' | 'siswa'
  created_at?: string
}

// POST /api/auth/change-password - Request
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// POST /api/auth/refresh - Response
export interface RefreshTokenResponse {
  token: string
  expires_at: string
  refreshed_at: string
}

// Auth Error Codes
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

// ============================================
// Common Error Codes
// ============================================
export type CommonErrorCode =
  | SetupErrorCode
  | AuthErrorCode
  | 'FILE_INVALID'
  | 'IMPORT_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
