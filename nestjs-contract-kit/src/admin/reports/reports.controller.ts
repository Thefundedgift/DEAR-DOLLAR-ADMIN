import {
  Controller,
  Get,
  Header,
  Injectable,
  NotImplementedException,
  Param,
  ParseEnumPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permission, ReportType } from '../common/enums';
import { Paginated, PaginationQuery } from '../common/pagination';
import { AdminJwtGuard, PermissionsGuard, RequirePermissions } from '../auth/security';

class ReportQuery extends PaginationQuery {
  from?: string;
  to?: string;
  customerId?: string;
  status?: string;
  type?: string;
}

/** IMPLEMENT each report as a query over your existing tables. Export returns CSV text. */
export abstract class ReportsAdminService {
  abstract get(type: ReportType, filters: ReportQuery): Promise<Paginated<Record<string, unknown>>>;
  abstract exportCsv(type: ReportType, filters: ReportQuery): Promise<string>;
}

@Injectable()
export class UnimplementedReportsAdminService extends ReportsAdminService {
  private nope(): never {
    throw new NotImplementedException('ReportsAdminService not wired to database yet');
  }
  get = async () => this.nope();
  exportCsv = async () => this.nope();
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@RequirePermissions(Permission.VIEW_REPORTS)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly svc: ReportsAdminService) {}

  @Get(':type')
  get(@Param('type', new ParseEnumPipe(ReportType)) type: ReportType, @Query() q: ReportQuery) {
    return this.svc.get(type, q);
  }

  @Get(':type/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="report.csv"')
  export(@Param('type', new ParseEnumPipe(ReportType)) type: ReportType, @Query() q: ReportQuery) {
    return this.svc.exportCsv(type, q);
  }
}
