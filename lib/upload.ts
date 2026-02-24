import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export type UploadResult = {
  url: string;
  filename: string;
  size: number;
};

export function validateImage(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '只支援 JPG、PNG、GIF、WebP 圖片格式' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '圖片大小不能超過 5MB' };
  }

  return { valid: true };
}

export function generateFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  const uniqueName = `${uuidv4()}${ext}`;
  return uniqueName;
}

export function getUploadPath(): string {
  return '/uploads/avatars';
}