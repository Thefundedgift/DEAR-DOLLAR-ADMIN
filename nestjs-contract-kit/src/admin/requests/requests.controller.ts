import {
  Body,
  Controller,
  Get,
  Injectable,
  NotImplementedException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NoteDto, RejectDto } from '../common/action.dto';
import { Permission } from '../common/enums';
import { RequestContext } from '../common/interfaces';
import { Paginated, PaginationQuery } from '../common/pagination';
import { AdminJwtGuard, ClientIp, CurrentAdmin, PermissionsGuard, RequirePermissions } from '../auth/security';

class RequestQuery extends PaginationQuery {
  status?: string;
}

/**
 * IMPLEMENT approve/reject as DB TRANSACTIONS with FINAL VALIDATION:
 * re-check request status, listing availability and wallet balances server-side,
 * perform wallet credit/debit atomically, write audit log (BUY_APPROVED / SELL_APPROVED).
 * The admin panel NEVER modifies wallets — only these methods do.
 */
export abstract class BuyRequestsAdminService {
  abstract list(q: { status?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract approve(id: string, note: string | undefined, ctx: RequestContext): Promise<unknown>;
  abstract reject(id: string, reason: string, ctx: RequestContext): Promise<unknown>;
}

export abstract class SellRequestsAdminService {
  abstract list(q: { status?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract approve(id: string, note: string | undefined, ctx: RequestContext): Promise<unknown>;
  abstract reject(id: string, reason: string, ctx: RequestContext): Promise<unknown>;
}

const nope = (): never => {
  throw new NotImplementedException('Requests service not wired to database yet');
};

@Injectable()
export class UnimplementedBuyRequestsAdminService extends BuyRequestsAdminService {
  list = async () => nope();
  approve = async () => nope();
  reject = async () => nope();
}

@Injectable()
export class UnimplementedSellRequestsAdminService extends SellRequestsAdminService {
  list = async () => nope();
  approve = async () => nope();
  reject = async () => nope();
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@RequirePermissions(Permission.APPROVE_BUY)
@Controller('admin/buy-requests')
export class BuyRequestsController {
  constructor(private readonly svc: BuyRequestsAdminService) {}

  @Get()
  list(@Query() q: RequestQuery) {
    return this.svc.list({ status: q.status, page: q.page, limit: q.limit });
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: NoteDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.approve(id, dto.note, { adminId: u.adminId, ip });
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.reject(id, dto.reason, { adminId: u.adminId, ip });
  }
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@RequirePermissions(Permission.APPROVE_SELL)
@Controller('admin/sell-requests')
export class SellRequestsController {
  constructor(private readonly svc: SellRequestsAdminService) {}

  @Get()
  list(@Query() q: RequestQuery) {
    return this.svc.list({ status: q.status, page: q.page, limit: q.limit });
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: NoteDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.approve(id, dto.note, { adminId: u.adminId, ip });
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.reject(id, dto.reason, { adminId: u.adminId, ip });
  }
}
