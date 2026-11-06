import crypto from 'node:crypto';
import { readImageSize } from '@/lib/listings/imageInfo';

const BUCKET = 'listing-photos';

// A Server Action body cannot pass Vercel's 4.5MB request limit, so photos sent
// this way top out just under it. The founder's rule is 5MB; files between the
// two need the direct-to-storage upload that is still to come.
export const MAX_LISTING_PHOTO_BYTES = 4 * 1024 * 1024;

export function isListingUploadConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getConfig(): { baseUrl: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Photo upload is not configured yet.');
  return { baseUrl: `${url.replace(/\/$/, '')}/storage/v1`, serviceKey };
}

// Product photos are shown to buyers, so the bucket is public-read and the
// path is random and server-made.
export function listingPhotoUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${url.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${path}`;
}

export interface StoredListingPhoto {
  path: string;
  widthPx: number;
  heightPx: number;
  sizeBytes: number;
}

export async function uploadListingPhoto(sellerId: string, file: File): Promise<StoredListingPhoto> {
  if (file.size === 0) throw new Error('The selected photo is empty.');
  if (file.size > MAX_LISTING_PHOTO_BYTES) throw new Error('Each photo must be 4 MB or smaller for now.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = readImageSize(bytes);
  if (!info) throw new Error('Photos must be JPEG or PNG files.');

  const { baseUrl, serviceKey } = getConfig();
  const path = `${sellerId}/${crypto.randomUUID()}.${info.ext}`;
  const res = await fetch(`${baseUrl}/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': info.contentType, 'x-upsert': 'false' },
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Photo upload failed (${res.status}).`);
  }
  return { path, widthPx: info.widthPx, heightPx: info.heightPx, sizeBytes: file.size };
}

export async function deleteListingPhotoFile(path: string): Promise<void> {
  const { baseUrl, serviceKey } = getConfig();
  await fetch(`${baseUrl}/object/${BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${serviceKey}` },
  }).catch(() => {});
}
