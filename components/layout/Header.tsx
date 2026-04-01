"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
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

interface HeaderProps {
  user: {
    nama: string | null
    username?: string
    role: string
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

export function Header({ user, className }: HeaderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

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
    <header
      className={cn(
        "bg-white border-b border-gray-200 h-16 flex items-center justify-end px-4 lg:px-6 w-full sticky top-0 z-20",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
          <Avatar className="h-8 w-8 bg-gray-900">
            <AvatarFallback className="bg-gray-900 text-white text-sm font-bold">
              {getInitials(user.nama, user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user.nama || user.username || "User"}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-900">{user.nama || user.username || "User"}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Keluar..." : "Keluar"}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
