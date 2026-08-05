// Shared image-resizing helpers for email embedding. Phone photos routinely
// run several MB — embedding the full-res Blob URL as an <img src> forces
// the email client to download the whole file just to render a tiny
// thumbnail, which is what made pet-design emails feel like they took
// forever to load. Resize down to a real thumbnail and upload *that* to
// Blob as its own small file — Gmail (especially its mobile app) frequently
// refuses to render inline base64 data-URI images at all, so a real hosted
// URL is required, not just smaller bytes.

import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const THUMB_MAX = 400;
const JPEG_QUALITY = 70;

export async function bufferToThumbUrl(buffer: Buffer): Promise<string> {
  const sharp = (await import('sharp')).default;
  const resized = await sharp(buffer)
    .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
  const blob = await put(`pet-design/thumbs/${randomUUID()}.jpg`, resized, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  return blob.url;
}

export async function urlToThumbUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return bufferToThumbUrl(buffer);
}
