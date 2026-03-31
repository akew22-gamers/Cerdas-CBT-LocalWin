"use client"

interface SoalStat {
  soal_id: string
  teks_soal: string
  urutan: number
  jumlah_benar: number
  jumlah_salah: number
  persentase_benar: number
}

interface StatsChartProps {
  data: SoalStat[]
}

export function StatsChart({ data }: StatsChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Belum ada data statistik
      </div>
    )
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-500"
    if (percentage >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-4">
      {data.map((stat) => (
        <div
          key={stat.soal_id}
          className="p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                Soal {stat.urutan}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {stat.teks_soal}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-bold ${
                  stat.persentase_benar >= 70
                    ? "text-green-600"
                    : stat.persentase_benar >= 40
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {stat.persentase_benar}%
              </p>
              <p className="text-xs text-gray-500">benar</p>
            </div>
          </div>

          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${getBarColor(
                stat.persentase_benar
              )}`}
              style={{ width: `${stat.persentase_benar}%` }}
            />
          </div>

          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600 font-medium">
              {stat.jumlah_benar} benar
            </span>
            <span className="text-gray-500">
              Total: {stat.jumlah_benar + stat.jumlah_salah}
            </span>
            <span className="text-red-600 font-medium">
              {stat.jumlah_salah} salah
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface MiniStatsChartProps {
  stats: {
    total_siswa: number
    nilai_rata_rata: number
    nilai_tertinggi: number
    nilai_terendah: number
  }
}

export function MiniStatsChart({ stats }: MiniStatsChartProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Total Siswa</p>
        <p className="text-2xl font-bold text-blue-600">{stats.total_siswa}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Rata-rata</p>
        <p className="text-2xl font-bold text-green-600">
          {stats.nilai_rata_rata.toFixed(2)}
        </p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Tertinggi</p>
        <p className="text-2xl font-bold text-purple-600">
          {stats.nilai_tertinggi}
        </p>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Terendah</p>
        <p className="text-2xl font-bold text-orange-600">
          {stats.nilai_terendah}
        </p>
      </div>
    </div>
  )
}
