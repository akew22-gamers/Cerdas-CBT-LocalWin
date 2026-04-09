import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'
import { KartuUjianData, QRCardData } from '@/types/kartu'

async function convertLogoToBase64(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null
  if (logoUrl.startsWith('data:')) return logoUrl
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.NEXT_PUBLIC_APP_URL || 
                  'http://localhost:3000'
  const fullUrl = logoUrl.startsWith('/') 
    ? `${baseUrl}${logoUrl}`
    : logoUrl
  
  try {
    const response = await fetch(fullUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/svg+xml'
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Failed to convert logo:', error)
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak' } },
        { status: 403 }
      )
    }

    const db = getDb()
    const { id } = await params

    const ujian = db.prepare(`
      SELECT id, kode_ujian, judul, durasi 
      FROM ujian 
      WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const ujianKelasData = db.prepare(`
      SELECT kelas_id FROM ujian_kelas WHERE ujian_id = ?
    `).all(id) as any[]

    if (!ujianKelasData || ujianKelasData.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const kelasIds = ujianKelasData.map(uk => uk.kelas_id)
    const placeholders = kelasIds.map(() => '?').join(', ')

    const siswaData = db.prepare(`
      SELECT s.id, s.nisn, s.nama, s.kelas_id, k.nama_kelas as kelas_nama
      FROM siswa s
      JOIN kelas k ON s.kelas_id = k.id
      WHERE s.kelas_id IN (${placeholders})
      ORDER BY s.nisn ASC
    `).all(...kelasIds) as any[]

    const sekolahData = db.prepare(`
      SELECT nama_sekolah, logo_url 
      FROM identitas_sekolah 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get() as any

    if (!sekolahData) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Gagal mengambil data sekolah' } },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const logoDataUrl = await convertLogoToBase64(sekolahData.logo_url)
    const kartuData: KartuUjianData[] = []

    for (const siswa of siswaData) {
      const qrCardData: QRCardData = {
        type: 'exam_login',
        u: ujian.id,
        s: siswa.id,
        k: ujian.kode_ujian,
        v: 1
      }

      const loginUrl = `${baseUrl}/ujian?u=${ujian.id}&s=${siswa.id}&k=${ujian.kode_ujian}`

      kartuData.push({
        siswa: {
          id: siswa.id,
          nisn: siswa.nisn,
          nama: siswa.nama,
          kelas: {
            id: siswa.kelas_id,
            nama_kelas: siswa.kelas_nama
          }
        },
        ujian: {
          id: ujian.id,
          kode_ujian: ujian.kode_ujian,
          judul: ujian.judul,
          durasi: ujian.durasi
        },
        sekolah: {
          nama_sekolah: sekolahData.nama_sekolah,
          logo_url: logoDataUrl
        },
        qrData: JSON.stringify(qrCardData),
        loginUrl
      })
    }

    return NextResponse.json({
      success: true,
      data: kartuData
    })

  } catch (error) {
    console.error('Get kartu ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
