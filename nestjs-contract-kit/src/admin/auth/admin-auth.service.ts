import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { AdminStatus } from '../common/enums';
import { AdminProfile, toProfile } from '../common/interfaces';
import { AdminUsersRepository } from './admin-users.repository';
import { RefreshTokenStore, hashToken, newOpaqueToken } from './token.store';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

/**
 * FULLY IMPLEMENTED admin authentication:
 * - argon2id password verification (hashes created with argon2.hash on admin create)
 * - short-lived JWT access tokens
 * - opaque refresh tokens, stored hashed, with ROTATION (old token revoked on refresh)
 * - logout = refresh token revocation
 * Login rate limiting is applied at the controller via @nestjs/throttler.
 */
@Injectable()
export class AdminAuthService {
  private readonly refreshTtlMs =
    Number(process.env.ADMIN_REFRESH_TTL_DAYS ?? 7) * 24 * 60 * 60 * 1000;

  constructor(
    private readonly jwt: JwtService,
    private readonly admins: AdminUsersRepository,
    private readonly tokens: RefreshTokenStore,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const admin = await this.admins.findByEmail(email);
    // Uniform error: never reveal whether the email exists.
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    if (admin.status !== AdminStatus.ACTIVE) throw new UnauthorizedException('Account disabled');

    const ok = await argon2.verify(admin.passwordHash, password).catch(() => false);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.admins.touchLastLogin(admin.id);
    const refreshToken = await this.issueRefreshToken(admin.id);
    return {
      accessToken: this.issueAccessToken(admin.id, admin.email, admin.role, admin.permissions),
      refreshToken,
      admin: toProfile(admin),
    };
  }

  /** Refresh-token ROTATION: validates, revokes the old token, issues a new pair. */
  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const record = await this.tokens.findByHash(hashToken(rawRefreshToken));
    if (!record) throw new UnauthorizedException('Invalid refresh token');

    if (record.revokedAt) {
      // Reuse of a revoked token => possible theft. Revoke the whole family.
      await this.tokens.revokeAllForAdmin(record.adminId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (record.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Refresh token expired');

    const admin = await this.admins.findById(record.adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE) throw new UnauthorizedException('Account disabled');

    await this.tokens.revoke(record.id); // rotation
    const refreshToken = await this.issueRefreshToken(admin.id);
    return {
      accessToken: this.issueAccessToken(admin.id, admin.email, admin.role, admin.permissions),
      refreshToken,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const record = await this.tokens.findByHash(hashToken(rawRefreshToken));
    if (record && !record.revokedAt) await this.tokens.revoke(record.id);
  }

  async me(adminId: string): Promise<AdminProfile> {
    const admin = await this.admins.findById(adminId);
    if (!admin) throw new UnauthorizedException();
    return toProfile(admin);
  }

  private issueAccessToken(sub: string, email: string, role: string, permissions: string[]): string {
    const payload: AdminJwtPayload = { sub, email, role, permissions };
    return this.jwt.sign(payload); // secret + expiry configured in AdminModule
  }

  private async issueRefreshToken(adminId: string): Promise<string> {
    const raw = newOpaqueToken();
    await this.tokens.save({
      id: randomUUID(),
      adminId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      revokedAt: null,
    });
    return raw;
  }
}
