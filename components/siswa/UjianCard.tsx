import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"

interface UjianCardProps {
  id: string
  kode_ujian: string
  judul: string
  durasi: number
}

export function UjianCard({ id, kode_ujian, judul, durasi }: UjianCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 line-clamp-2">
          {judul}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{durasi} menit</span>
        </div>
        
        <Link href={`/siswa/ujian/${id}`} className="block">
          <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            Kerjakan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
