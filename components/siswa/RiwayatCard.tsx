import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2 } from "lucide-react"

interface RiwayatCardProps {
  ujian_judul: string
  nilai: number
  show_result: boolean
  completed_at: string | null
}

export function RiwayatCard({ ujian_judul, nilai, show_result, completed_at }: RiwayatCardProps) {
  const completedDate = completed_at 
    ? new Date(completed_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '-'

  return (
    <Card>
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
        {!show_result && (
          <p className="text-xs text-gray-400 mt-2">
            Hasil tidak ditampilkan oleh guru
          </p>
        )}
      </CardContent>
    </Card>
  )
}
