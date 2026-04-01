import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/upload/image - Upload image to Supabase Storage
export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File tidak ditemukan' } },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILE_TYPE', message: 'File harus berupa gambar (JPEG, PNG, GIF, atau WebP)' } },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'Ukuran file maksimal 5MB' } },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `soal-images/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('soal-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Check if bucket doesn't exist
      if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'BUCKET_NOT_FOUND', 
              message: 'Bucket "soal-images" belum dibuat. Harap buat bucket di Supabase Storage terlebih dahulu.' 
            } 
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: uploadError.message } },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('soal-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: fileName,
        filePath: filePath
      }
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
