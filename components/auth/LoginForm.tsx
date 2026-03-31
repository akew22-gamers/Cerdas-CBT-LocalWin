"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, GraduationCap, School, Shield, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type UserRole = "super_admin" | "guru" | "siswa"

interface LoginFormProps {
  schoolName: string
}

export function LoginForm({ schoolName }: LoginFormProps) {
  const router = useRouter()
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (userRole === "siswa") {
        router.push("/siswa")
      } else if (userRole === "guru") {
        router.push("/guru")
      } else if (userRole === "super_admin") {
        router.push("/admin")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (value: string) => {
    setRole(value as UserRole)
    setUsername("")
    setPassword("")
  }

  const getUsernameLabel = () => {
    switch (role) {
      case "siswa":
        return "NISN"
      case "guru":
        return "Username Guru"
      case "super_admin":
        return "Username Super-admin"
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
      case "super_admin":
        return "Masukkan username super-admin"
      default:
        return "Masukkan username"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={role} onValueChange={handleRoleChange} className="w-full">
        <TabsList variant="line" className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="super_admin" className="flex items-center gap-2 text-xs md:text-sm">
            <Shield className="w-4 h-4 hidden sm:inline" />
            <span>Super-admin</span>
          </TabsTrigger>
          <TabsTrigger value="guru" className="flex items-center gap-2 text-xs md:text-sm">
            <School className="w-4 h-4 hidden sm:inline" />
            <span>Guru</span>
          </TabsTrigger>
          <TabsTrigger value="siswa" className="flex items-center gap-2 text-xs md:text-sm">
            <GraduationCap className="w-4 h-4 hidden sm:inline" />
            <span>Siswa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="super_admin" className="mt-6">
          <RoleDescription
            icon={<Shield className="w-5 h-5" />}
            title="Login sebagai Super-admin"
            description="Akses penuh untuk mengelola sistem, guru, dan data sekolah."
          />
        </TabsContent>

        <TabsContent value="guru" className="mt-6">
          <RoleDescription
            icon={<School className="w-5 h-5" />}
            title="Login sebagai Guru"
            description="Kelola kelas, siswa, soal, dan pantau hasil ujian."
          />
        </TabsContent>

        <TabsContent value="siswa" className="mt-6">
          <RoleDescription
            icon={<GraduationCap className="w-5 h-5" />}
            title="Login sebagai Siswa"
            description="Ikuti ujian dengan memasukkan kode ujian yang diberikan guru."
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            {getUsernameLabel()}
          </Label>
          <Input
            id="username"
            type="text"
            placeholder={getUsernamePlaceholder()}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
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

      <div className="flex items-center justify-between">
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
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
        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
          "Masuk"
        )}
      </Button>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          Masuk ke sistem ujian online {schoolName}
        </p>
      </div>
    </form>
  )
}

interface RoleDescriptionProps {
  icon: React.ReactNode
  title: string
  description: string
}

function RoleDescription({ icon, title, description }: RoleDescriptionProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}
