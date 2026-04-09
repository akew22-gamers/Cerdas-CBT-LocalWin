import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getUploadsDir } from '@/lib/db/client';
import { needsCompression, formatFileSize } from '@/lib/utils/compress-image';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'soal-images';
    const oldFilePath = formData.get('oldFilePath') as string | null;
    const maxSizeKB = parseInt(formData.get('maxSizeKB') as string) || 100;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File tidak ditemukan' } },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILE_TYPE', message: 'File harus berupa gambar (JPEG, PNG, GIF, atau WebP)' } },
        { status: 400 }
      );
    }

    let fileToUpload = file;
    let compressionMessage = '';

    if (needsCompression(file, maxSizeKB)) {
      try {
        const originalSize = file.size;
        const compressedBuffer = await compressImage(await file.arrayBuffer(), maxSizeKB);
        fileToUpload = new File([new Uint8Array(compressedBuffer)], file.name, { type: file.type });
        compressionMessage = `Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(fileToUpload.size)}`;
      } catch (compressError) {
        console.log('Compression skipped:', compressError);
      }
    }

    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const uploadsDir = getUploadsDir();
    const folderPath = path.join(uploadsDir, folder);

    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    const relativePath = `/uploads/${folder}/${fileName}`;

    const arrayBuffer = await fileToUpload.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    if (oldFilePath) {
      try {
        const oldFullPath = path.join(uploadsDir, '..', oldFilePath.replace('/uploads/', ''));
        if (existsSync(oldFullPath)) {
          const { unlink } = await import('fs/promises');
          await unlink(oldFullPath);
          console.log('Old file deleted:', oldFilePath);
        }
      } catch (deleteError) {
        console.error('Failed to delete old file:', deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: relativePath,
        filename: fileName,
        filePath: relativePath,
        size: fileToUpload.size,
        compression: compressionMessage || 'No compression needed'
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}

async function compressImage(arrayBuffer: ArrayBuffer, maxSizeKB: number): Promise<Buffer> {
  const sharp = await import('sharp').catch(() => null);
  
  if (sharp) {
    const buffer = Buffer.from(arrayBuffer);
    return await sharp.default(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  return Buffer.from(arrayBuffer);
}