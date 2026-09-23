import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/** Minimal shape of the multer file (avoids a hard dependency on @types/multer). */
export interface UploadedQrFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

/**
 * Storage port for the UPI QR image. Swap for S3/MinIO if preferred —
 * anything self-hostable works; no proprietary cloud required.
 */
export abstract class QrStorageService {
  abstract saveQrImage(file: UploadedQrFile): Promise<{ url: string }>;
}

/**
 * WORKING local-disk implementation.
 * - Saves to `${UPLOAD_DIR:-./uploads}/qr/<random>.<ext>`
 * - Returns `${PUBLIC_ASSETS_URL}/qr/<name>` — serve the uploads dir statically:
 *   Nginx:   location /uploads/ { alias /opt/deardollar/backend/uploads/; }
 *   or Nest: ServeStaticModule.forRoot({ rootPath: 'uploads', serveRoot: '/uploads' })
 * Env: UPLOAD_DIR=./uploads   PUBLIC_ASSETS_URL=https://api.yourdomain.com/uploads
 */
@Injectable()
export class LocalDiskQrStorageService extends QrStorageService {
  async saveQrImage(file: UploadedQrFile): Promise<{ url: string }> {
    if (!file?.buffer?.length) throw new BadRequestException('No file uploaded (expected field "file")');
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('Only PNG, JPG or WebP images are allowed');
    }
    const baseDir = process.env.UPLOAD_DIR ?? './uploads';
    const dir = join(baseDir, 'qr');
    await mkdir(dir, { recursive: true });

    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${EXT[file.mimetype]}`;
    await writeFile(join(dir, name), file.buffer);

    const publicBase = (process.env.PUBLIC_ASSETS_URL ?? '/uploads').replace(/\/$/, '');
    return { url: `${publicBase}/qr/${name}` };
  }
}
