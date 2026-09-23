import {
  Body,
  Controller,
  Get,
  Injectable,
  NotImplementedException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { NoteDto, RejectDto } from '../common/action.dto';
import { Permission } from '../common/enums';
import { RequestContext } from '../common/interfaces';
import { Paginated, PaginationQuery } from '../common/pagination';
import { AdminJwtGuard, ClientIp, CurrentAdmin, PermissionsGuard, RequirePermissions, SuperAdminOnly } from '../auth/security';

class PaymentQuery extends PaginationQuery {
  status?: string;
}

export class PaymentSettingsDto {
  @IsString() @IsNotEmpty() upiId!: string;
  @IsString() @IsNotEmpty() merchantName!: string;
  @IsOptional() @IsUrl({ require_tld: false }) qrImageUrl?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsBoolean() enabled!: boolean;
}

/**
 * IMPLEMENT:
 * - verify(): transactional — re-validate UTR/status, credit Money Wallet, audit PAYMENT_VERIFIED.
 *   ONLY this backend method may credit the wallet.
 * - Payment settings are VERSIONED: updateSettings() INSERTS a new row (never updates old ones),
 *   old payment records keep referencing their original config. Audit UPI_CHANGED / QR_CHANGED.
 */
export abstract class PaymentsAdminService {
  abstract list(q: { status?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract verify(id: string, note: string | undefined, ctx: RequestContext): Promise<unknown>;
  abstract reject(id: string, reason: string, ctx: RequestContext): Promise<unknown>;
  abstract getCurrentSettings(): Promise<unknown>;
  abstract getSettingsHistory(): Promise<unknown[]>;
  abstract updateSettings(dto: PaymentSettingsDto, ctx: RequestContext): Promise<unknown>;
}

@Injectable()
export class UnimplementedPaymentsAdminService extends PaymentsAdminService {
  private nope(): never {
    throw new NotImplementedException('PaymentsAdminService not wired to database yet');
  }
  list = async () => this.nope();
  verify = async () => this.nope();
  reject = async () => this.nope();
  getCurrentSettings = async () => this.nope();
  getSettingsHistory = async () => this.nope();
  updateSettings = async () => this.nope();
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@Controller('admin')
export class PaymentsController {
  constructor(private readonly svc: PaymentsAdminService) {}

  @Get('payments')
  @RequirePermissions(Permission.VERIFY_PAYMENTS)
  list(@Query() q: PaymentQuery) {
    return this.svc.list({ status: q.status, page: q.page, limit: q.limit });
  }

  @Post('payments/:id/verify')
  @RequirePermissions(Permission.VERIFY_PAYMENTS)
  verify(@Param('id') id: string, @Body() dto: NoteDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.verify(id, dto.note, { adminId: u.adminId, ip });
  }

  @Post('payments/:id/reject')
  @RequirePermissions(Permission.VERIFY_PAYMENTS)
  reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.reject(id, dto.reason, { adminId: u.adminId, ip });
  }

  // ---- Payment settings: SUPER ADMIN ONLY ----

  @Get('payment-settings')
  @SuperAdminOnly()
  @RequirePermissions(Permission.MANAGE_PAYMENT_SETTINGS)
  current() {
    return this.svc.getCurrentSettings();
  }

  @Get('payment-settings/history')
  @SuperAdminOnly()
  @RequirePermissions(Permission.MANAGE_PAYMENT_SETTINGS)
  history() {
    return this.svc.getSettingsHistory();
  }

  @Put('payment-settings')
  @SuperAdminOnly()
  @RequirePermissions(Permission.MANAGE_PAYMENT_SETTINGS)
  update(@Body() dto: PaymentSettingsDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.updateSettings(dto, { adminId: u.adminId, ip });
  }
}
