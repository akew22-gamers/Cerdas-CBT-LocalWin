"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, Mail, MapPin, Phone, School, User, Globe, FileText } from "lucide-react"

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
  const InfoRow = ({ 
    icon: Icon, 
    label, 
    value 
  }: { 
    icon: any
    label: string
    value: string | null | undefined
  }) => {
    if (!value) return null
    
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-base text-gray-900 dark:text-gray-100 break-words">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-6">
          <div className="flex items-center gap-4">
            {data.logo_url ? (
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-4 ring-white/30">
                <img 
                  src={data.logo_url} 
                  alt={data.nama_sekolah}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30">
                <School className="h-10 w-10" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">{data.nama_sekolah}</CardTitle>
              <CardDescription className="text-indigo-100 mt-1">
                Tahun Ajaran {data.tahun_ajaran}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <InfoRow 
                icon={Building2} 
                label="NPSN" 
                value={data.npsn} 
              />
              <InfoRow 
                icon={MapPin} 
                label="Alamat" 
                value={data.alamat} 
              />
              <InfoRow 
                icon={Phone} 
                label="Telepon" 
                value={data.telepon} 
              />
              <InfoRow 
                icon={Mail} 
                label="Email" 
                value={data.email} 
              />
            </div>
            
            <div className="space-y-1">
              <InfoRow 
                icon={Globe} 
                label="Website" 
                value={data.website} 
              />
              <InfoRow 
                icon={User} 
                label="Kepala Sekolah" 
                value={data.kepala_sekolah} 
              />
              <InfoRow 
                icon={FileText} 
                label="Status" 
                value={data.npsn ? "Terdaftar" : "Belum terdaftar"} 
              />
            </div>
          </div>

          {!data.alamat && !data.telepon && !data.email && !data.website && !data.kepala_sekolah && !data.npsn && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">Informasi detail sekolah belum dilengkapi.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
