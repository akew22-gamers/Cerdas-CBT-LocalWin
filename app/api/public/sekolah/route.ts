import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: sekolah, error } = await supabase
      .from('identitas_sekolah')
      .select('nama_sekolah, logo_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !sekolah) {
      return NextResponse.json({
        success: true,
        data: {
          nama_sekolah: 'Sekolah Default',
          logo_url: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        nama_sekolah: sekolah.nama_sekolah || 'Sekolah Default',
        logo_url: sekolah.logo_url
      }
    })

  } catch (error) {
    console.error('Get school identity error:', error)
    return NextResponse.json({
      success: true,
      data: {
        nama_sekolah: 'Sekolah Default',
        logo_url: null
      }
    })
  }
}
