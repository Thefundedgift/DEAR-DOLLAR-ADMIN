import { Controller, Get, Injectable, NotImplementedException, UseGuards } from '@nestjs/common';
import { AdminJwtGuard, PermissionsGuard } from '../auth/security';
import { DashboardStats } from '../common/interfaces';

/** IMPLEMENT by aggregating your existing tables (customers, payments, requests, listings). */
export abstract class DashboardStatsService {
  abstract getStats(): Promise<DashboardStats>;
}

@Injectable()
export class UnimplementedDashboardStatsService extends DashboardStatsService {
  async getStats(): Promise<never> {
    throw new NotImplementedException('DashboardStatsService not wired to database yet');
  }
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly stats: DashboardStatsService) {}

  @Get('stats')
  getStats() {
    return this.stats.getStats();
  }
}
