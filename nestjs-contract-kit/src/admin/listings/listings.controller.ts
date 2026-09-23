import {
  Body,
  Controller,
  Get,
  Injectable,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ListingStatus, Permission } from '../common/enums';
import { RequestContext } from '../common/interfaces';
import { Paginated, PaginationQuery } from '../common/pagination';
import { AdminJwtGuard, ClientIp, CurrentAdmin, PermissionsGuard, RequirePermissions } from '../auth/security';

// ---------- DTOs ----------

export class BuyListingDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @Type(() => Number) @IsInt() @Min(1) moneyValue!: number; // e.g. 40 (₹40 = 9 $dollar)
  @Type(() => Number) @IsInt() @Min(1) pointQuantity!: number; // e.g. 9
  @Type(() => Number) @IsInt() @Min(0) availableQuantity!: number;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
  @IsOptional() @IsEnum(ListingStatus) status?: ListingStatus;
}

export class DemandListingDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @Type(() => Number) @IsInt() @Min(1) moneyValue!: number; // e.g. 20 (₹20 = 10 $dollar)
  @Type(() => Number) @IsInt() @Min(1) pointQuantity!: number; // e.g. 10
  @Type(() => Number) @IsInt() @Min(0) demandQuantity!: number;
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
  @IsOptional() @IsEnum(ListingStatus) status?: ListingStatus;
}

class ListingQuery extends PaginationQuery {
  status?: string;
}

// ---------- Service ports (IMPLEMENT over your listings tables; audit-log rate changes as RATE_CHANGED) ----------

export abstract class BuyListingsAdminService {
  abstract list(q: { status?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract create(dto: BuyListingDto, ctx: RequestContext): Promise<unknown>;
  abstract update(id: string, dto: Partial<BuyListingDto>, ctx: RequestContext): Promise<unknown>;
  abstract setStatus(id: string, status: ListingStatus, ctx: RequestContext): Promise<unknown>;
}

export abstract class DemandListingsAdminService {
  abstract list(q: { status?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract create(dto: DemandListingDto, ctx: RequestContext): Promise<unknown>;
  abstract update(id: string, dto: Partial<DemandListingDto>, ctx: RequestContext): Promise<unknown>;
  abstract setStatus(id: string, status: ListingStatus, ctx: RequestContext): Promise<unknown>;
}

const nope = (): never => {
  throw new NotImplementedException('Listings service not wired to database yet');
};

@Injectable()
export class UnimplementedBuyListingsAdminService extends BuyListingsAdminService {
  list = async () => nope();
  create = async () => nope();
  update = async () => nope();
  setStatus = async () => nope();
}

@Injectable()
export class UnimplementedDemandListingsAdminService extends DemandListingsAdminService {
  list = async () => nope();
  create = async () => nope();
  update = async () => nope();
  setStatus = async () => nope();
}

// ---------- Controllers ----------

@UseGuards(AdminJwtGuard, PermissionsGuard)
@RequirePermissions(Permission.MANAGE_BUY_LISTINGS)
@Controller('admin/buy-listings')
export class BuyListingsController {
  constructor(private readonly svc: BuyListingsAdminService) {}

  @Get()
  list(@Query() q: ListingQuery) {
    return this.svc.list({ status: q.status, page: q.page, limit: q.limit });
  }

  @Post()
  create(@Body() dto: BuyListingDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.create(dto, { adminId: u.adminId, ip });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<BuyListingDto>, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.update(id, dto, { adminId: u.adminId, ip });
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, ListingStatus.ACTIVE, { adminId: u.adminId, ip });
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, ListingStatus.PAUSED, { adminId: u.adminId, ip });
  }

  @Post(':id/close')
  close(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, ListingStatus.CLOSED, { adminId: u.adminId, ip });
  }
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@RequirePermissions(Permission.MANAGE_DEMAND_LISTINGS)
@Controller('admin/demand-listings')
export class DemandListingsController {
  constructor(private readonly svc: DemandListingsAdminService) {}

  @Get()
  list(@Query() q: ListingQuery) {
    return this.svc.list({ status: q.status, page: q.page, limit: q.limit });
  }

  @Post()
  create(@Body() dto: DemandListingDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.create(dto, { adminId: u.adminId, ip });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<DemandListingDto>, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.update(id, dto, { adminId: u.adminId, ip });
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, ListingStatus.ACTIVE, { adminId: u.adminId, ip });
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, ListingStatus.PAUSED, { adminId: u.adminId, ip });
  }

  @Post(':id/close')
  close(@Param('id') id: string, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.setStatus(id, ListingStatus.CLOSED, { adminId: u.adminId, ip });
  }
}
