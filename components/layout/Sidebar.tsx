'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type UserRole = 'super_admin' | 'guru' | 'siswa'

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
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Manajemen',
      items: [
        { label: 'Guru Management', href: '/admin/guru', icon: <Users className="w-5 h-5" /> },
        { label: 'Audit Log', href: '/admin/audit-log', icon: <ClipboardList className="w-5 h-5" /> },
        { label: 'Identitas Sekolah', href: '/admin/sekolah', icon: <School className="w-5 h-5" /> },
      ],
    },
  ],
  guru: [
    {
      items: [
        { label: 'Dashboard', href: '/guru', icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Manajemen',
      items: [
        { label: 'Kelas', href: '/guru/kelas', icon: <School className="w-5 h-5" /> },
        { label: 'Siswa', href: '/guru/siswa', icon: <GraduationCap className="w-5 h-5" /> },
        { label: 'Ujian', href: '/guru/ujian', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Soal', href: '/guru/soal', icon: <FileQuestion className="w-5 h-5" /> },
        { label: 'Hasil', href: '/guru/hasil', icon: <FileText className="w-5 h-5" /> },
      ],
    },
  ],
  siswa: [
    {
      items: [
        { label: 'Dashboard', href: '/siswa', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Ujian', href: '/siswa/ujian', icon: <BookOpen className="w-5 h-5" /> },
        { label: 'Riwayat', href: '/siswa/riwayat', icon: <History className="w-5 h-5" /> },
      ],
    },
  ],
}

const roleColors: Record<UserRole, { gradient: string; accent: string }> = {
  super_admin: { gradient: 'from-violet-500 to-purple-600', accent: 'violet' },
  guru: { gradient: 'from-blue-500 to-indigo-600', accent: 'blue' },
  siswa: { gradient: 'from-emerald-500 to-teal-600', accent: 'emerald' },
}

interface SidebarProps {
  role: UserRole
  className?: string
}

export function Sidebar({ role, className }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const colors = roleColors[role]
  const navSections = navigationConfig[role]

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/guru' || href === '/siswa') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section - Compact on mobile */}
      <div className="flex items-center gap-2.5 p-4 border-b border-slate-200/80 shrink-0">
        <div className="relative shrink-0">
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br rounded-lg blur opacity-50',
              colors.gradient
            )}
          />
          <div className="relative h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100">
            <img
              src="/images/logo_kemendikdasmen.svg"
              alt="Logo"
              className="h-5 w-5"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base text-slate-900 leading-tight truncate">
            Cerdas-CBT
          </h1>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            Platform Ujian
          </p>
        </div>
      </div>

      {/* Navigation - Touch-optimized */}
      <nav className="flex-1 py-4 overflow-y-auto z-10">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-5">
            {section.title && (
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5 px-3">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      // Base styling
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                      
                      // Touch target - minimum 44px height
                      'min-h-[44px]',
                      'relative',
                      
                      // Active state with gradient
                      active
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md shadow-${colors.accent}-500/25`
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      
                      // Press effect
                      'active:scale-[0.98]',
                      // Ensure clickable
                      'z-10 pointer-events-auto'
                    )}
                  >
                    {/* Icon */}
                    <span
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        active
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    >
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span className="flex-1 truncate">{item.label}</span>

                    {/* Chevron for active */}
                    {active && (
                      <ChevronRight className="w-4 h-4 opacity-60 shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Compact */}
      <div className="p-3 border-t border-slate-200/80 shrink-0">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium">© 2026 Cerdas-CBT</p>
          <p className="text-[9px] text-slate-400 font-medium">EAS Creative Studio</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button - Top-left, safe area */}
      <div className="lg:hidden fixed top-3 left-3 z-50 safe-area-top">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            'bg-white border-slate-200 shadow-md hover:bg-slate-50',
            'h-10 w-10 rounded-xl',
            'active:scale-95 transition-transform'
          )}
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-slate-700" />
          ) : (
            <Menu className="h-5 w-5 text-slate-700" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-in fade-in duration-200 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar - Always visible on lg+ */}
      <aside
        className={cn(
          'w-64 bg-white border-r border-slate-200/80 hidden lg:block fixed inset-y-0 left-0 z-30',
          'transition-all duration-300',
          className
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Slide-in drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </div>
    </>
  )
}
