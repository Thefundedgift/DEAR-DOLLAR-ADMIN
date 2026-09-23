import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AdminRole, Permission } from '../common/enums';
import { ADMIN_JWT_STRATEGY } from './admin-jwt.strategy';

// ---------- Guards ----------

@Injectable()
export class AdminJwtGuard extends AuthGuard(ADMIN_JWT_STRATEGY) {}

export const PERMISSIONS_KEY = 'admin:permissions';
export const SUPER_ADMIN_KEY = 'admin:superAdminOnly';

/** Backend is the FINAL permission authority — the panel only hides UI. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const superOnly = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const user = ctx.switchToHttp().getRequest().user as
      | { role: AdminRole; permissions: Permission[] }
      | undefined;
    if (!user) throw new ForbiddenException();

    if (superOnly && user.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin only');
    }
    if (!required?.length || user.role === AdminRole.SUPER_ADMIN) return true;

    const missing = required.filter((p) => !user.permissions?.includes(p));
    if (missing.length) throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`);
    return true;
  }
}

// ---------- Decorators ----------

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_KEY, true);

/** Injects { adminId, email, role, permissions } from the validated JWT. */
export const CurrentAdmin = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user;
});

/** Client IP helper for audit logging (respects X-Forwarded-For behind Nginx). */
export const ClientIp = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const xff = req.headers['x-forwarded-for'];
  return (Array.isArray(xff) ? xff[0] : xff?.split(',')[0])?.trim() || req.ip;
});
