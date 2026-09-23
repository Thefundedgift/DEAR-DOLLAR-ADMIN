import {
  Body,
  Controller,
  Get,
  Injectable,
  NotImplementedException,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { RequestContext } from '../common/interfaces';
import { AdminJwtGuard, ClientIp, CurrentAdmin, PermissionsGuard, SuperAdminOnly } from '../auth/security';

export class SocialLinksDto {
  @IsOptional() @IsUrl({ require_tld: false }) telegramUrl?: string;
  @IsBoolean() telegramEnabled!: boolean;
  @IsOptional() @IsUrl({ require_tld: false }) discordUrl?: string;
  @IsBoolean() discordEnabled!: boolean;
}

/**
 * IMPLEMENT over a settings table (stored in DB, never hardcoded in frontend).
 * update() must write an audit log entry (action: SOCIAL_LINKS_CHANGED) with old/new values.
 * Expose an equivalent PUBLIC read endpoint for the customer app if needed.
 */
export abstract class SocialLinksService {
  abstract get(): Promise<SocialLinksDto>;
  abstract update(dto: SocialLinksDto, ctx: RequestContext): Promise<SocialLinksDto>;
}

@Injectable()
export class UnimplementedSocialLinksService extends SocialLinksService {
  private nope(): never {
    throw new NotImplementedException('SocialLinksService not wired to database yet');
  }
  get = async () => this.nope();
  update = async () => this.nope();
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@SuperAdminOnly()
@Controller('admin/settings/social-links')
export class SocialLinksController {
  constructor(private readonly svc: SocialLinksService) {}

  @Get()
  get() {
    return this.svc.get();
  }

  @Put()
  update(@Body() dto: SocialLinksDto, @CurrentAdmin() u: { adminId: string }, @ClientIp() ip: string) {
    return this.svc.update(dto, { adminId: u.adminId, ip });
  }
}
