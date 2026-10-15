import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['SUPER_ADMIN', 'CLUB_ADMIN', 'COACH', 'ATHLETE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('certificate') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No certificate file provided.' }, { status: 400 });
    }

    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 8MB size limit.' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'The certificate file is empty.' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, PNG, JPEG, and WebP certificates are allowed.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const signatures: Record<string, (data: Buffer) => boolean> = {
      'image/jpeg': (data) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
      'image/png': (data) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      'image/webp': (data) => data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP',
      'application/pdf': (data) => data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-',
    };
    if (!signatures[file.type](buffer)) {
      return NextResponse.json({ error: 'File contents do not match the declared certificate type.' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    const originalExt = path.extname(file.name);
    const sanitizedBase = path.basename(file.name, originalExt).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) || 'certificate';
    const uniqueFilename = `cert_${crypto.randomUUID()}_${sanitizedBase}${extensions[file.type]}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await fs.promises.writeFile(filePath, buffer, { flag: 'wx' });

    const fileUrl = `/uploads/certificates/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Certificate upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload certificate evidence.' },
      { status: 500 }
    );
  }
}
