import { createHash, randomBytes } from 'crypto';

export interface RefreshTokenRecord {
  id: string;
  adminId: string;
  tokenHash: string; // sha256 of the opaque token — NEVER store the raw token
  expiresAt: Date;
  revokedAt: Date | null;
}

export const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');
export const newOpaqueToken = () => randomBytes(48).toString('base64url');

/**
 * Persistence port for refresh tokens (rotation + revocation).
 * IMPLEMENT THIS over an `admin_refresh_tokens` table.
 */
export abstract class RefreshTokenStore {
  abstract save(record: RefreshTokenRecord): Promise<void>;
  abstract findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeAllForAdmin(adminId: string): Promise<void>;
}

/** In-memory reference implementation — LOCAL TESTING ONLY. Replace with DB. */
export class InMemoryRefreshTokenStore extends RefreshTokenStore {
  private readonly rows = new Map<string, RefreshTokenRecord>();

  async save(record: RefreshTokenRecord) {
    this.rows.set(record.id, record);
  }
  async findByHash(tokenHash: string) {
    return [...this.rows.values()].find((r) => r.tokenHash === tokenHash) ?? null;
  }
  async revoke(id: string) {
    const r = this.rows.get(id);
    if (r) this.rows.set(id, { ...r, revokedAt: new Date() });
  }
  async revokeAllForAdmin(adminId: string) {
    for (const r of this.rows.values()) {
      if (r.adminId === adminId && !r.revokedAt) this.rows.set(r.id, { ...r, revokedAt: new Date() });
    }
  }
}
