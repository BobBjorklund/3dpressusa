import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

// Token endpoint for client-side Blob uploads (src/components/PetPhotoUploadForm.tsx).
// Photos upload directly from the browser to Blob, bypassing this app's
// serverless function entirely — Vercel Functions cap request bodies around
// 4.5MB, and 4 full-res phone photos blow past that easily. This route only
// ever handles a small JSON handshake, never the image bytes themselves.

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
        maximumSizeInBytes: 10 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
