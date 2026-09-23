import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto, LogoutDto, RefreshDto } from './dto';
import { AdminJwtGuard, CurrentAdmin } from './security';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  /** Strict brute-force protection: 5 attempts per minute per IP. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(AdminJwtGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: LogoutDto) {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @UseGuards(AdminJwtGuard)
  @Get('me')
  me(@CurrentAdmin() user: { adminId: string }) {
    return this.auth.me(user.adminId);
  }
}
