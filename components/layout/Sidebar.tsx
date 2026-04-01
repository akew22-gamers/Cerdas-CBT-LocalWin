"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  School,
  GraduationCap,
  BookOpen,
  FileQuestion,
  FileText,
  History,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type UserRole = "super_admin" | "guru" | "siswa"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigationConfig: Record<UserRole, NavSection[]> = {
  super_admin: [
    {
      items: [
        { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: "Manajemen",
      items: [
        { label: "Guru Management", href: "/admin/guru", icon: <Users className="w-5 h-5" /> },
        { label: "Audit Log", href: "/admin/audit-log", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "School Identity", href: "/admin/sekolah", icon: <School className="w-5 h-5" /> },
      ],
    },
  ],
  guru: [
    {
      items: [
        { label: "Dashboard", href: "/guru", icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: "Manajemen",
      items: [
        { label: "Kelas", href: "/guru/kelas", icon: <School className="w-5 h-5" /> },
        { label: "Siswa", href: "/guru/siswa", icon: <GraduationCap className="w-5 h-5" /> },
        { label: "Ujian", href: "/guru/ujian", icon: <BookOpen className="w-5 h-5" /> },
        { label: "Soal", href: "/guru/soal", icon: <FileQuestion className="w-5 h-5" /> },
        { label: "Hasil", href: "/guru/hasil", icon: <FileText className="w-5 h-5" /> },
      ],
    },
  ],
  siswa: [
    {
      items: [
        { label: "Dashboard", href: "/siswa", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Ujian", href: "/siswa/ujian", icon: <BookOpen className="w-5 h-5" /> },
        { label: "Riwayat", href: "/siswa/riwayat", icon: <History className="w-5 h-5" /> },
      ],
    },
  ],
}

interface SidebarProps {
  role: UserRole
  className?: string
}

export function Sidebar({ role, className }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const navSections = navigationConfig[role]

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/guru" || href === "/siswa") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-white border-gray-200"
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </Button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col",
          "fixed lg:static inset-y-0 left-0 z-40",
          "transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex items-center gap-2 p-4 font-bold text-xl text-gray-900 border-b border-gray-100">
          <div className="h-8 w-8 flex items-center justify-center">
            <img
              src="/images/logo_kemendikdasmen.svg"
              alt="Logo Kemendikdasmen"
              className="h-8 w-8"
            />
          </div>
          <span>Cerdas-CBT</span>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              {section.title && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-4">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 mx-2 rounded-md text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className={cn("w-5 h-5", active ? "text-blue-600" : "text-gray-400")}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            © 2026 Cerdas-CBT
          </p>
        </div>
      </aside>
    </>
  )
}
