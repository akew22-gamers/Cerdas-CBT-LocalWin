'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, School, GraduationCap, ArrowRight, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginFormProps {
  schoolName: string
}

type UserRole = 'guru' | 'siswa'

export function LoginForm({ schoolName }: LoginFormProps) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('siswa')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error(role === 'siswa' ? 'NISN harus diisi' : 'Username harus diisi')
      return
    }
    if (!password) {
      toast.error('Password harus diisi')
      return
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
        }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Login gagal')
      }

      toast.success('Login berhasil!')
      
      const redirectPath = data.data.user.role === 'guru' ? '/guru' : '/siswa/ujian/join'
      window.location.href = redirectPath
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(message)
      setIsLoading(false)
    }
  }

  const roleConfig = {
    guru: {
      label: 'GURU',
      icon: School,
      gradient: 'from-blue-600 to-indigo-600',
      accent: 'blue',
    },
    siswa: {
      label: 'SISWA',
      icon: GraduationCap,
      gradient: 'from-emerald-600 to-teal-600',
      accent: 'emerald',
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setRole('guru')}
          className={`
            relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl
            transition-all duration-200 font-semibold text-sm
            ${role === 'guru'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          <School className="w-4 h-4" />
          <span>GURU</span>
          {role === 'guru' && (
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/50" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setRole('siswa')}
          className={`
            relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl
            transition-all duration-200 font-semibold text-sm
            ${role === 'siswa'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          <GraduationCap className="w-4 h-4" />
          <span>SISWA</span>
          {role === 'siswa' && (
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/50" />
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push('/ujian')}
          className="
            flex items-center justify-center gap-2 py-3 px-4 rounded-xl
            bg-slate-800 text-white hover:bg-slate-900
            transition-all duration-200 font-semibold text-sm
            hover:scale-[1.02] active:scale-[0.98]
          "
        >
          <span>UJIAN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-slate-700">
            {role === 'siswa' ? 'NISN' : 'NIP / Username'}
          </Label>
          <Input
            id="username"
            type="text"
            placeholder={role === 'siswa' ? 'Masukkan NISN Anda' : 'Masukkan NIP / Username'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11 pr-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="#"
            className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              toast.info('Hubungi admin untuk reset password')
            }}
          >
            Lupa password?
          </a>
        </div>

        <Button
          type="submit"
          className={`
            w-full h-11 text-white font-semibold shadow-lg 
            hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-200
            ${role === 'guru'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
            }
          `}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Memuat...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Masuk
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Masuk ke sistem ujian online{' '}
          <span className="font-medium text-slate-500">{schoolName}</span>
        </p>
      </div>
    </form>
  )
}
