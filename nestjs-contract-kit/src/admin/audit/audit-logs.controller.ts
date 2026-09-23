import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../common/enums';
import { PaginationQuery } from '../common/pagination';
import { AuditLogService } from './audit-log.service';
import { AdminJwtGuard, PermissionsGuard, RequirePermissions } from '../auth/security';

class AuditQuery extends PaginationQuery {
  adminId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly audit: AuditLogService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  list(@Query() q: AuditQuery) {
    return this.audit.list({
      adminId: q.adminId,
      action: q.action,
      entity: q.entity,
      from: q.from,
      to: q.to,
      page: q.page,
      limit: q.limit,
    });
  }
}
