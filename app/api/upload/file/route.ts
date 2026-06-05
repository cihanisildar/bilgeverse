import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { uploadToS3 } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// Allowed material file types (documents + common video formats)
const ALLOWED_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const roles: string[] = session?.user?.roles || (session?.user?.role ? [session.user.role] : []);
    const allowedRoles = ['ADMIN', 'TUTOR', 'ASISTAN', 'BOARD_MEMBER'];
    if (!session?.user || !roles.some((r) => allowedRoles.includes(r))) {
      return NextResponse.json(
        { error: 'Yetkisiz: Yalnızca eğitmen veya yöneticiler dosya yükleyebilir.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya türü. PDF, Office belgeleri, görsel veya video yükleyebilirsiniz.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. En fazla 50MB yükleyebilirsiniz.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const safeBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 40);
    const filename = `${timestamp}_${randomString}_${safeBase}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await uploadToS3(buffer, filename, file.type, 'academy');

    return NextResponse.json({
      message: 'Dosya başarıyla yüklendi.',
      url: uploadResult.url,
      filename: uploadResult.filename,
      key: uploadResult.key,
    });
  } catch (error) {
    console.error('Academy file upload error:', error);
    return NextResponse.json({ error: 'Dosya yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}
