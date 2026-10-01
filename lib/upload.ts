// Shared upload rules: allowed types, size limit and magic-byte detection.
export const MAX_UPLOAD_BYTES = 50_000_000;
export const UPLOAD_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
} as const;
export type UploadType = keyof typeof UPLOAD_TYPES;
export const UPLOAD_ERROR = 'Upload a JPEG, PNG, WebP image, MP4 or WebM video, or PDF.';

// Detects the real file type from its first bytes (needs at least 12).
export function sniff(bytes: Uint8Array): UploadType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 137 && bytes[1] === 80) return 'image/png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  if (bytes.length > 12 && ascii(4, 8) === 'ftyp') return 'video/mp4';
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'video/webm';
  return null;
}

// Blob pathnames are always media/<uuid>.<ext>; the public URL is /media/<uuid>.<ext>.
export const MEDIA_KEY = /^[a-f0-9-]{36}\.(jpg|png|webp|pdf|mp4|webm)$/;
