"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, GraduationCap, School, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UserRole = "guru" | "siswa"

interface LoginFormProps {
  schoolName: string
}

const roleConfig: Record<UserRole, {
  label: string
  icon: typeof School | typeof GraduationCap
  title: string
  description: string
  gradient: string
  accent: string
}> = {
  guru: {
    label: "Guru",
    icon: School,
    title: "Guru",
    description: "Kelola kelas, siswa, dan ujian",
    gradient: "from-blue-500 to-indigo-600",
    accent: "blue",
  },
  siswa: {
    label: "Siswa",
    icon: GraduationCap,
    title: "Siswa",
    description: "Ikuti ujian dan lihat hasil",
    gradient: "from-emerald-500 to-teal-600",
    accent: "emerald",
  },
}

export function LoginForm({ schoolName }: LoginFormProps) {
  const [role, setRole] = useState<UserRole>("siswa")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    if (!username.trim()) {
      toast.error(role === "siswa" ? "NISN harus diisi" : "Username harus diisi")
      return false
    }
    if (!password) {
      toast.error("Password harus diisi")
      return false
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Login gagal")
      }

      toast.success("Login berhasil!")

      const userRole = data.data.user.role
      let redirectPath = "/siswa"
      if (userRole === "guru") {
        redirectPath = "/guru"
      }

      window.location.href = redirectPath
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
      setIsLoading(false)
    }
  }

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setUsername("")
    setPassword("")
  }

  const getUsernameLabel = () => {
    switch (role) {
      case "siswa":
        return "NISN"
      case "guru":
        return "Username Guru"
      default:
        return "Username"
    }
  }

  const getUsernamePlaceholder = () => {
    switch (role) {
      case "siswa":
        return "Masukkan NISN Anda"
      case "guru":
        return "Masukkan username guru"
      default:
        return "Masukkan username"
    }
  }

  const currentRole = roleConfig[role]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(roleConfig) as UserRole[]).map((roleKey) => {
            const config = roleConfig[roleKey]
            const isActive = role === roleKey
            const Icon = config.icon
            
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => handleRoleChange(roleKey)}
                className={`
                  relative group flex items-center justify-center gap-3 p-4 rounded-xl
                  transition-all duration-200 ease-out border-2
                  ${isActive 
                    ? `bg-gradient-to-br ${config.gradient} border-transparent text-white shadow-lg shadow-${config.accent}-500/25 scale-[1.02]` 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }
                `}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <span className="font-semibold text-lg">{config.label}</span>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl ring-2 ring-white/50" />
                )}
              </button>
            )
          })}
        </div>

        <div className="p-4 rounded-xl border transition-all duration-300 bg-slate-50/50 border-slate-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0 bg-slate-100 text-slate-600">
              <currentRole.icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{currentRole.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{currentRole.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-slate-400" />
              {getUsernameLabel()}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder={getUsernamePlaceholder()}
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
                type={showPassword ? "text" : "password"}
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
        </div>
      </div>

      <div className="flex items-center justify-between">
        <a
          href="#"
          className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            toast.info("Hubungi admin untuk reset password")
          }}
        >
          Lupa password?
        </a>
      </div>

        <Button
          type="submit"
          className={`
            w-full h-11 text-white font-semibold shadow-lg transition-all duration-200
            hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
            ${role === 'guru' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25' : ''}
            ${role === 'siswa' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25' : ''}
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

      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Masuk ke sistem ujian online <span className="font-medium text-slate-500">{schoolName}</span>
        </p>
      </div>
    </form>
  )
}
