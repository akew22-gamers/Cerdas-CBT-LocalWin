"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { StatsCard } from "@/components/admin/StatsCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Users, ClipboardList, FileCheck, BookOpen, UserPlus, Search, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardStats {
  total_guru: number
  total_siswa: number
  total_ujian: number
  ujian_aktif: number
  recent_guru: Array<{
    id: string
    nama: string
    created_at: string
  }>
  recent_audit_logs: Array<{
    id: string
    role: string
    action: string
    entity_type: string | null
    details: any
    created_at: string
  }>
}

interface UserProfile {
  nama: string
  role: string
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState<UserProfile>({ nama: "Super Admin", role: "super_admin" })

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, meRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/auth/me")
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          if (statsData.success) {
            setStats(statsData.data)
          }
        }

        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData.success) {
            setUser(meData.data.user)
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  }

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      login: "Login",
      logout: "Logout",
      create: "Membuat",
      update: "Memperbarui",
      delete: "Menghapus",
      submit: "Mensubmit"
    }
    return actionMap[action] || action
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Super Admin"
          description="Kelola users, monitoring aktivitas, dan pengaturan sistem"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<Users className="w-5 h-5" />}
            label="Total Guru"
            value={loading ? "-" : stats?.total_guru ?? 0}
          />
          <StatsCard
            icon={<ClipboardList className="w-5 h-5" />}
            label="Total Siswa"
            value={loading ? "-" : stats?.total_siswa ?? 0}
          />
          <StatsCard
            icon={<FileCheck className="w-5 h-5" />}
            label="Total Ujian"
            value={loading ? "-" : stats?.total_ujian ?? 0}
          />
          <StatsCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Ujian Aktif"
            value={loading ? "-" : stats?.ujian_aktif ?? 0}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/guru/create">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                  <UserPlus className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium">Create Guru</p>
                    <p className="text-xs text-gray-500">Tambah guru baru</p>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/audit">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                  <Search className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium">View Audit Log</p>
                    <p className="text-xs text-gray-500">Monitoring aktivitas</p>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/sekolah">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                  <Settings className="w-4 h-4" />
                  <div className="text-left">
                    <p className="font-medium">School Settings</p>
                    <p className="text-xs text-gray-500">Identitas sekolah</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Guru Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-gray-500 py-4">Memuat...</div>
              ) : stats?.recent_guru && stats.recent_guru.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_guru.map((guru) => (
                    <div
                      key={guru.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{guru.nama}</p>
                        <p className="text-xs text-gray-500">
                          Ditambahkan {formatDate(guru.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Belum ada guru terdaftar
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Aktivitas Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-gray-500 py-4">Memuat...</div>
              ) : stats?.recent_audit_logs && stats.recent_audit_logs.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_audit_logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {formatAction(log.action)} {log.entity_type || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.role === "super_admin" ? "Super Admin" : log.role === "guru" ? "Guru" : "Siswa"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Belum ada aktivitas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
