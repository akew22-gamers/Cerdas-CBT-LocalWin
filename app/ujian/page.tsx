import { Card, CardContent } from "@/components/ui/card";
import { UjianLoginPage } from "@/components/ujian/UjianLoginPage";
import { getDb } from "@/lib/db/client";

async function getSchoolInfo() {
  try {
    const db = getDb();
    const sekolah = db.prepare(`
      SELECT nama_sekolah, logo_url 
      FROM identitas_sekolah 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).get() as { nama_sekolah: string; logo_url: string | null } | undefined;

    return {
      nama_sekolah: sekolah?.nama_sekolah || 'Cerdas-CBT',
      logo_url: sekolah?.logo_url || null
    };
  } catch {
    return { nama_sekolah: 'Cerdas-CBT', logo_url: null };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const schoolInfo = await getSchoolInfo()
  const params = await searchParams

  // Parse URL params for auto-fill from QR code
  // u=ujian_id, s=siswa_id, k=kode_ujian
  const ujianId = typeof params.u === 'string' ? params.u : undefined
  const siswaId = typeof params.s === 'string' ? params.s : undefined
  const kodeUjian = typeof params.k === 'string' ? params.k : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Subtle dot pattern background */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Ambient gradient orbs */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
              <img
                src="/images/logo_kemendikdasmen.svg"
                alt="Logo Kemendikdasmen"
                className="h-16 w-auto"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Cerdas-CBT
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {schoolInfo.nama_sekolah}
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <UjianLoginPage
              schoolName={schoolInfo.nama_sekolah}
              ujianId={ujianId}
              siswaId={siswaId}
              kodeUjian={kodeUjian}
            />
          </CardContent>
        </Card>

        <footer className="text-center mt-8">
          <p className="text-xs text-slate-400">
            © 2026 Cerdas-CBT by EAS Creative Studio
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Platform Ujian Berbasis Komputer
          </p>
        </footer>
      </div>
    </div>
  )
}
