"use client"

import * as React from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SekolahForm } from "./SekolahForm"
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
  Hash,
  Edit3
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
  data: SekolahData | null
}

export function SekolahDisplay({ data }: SekolahDisplayProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  if (!data) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
              <School className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900">Belum ada data sekolah</p>
              <p className="text-slate-500 mt-1 mb-4">
                Silakan lengkapi informasi identitas pertama kali.
              </p>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger render={<Button className="bg-violet-600 hover:bg-violet-700 text-white" />}>
                <Edit3 className="mr-2 h-4 w-4" /> Lengkapi Data Sekolah
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Lengkapi Informasi Sekolah</DialogTitle>
                  <DialogDescription>
                    Perbarui data identitas sekolah dengan format yang benar
                  </DialogDescription>
                </DialogHeader>
                <SekolahForm onSuccess={() => setIsEditDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative">
            
            <div className="absolute top-0 right-0 sm:static sm:ml-auto order-first sm:order-last">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger render={<Button variant="outline" size="sm" className="border-violet-200 text-violet-700 hover:bg-violet-50" />}>
                  <Edit3 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Data</span>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Edit Informasi Sekolah</DialogTitle>
                    <DialogDescription>
                      Perbarui data identitas sekolah. Pastikan data yang dimasukkan valid.
                    </DialogDescription>
                  </DialogHeader>
                  <SekolahForm 
                    initialData={{
                      nama_sekolah: data.nama_sekolah,
                      npsn: data.npsn || undefined,
                      alamat: data.alamat || undefined,
                      logo_url: data.logo_url || undefined,
                      telepon: data.telepon || undefined,
                      email: data.email || undefined,
                      website: data.website || undefined,
                      kepala_sekolah: data.kepala_sekolah || undefined,
                      tahun_ajaran: data.tahun_ajaran
                    }} 
                    onSuccess={() => setIsEditDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex-shrink-0">
              {data.logo_url ? (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
                  <img 
                    src={data.logo_url} 
                    alt={data.nama_sekolah}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center shadow-sm">
                  <School className="h-10 w-10 text-violet-600" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1 py-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.nama_sekolah}
              </h2>
              {data.npsn && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 min-w-0">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">NPSN: {data.npsn}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  {data.tahun_ajaran}
                </Badge>
                {data.kepala_sekolah && (
                  <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1">
                    <UserCheck className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    {data.kepala_sekolah}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.telepon && (
                <InfoCard
                  icon={PhoneCall}
                  label="Telepon"
                  value={data.telepon}
                />
              )}
              {data.email && (
                <InfoCard
                  icon={MailOpen}
                  label="Email"
                  value={data.email}
                />
              )}
              {data.website && (
                <InfoCard
                  icon={Globe2}
                  label="Website"
                  value={data.website}
                  isLink
                />
              )}
              {data.alamat && (
                <InfoCard
                  icon={MapPin}
                  label="Alamat"
                  value={data.alamat}
                  fullWidth
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
}: { 
  icon: any
  label: string
  value: string
  isLink?: boolean
  fullWidth?: boolean
}) {
  const content = (
    <div className={`group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-300 hover:shadow-sm ${fullWidth ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
          <Icon className="h-5 w-5 text-slate-500 group-hover:text-violet-600 transition-colors" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-xs font-medium text-slate-500 mb-1 tracking-wide">{label}</p>
          {isLink ? (
            <a 
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900 font-medium hover:text-violet-600 transition-colors block truncate"
            >
              {value}
            </a>
          ) : (
            <p className="text-slate-900 font-medium break-words leading-relaxed">{value}</p>
          )}
        </div>
      </div>
    </div>
  )

  return content
}