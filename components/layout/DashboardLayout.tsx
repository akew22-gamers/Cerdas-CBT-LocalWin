"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

type UserRole = "super_admin" | "guru" | "siswa"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    nama: string | null
    username?: string
    role: string
  }
  className?: string
}

function getUserRole(role: string): UserRole {
  if (role === "super_admin") return "super_admin"
  if (role === "guru") return "guru"
  return "siswa"
}

export function DashboardLayout({ children, user, className }: DashboardLayoutProps) {
  const role = getUserRole(user.role)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden lg:ml-0">
        <Header user={user} />
        
        <main className={cn("flex-1 bg-gray-50 p-4 lg:p-8 overflow-auto", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
