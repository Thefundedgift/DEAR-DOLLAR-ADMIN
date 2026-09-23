import {
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { AdminRole, AdminStatus, Permission } from '../common/enums';
import { toProfile } from '../common/interfaces';
import { PaginationQuery, paginate } from '../common/pagination';
import { AdminUsersRepository } from '../auth/admin-users.repository';
import { RefreshTokenStore } from '../auth/token.store';
import { AuditLogService } from '../audit/audit-log.service';
import { AdminJwtGuard, ClientIp, CurrentAdmin, PermissionsGuard, RequirePermissions, SuperAdminOnly } from '../auth/security';

export class CreateAdminDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() mobile?: string;
  @IsString() @MinLength(10) password!: string;
  @IsEnum(AdminRole) role!: AdminRole;
  @IsArray() @IsEnum(Permission, { each: true }) permissions!: Permission[];
  @IsEnum(AdminStatus) status!: AdminStatus;
}

export class UpdateAdminDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsString() @MinLength(10) password?: string;
  @IsOptional() @IsEnum(AdminRole) role?: AdminRole;
  @IsOptional() @IsArray() @IsEnum(Permission, { each: true }) permissions?: Permission[];
  @IsOptional() @IsEnum(AdminStatus) status?: AdminStatus;
}

/**
 * FULLY IMPLEMENTED on top of AdminUsersRepository + RefreshTokenStore + AuditLogService.
 * Passwords hashed with argon2id; disabling an admin revokes all their refresh tokens.
 */
@Injectable()
export class AdminsAdminService {
  constructor(
    private readonly repo: AdminUsersRepository,
    private readonly tokens: RefreshTokenStore,
    private readonly audit: AuditLogService,
  ) {}

  async list(page: number, limit: number) {
    const { items, total } = await this.repo.list(page, limit);
    return paginate(items.map(toProfile), total, { page, limit } as PaginationQuery);
  }

  async create(dto: CreateAdminDto, ctx: { adminId: string; ip?: string }) {
    if (await this.repo.findByEmail(dto.email)) throw new ConflictException('Email already in use');
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const created = await this.repo.create({
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      role: dto.role,
      permissions: dto.role === AdminRole.SUPER_ADMIN ? [] : dto.permissions,
      status: dto.status,
      passwordHash,
    });
    await this.audit.record(ctx, {
      action: 'ADMIN_CREATED',
      entity: 'ADMIN',
      entityId: created.id,
      newValue: { name: created.name, email: created.email, role: created.role, permissions: created.permissions },
    });
    return toProfile(created);
  }

  async update(id: string, dto: UpdateAdminDto, ctx: { adminId: string; ip?: string }) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Admin not found');
    const patch: Record<string, unknown> = { ...dto };
    delete patch.password;
    if (dto.password) patch.passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const updated = await this.repo.update(id, patch);
    await this.audit.record(ctx, {
      action: 'ADMIN_UPDATED',
      entity: 'ADMIN',
      entityId: id,
      oldValue: { role: existing.role, permissions: existing.permissions, status: existing.status },
      newValue: { role: updated.role, permissions: updated.permissions, status: updated.status },
    });
    return toProfile(updated);
  }

  async setStatus(id: string, status: AdminStatus, ctx: { adminId: string; ip?: string }) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Admin not found');
    const updated = await this.repo.update(id, { status });
    if (status === AdminStatus.DISABLED) await this.tokens.revokeAllForAdmin(id); // immediate lockout
    await this.audit.record(ctx, {
      action: status === AdminStatus.DISABLED ? 'ADMIN_DISABLED' : 'ADMIN_ENABLED',
      entity: 'ADMIN',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status },
    });
    return toProfile(updated);
  }
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@SuperAdminOnly()
@RequirePermissions(Permission.MANAGE_ADMINS)
@Controller('admin/admins')
export class AdminsController {
  constructor(private readonly svc: AdminsAdminService) {}

  @Get()
  list(@Query() q: PaginationQuery) {
    return this.svc.list(q.page, q.limit);
  }

  @Post()
  create(@Body() dto: CreateAdminDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.create(dto, { adminId: u.adminId, ip });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.update(id, dto, { adminId: u.adminId, ip });
  }

  @Post(':id/disable')
  disable(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, AdminStatus.DISABLED, { adminId: u.adminId, ip });
  }

  @Post(':id/enable')
  enable(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, AdminStatus.ACTIVE, { adminId: u.adminId, ip });
  }
}
