"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

interface Hasil {
  id: string
  siswa: {
    id: string
    nisn: string
    nama: string
  }
  kelas: string
  nilai: number
  jumlah_benar?: number
  jumlah_salah?: number
  waktu_mulai?: string
  waktu_selesai: string
  is_submitted: boolean
  tab_switch_count?: number
  fullscreen_exit_count?: number
}

interface HasilTableProps {
  data: Hasil[]
  ujianId: string
  showDetailLink?: boolean
  showCheatingInfo?: boolean
}

export function HasilTable({
  data,
  ujianId,
  showDetailLink = true,
  showCheatingInfo = false
}: HasilTableProps) {
  const getNilaiColor = (nilai: number) => {
    if (nilai >= 80) return "text-green-600"
    if (nilai >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("id-ID")
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">No</TableHead>
            <TableHead>NISN</TableHead>
            <TableHead>Nama Siswa</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Nilai</TableHead>
            {showCheatingInfo && (
              <>
                <TableHead>Tab Switch</TableHead>
                <TableHead>Fullscreen Exit</TableHead>
              </>
            )}
            <TableHead>Waktu Selesai</TableHead>
            <TableHead>Status</TableHead>
            {showDetailLink && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((hasil, index) => (
              <TableRow key={hasil.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{hasil.siswa.nisn}</TableCell>
                <TableCell>{hasil.siswa.nama}</TableCell>
                <TableCell>{hasil.kelas}</TableCell>
                <TableCell>
                  <span className={`font-bold ${getNilaiColor(hasil.nilai)}`}>
                    {hasil.nilai.toFixed(2)}
                  </span>
                </TableCell>
                {showCheatingInfo && (
                  <>
                    <TableCell>
                      {hasil.tab_switch_count && hasil.tab_switch_count > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {hasil.tab_switch_count}x
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasil.fullscreen_exit_count && hasil.fullscreen_exit_count > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {hasil.fullscreen_exit_count}x
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </>
                )}
                <TableCell>{formatDate(hasil.waktu_selesai)}</TableCell>
                <TableCell>
                  {hasil.is_submitted ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 hover:bg-green-100"
                    >
                      Selesai
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    >
                      Belum Selesai
                    </Badge>
                  )}
                </TableCell>
                {showDetailLink && (
                  <TableCell className="text-right">
                    <Link href={`/guru/hasil/${ujianId}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={showDetailLink ? 9 : 8}
                className="text-center py-8 text-gray-500"
              >
                Belum ada hasil untuk ujian ini
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
