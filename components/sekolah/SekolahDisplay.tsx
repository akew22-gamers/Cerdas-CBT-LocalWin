"use client"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Mail, 
  MapPin, 
  Phone, 
  School, 
  User, 
  Globe, 
  Calendar,
  PhoneCall,
  MailOpen,
  Globe2,
  UserCheck,
  Hash
} from "lucide-react"

interface SekolahData {
  nama_sekolah: string
  npsn?: string | null
  alamat?: string | null
  logo_url?: string | null
  telepon?: string | null
  email?: string | null
  website?: string | null
  kepala_sekolah?: string | null
  tahun_ajaran: string
}

interface SekolahDisplayProps {
  data: SekolahData
}

export function SekolahDisplay({ data }: SekolahDisplayProps) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/60 bg-white shadow-xl shadow-slate-200/40">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyOHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl" />
                {data.logo_url ? (
                  <div className="relative h-28 w-28 rounded-3xl bg-white/10 backdrop-blur-sm p-1 ring-4 ring-white/20 shadow-2xl">
                    <img 
                      src={data.logo_url} 
                      alt={data.nama_sekolah}
                      className="h-full w-full object-contain rounded-2xl"
                    />
                  </div>
                ) : (
                  <div className="relative h-28 w-28 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/20 shadow-2xl">
                    <School className="h-14 w-14 text-white" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {data.nama_sekolah}
                </h2>
                {data.npsn && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <Hash className="h-4 w-4 text-white/70" />
                    <span className="text-white/90 font-medium">NPSN: {data.npsn}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                  <Badge variant="secondary" className="bg-white/15 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-4 py-1.5">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {data.tahun_ajaran}
                  </Badge>
                  {data.kepala_sekolah && (
                    <Badge variant="secondary" className="bg-white/15 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-4 py-1.5">
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      {data.kepala_sekolah}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="p-8">
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
              {data.telepon && (
                <InfoCard
                  icon={PhoneCall}
                  label="Telepon"
                  value={data.telepon}
                  gradient="from-blue-500 to-cyan-500"
                />
              )}
              {data.email && (
                <InfoCard
                  icon={MailOpen}
                  label="Email"
                  value={data.email}
                  gradient="from-rose-500 to-pink-500"
                />
              )}
              {data.website && (
                <InfoCard
                  icon={Globe2}
                  label="Website"
                  value={data.website}
                  isLink
                  gradient="from-emerald-500 to-teal-500"
                />
              )}
              {data.alamat && (
                <InfoCard
                  icon={MapPin}
                  label="Alamat"
                  value={data.alamat}
                  fullWidth
                  gradient="from-amber-500 to-orange-500"
                />
              )}
            </div>
          </div>

          {!data.alamat && !data.telepon && !data.email && !data.website && !data.kepala_sekolah && !data.npsn && (
            <div className="text-center py-12 px-8 border-t border-slate-100">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">Informasi detail sekolah belum dilengkapi</p>
              <p className="text-slate-400 text-sm mt-1">
                Silakan edit data untuk menambahkan informasi
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoCard({ 
  icon: Icon, 
  label, 
  value, 
  isLink = false,
  fullWidth = false,
  gradient 
}: { 
  icon: any
  label: string
  value: string
  isLink?: boolean
  fullWidth?: boolean
  gradient: string
}) {
  const content = (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 ${fullWidth ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative flex items-start gap-4">
        <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          {isLink ? (
            <a 
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900 font-medium hover:text-violet-600 transition-colors break-all"
            >
              {value}
            </a>
          ) : (
            <p className="text-slate-900 font-medium break-all">{value}</p>
          )}
        </div>
      </div>
    </div>
  )

  return content
}