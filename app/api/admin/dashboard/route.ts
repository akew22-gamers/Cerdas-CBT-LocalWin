import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const { data: guruData, error: guruError } = await supabase
      .from('guru')
      .select('id, nama, created_at')

    if (guruError) throw guruError

    const { data: siswaData, error: siswaError } = await supabase
      .from('siswa')
      .select('id')

    if (siswaError) throw siswaError

    const { data: ujianData, error: ujianError } = await supabase
      .from('ujian')
      .select('id, status')

    if (ujianError) throw ujianError

    const ujianAktif = ujianData.filter((u: any) => u.status === 'aktif').length

    const recentGuru = (guruData || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((g: any) => ({
        id: g.id,
        nama: g.nama,
        created_at: g.created_at
      }))

    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_log')
      .select(`
        id,
        role,
        action,
        entity_type,
        details,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
    }

    const formattedAuditLogs = (auditLogs || []).map((log: any) => ({
      id: log.id,
      role: log.role,
      action: log.action,
      entity_type: log.entity_type,
      details: log.details,
      created_at: log.created_at
    }))

    return NextResponse.json({
      success: true,
      data: {
        total_guru: guruData.length,
        total_siswa: siswaData.length,
        total_ujian: ujianData.length,
        ujian_aktif: ujianAktif,
        recent_guru: recentGuru,
        recent_audit_logs: formattedAuditLogs
      }
    })

  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
