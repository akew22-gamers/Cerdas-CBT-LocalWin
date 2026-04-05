"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Eye } from "lucide-react"
import { DetailHasilDialog } from "./DetailHasilDialog"

interface RiwayatCardProps {
  id: string
  ujian_judul: string
  nilai: number
  show_result: boolean
  completed_at: string | null
}

export function RiwayatCard({ id, ujian_judul, nilai, show_result, completed_at }: RiwayatCardProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const completedDate = completed_at 
    ? new Date(completed_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '-'

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium text-gray-700 line-clamp-2 flex-1">
              {ujian_judul}
            </CardTitle>
            {show_result && (
              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
                {nilai}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Selesai</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{completedDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-emerald-500 transition-colors">
              <Eye className="w-3 h-3" />
              <span>Lihat</span>
            </div>
          </div>
          {!show_result && (
            <p className="text-xs text-gray-400 mt-2">
              Hasil tidak ditampilkan oleh guru
            </p>
          )}
        </CardContent>
      </Card>

      <DetailHasilDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        hasilId={id}
      />
    </>
  )
}