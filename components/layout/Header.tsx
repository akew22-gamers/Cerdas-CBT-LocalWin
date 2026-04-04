"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { ProfileDialog } from "./ProfileDialog"

interface HeaderProps {
  user: {
    nama: string | null
    username?: string
    role: string
    id?: string
    nisn?: string
  }
  className?: string
}

function getInitials(nama: string | null, username?: string): string {
  const displayName = nama || username || "User"
  const words = displayName.trim().split(" ")
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    super_admin: "Super Admin",
    guru: "Guru",
    siswa: "Siswa",
  }
  return roleMap[role] || role
}

function getRoleColor(role: string): string {
  const colorMap: Record<string, string> = {
    super_admin: "bg-violet-500 text-white",
    guru: "bg-blue-500 text-white",
    siswa: "bg-emerald-500 text-white",
  }
  return colorMap[role] || "bg-slate-500 text-white"
}

export function Header({ user, className }: HeaderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showProfile, setShowProfile] = React.useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })
      if (response.ok) {
        router.push("/login")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header
        className={cn(
          "bg-white border-b border-slate-200/80 h-16 flex items-center justify-end px-4 lg:px-6 w-full sticky top-0 z-20",
          "shadow-sm shadow-slate-100/50",
          className
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-xl transition-all duration-200 group">
            <Avatar className={cn("h-9 w-9", getRoleColor(user.role))}>
              <AvatarFallback className={cn(getRoleColor(user.role), "text-sm font-semibold")}>
                {getInitials(user.nama, user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {user.nama || user.username || "User"}
              </p>
              <p className="text-xs text-slate-500 leading-tight flex items-center gap-1">
                {getRoleLabel(user.role)}
                <ChevronDown className="w-3 h-3 group-data-[state=open]:rotate-180 transition-transform" />
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("h-10 w-10", getRoleColor(user.role))}>
                      <AvatarFallback className={cn(getRoleColor(user.role), "text-sm font-semibold")}>
                        {getInitials(user.nama, user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.nama || user.username || "User"}</p>
                      <p className="text-xs text-slate-500">{getRoleLabel(user.role)}</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 px-4 hover:bg-slate-50"
                onClick={() => setShowProfile(true)}
              >
                <User className="mr-3 h-4 w-4 text-slate-500" />
                <span>Profil</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer py-2.5 px-4 text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>{isLoading ? "Keluar..." : "Keluar"}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ProfileDialog 
        open={showProfile} 
        onOpenChange={setShowProfile}
        user={{
          id: user.id || '',
          username: user.username || '',
          nama: user.nama,
          role: user.role as 'super_admin' | 'guru' | 'siswa',
          nisn: user.nisn
        }}
      />
    </>
  )
}