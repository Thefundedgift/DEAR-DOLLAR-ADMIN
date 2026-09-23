import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminJwtStrategy } from './auth/admin-jwt.strategy';
import { AdminUsersRepository, InMemoryAdminUsersRepository } from './auth/admin-users.repository';
import { InMemoryRefreshTokenStore, RefreshTokenStore } from './auth/token.store';
import { PermissionsGuard } from './auth/security';

import { DashboardController, DashboardStatsService, UnimplementedDashboardStatsService } from './dashboard/dashboard.controller';
import { CustomersAdminService, CustomersController, UnimplementedCustomersAdminService } from './customers/customers.controller';
import {
  BuyListingsAdminService,
  BuyListingsController,
  DemandListingsAdminService,
  DemandListingsController,
  UnimplementedBuyListingsAdminService,
  UnimplementedDemandListingsAdminService,
} from './listings/listings.controller';
import {
  BuyRequestsAdminService,
  BuyRequestsController,
  SellRequestsAdminService,
  SellRequestsController,
  UnimplementedBuyRequestsAdminService,
  UnimplementedSellRequestsAdminService,
} from './requests/requests.controller';
import { PaymentsAdminService, PaymentsController, UnimplementedPaymentsAdminService } from './payments/payments.controller';
import { LocalDiskQrStorageService, QrStorageService } from './payments/qr-storage.service';
import { AdminsAdminService, AdminsController } from './admins/admins.controller';
import { AuditLogService, UnimplementedAuditLogService } from './audit/audit-log.service';
import { AuditLogsController } from './audit/audit-logs.controller';
import { ReportsAdminService, ReportsController, UnimplementedReportsAdminService } from './reports/reports.controller';
import { SocialLinksController, SocialLinksService, UnimplementedSocialLinksService } from './settings/social-links.controller';

/**
 * Drop-in admin module for the existing DEAR DOLLAR NestJS backend.
 *
 * TO WIRE UP: replace every `useClass: Unimplemented*` / `InMemory*` provider
 * below with your real implementation over the existing database.
 */
@Module({
  imports: [
    PassportModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET,
      signOptions: { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '15m' },
    }),
  ],
  controllers: [
    AdminAuthController,
    DashboardController,
    CustomersController,
    BuyListingsController,
    DemandListingsController,
    BuyRequestsController,
    SellRequestsController,
    PaymentsController,
    AdminsController,
    AuditLogsController,
    ReportsController,
    SocialLinksController,
  ],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    PermissionsGuard,
    AdminsAdminService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // ---- Persistence ports: REPLACE with your DB implementations ----
    { provide: AdminUsersRepository, useClass: InMemoryAdminUsersRepository },
    { provide: RefreshTokenStore, useClass: InMemoryRefreshTokenStore },

    // ---- Domain ports: REPLACE with implementations over your existing services ----
    { provide: DashboardStatsService, useClass: UnimplementedDashboardStatsService },
    { provide: CustomersAdminService, useClass: UnimplementedCustomersAdminService },
    { provide: BuyListingsAdminService, useClass: UnimplementedBuyListingsAdminService },
    { provide: DemandListingsAdminService, useClass: UnimplementedDemandListingsAdminService },
    { provide: BuyRequestsAdminService, useClass: UnimplementedBuyRequestsAdminService },
    { provide: SellRequestsAdminService, useClass: UnimplementedSellRequestsAdminService },
    { provide: PaymentsAdminService, useClass: UnimplementedPaymentsAdminService },
    // QR upload works out of the box on local disk; swap for S3/MinIO if preferred.
    { provide: QrStorageService, useClass: LocalDiskQrStorageService },
    { provide: ReportsAdminService, useClass: UnimplementedReportsAdminService },
    { provide: SocialLinksService, useClass: UnimplementedSocialLinksService },
    { provide: AuditLogService, useClass: UnimplementedAuditLogService },
  ],
})
export class AdminModule {}
