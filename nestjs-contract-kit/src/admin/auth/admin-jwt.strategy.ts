import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminJwtPayload } from './admin-auth.service';

export const ADMIN_JWT_STRATEGY = 'admin-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, ADMIN_JWT_STRATEGY) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ADMIN_JWT_SECRET as string,
    });
  }

  // Attached to request.user
  validate(payload: AdminJwtPayload) {
    return {
      adminId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions ?? [],
    };
  }
}
