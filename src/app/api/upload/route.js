import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'photo';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = file.name || `photo_${Date.now()}.jpg`;
    const fileName = `${type}_${Date.now()}_${originalName.replace(/\s+/g, '_')}`;

    const result = await uploadToCloudinary({ buffer, fileName, type });

    return NextResponse.json({
      success: true,
      url: result.url,
      webViewLink: result.url,
      directLink: result.url,
      folder: result.folder,
    });
  } catch (err) {
    console.error('Error uploading file to Cloudinary:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
