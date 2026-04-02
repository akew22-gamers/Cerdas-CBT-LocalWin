import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const siswaId = '268543de-0bfb-4d55-86f3-b234c43494ec'

  const results: any = {}

  // Step 1: Get siswa
  const { data: siswa, error: siswaError } = await supabase
    .from('siswa')
    .select('id, kelas_id')
    .eq('id', siswaId)
    .single()

  results.step1_siswa = { data: siswa, error: siswaError }

  if (!siswa) {
    return NextResponse.json(results)
  }

  // Step 2: Get ujian_kelas
  const { data: ujianKelas, error: ujianKelasError } = await supabase
    .from('ujian_kelas')
    .select('ujian_id, kelas_id')
    .eq('kelas_id', siswa.kelas_id)

  results.step2_ujian_kelas = { data: ujianKelas, error: ujianKelasError }

  const ujianIds = (ujianKelas || []).map(uk => uk.ujian_id)
  results.ujian_ids = ujianIds

  if (ujianIds.length === 0) {
    return NextResponse.json(results)
  }

  // Step 3: Get ujian
  const { data: ujian, error: ujianError } = await supabase
    .from('ujian')
    .select('id, kode_ujian, judul, durasi, show_result, status')
    .in('id', ujianIds)
    .eq('status', 'aktif')

  results.step3_ujian = { data: ujian, error: ujianError }

  return NextResponse.json(results)
}