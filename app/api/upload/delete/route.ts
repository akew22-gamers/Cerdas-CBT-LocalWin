import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getUploadsDir } from '@/lib/db/client';

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      );
    }

    const { filePath, folder = 'soal-images' } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE_PATH', message: 'File path tidak ditemukan' } },
        { status: 400 }
      );
    }

    const uploadsDir = getUploadsDir();
    const fullPath = path.join(uploadsDir, folder, path.basename(filePath));

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_NOT_FOUND', message: 'File tidak ditemukan' } },
        { status: 404 }
      );
    }

    await unlink(fullPath);

    return NextResponse.json({
      success: true,
      message: 'File berhasil dihapus'
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}