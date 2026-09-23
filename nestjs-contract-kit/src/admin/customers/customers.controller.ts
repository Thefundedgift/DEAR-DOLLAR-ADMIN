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
import { RejectDto, NoteDto } from '../common/action.dto';
import { Permission } from '../common/enums';
import { RequestContext } from '../common/interfaces';
import { Paginated, PaginationQuery } from '../common/pagination';
import { AdminJwtGuard, ClientIp, CurrentAdmin, PermissionsGuard, RequirePermissions } from '../auth/security';

class CustomerListQuery extends PaginationQuery {
  search?: string;
}
class WithdrawalListQuery extends PaginationQuery {
  status?: string;
}

/**
 * IMPLEMENT over your existing customer/wallet/transaction/withdrawal tables.
 * approveWithdrawal / rejectWithdrawal MUST: re-validate state + balance inside a
 * DB transaction, perform the wallet debit server-side, and write an audit log.
 */
export abstract class CustomersAdminService {
  abstract list(q: { search?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract getById(id: string): Promise<unknown>;
  abstract getMoneyWallet(id: string): Promise<unknown>;
  abstract getPointWallet(id: string): Promise<unknown>;
  abstract getTransactions(id: string, q: { page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract getBankDetails(id: string, ctx: RequestContext): Promise<unknown>; // audit-log the access
  abstract listWithdrawals(q: { status?: string; page: number; limit: number }): Promise<Paginated<unknown>>;
  abstract approveWithdrawal(id: string, note: string | undefined, ctx: RequestContext): Promise<unknown>;
  abstract rejectWithdrawal(id: string, reason: string, ctx: RequestContext): Promise<unknown>;
}

@Injectable()
export class UnimplementedCustomersAdminService extends CustomersAdminService {
  private nope(): never {
    throw new NotImplementedException('CustomersAdminService not wired to database yet');
  }
  list = async () => this.nope();
  getById = async () => this.nope();
  getMoneyWallet = async () => this.nope();
  getPointWallet = async () => this.nope();
  getTransactions = async () => this.nope();
  getBankDetails = async () => this.nope();
  listWithdrawals = async () => this.nope();
  approveWithdrawal = async () => this.nope();
  rejectWithdrawal = async () => this.nope();
}

@UseGuards(AdminJwtGuard, PermissionsGuard)
@Controller('admin')
export class CustomersController {
  constructor(private readonly customers: CustomersAdminService) {}

  @Get('customers')
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  list(@Query() q: CustomerListQuery) {
    return this.customers.list({ search: q.search, page: q.page, limit: q.limit });
  }

  @Get('customers/:id')
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  getById(@Param('id') id: string) {
    return this.customers.getById(id);
  }

  @Get('customers/:id/money-wallet')
  @RequirePermissions(Permission.VIEW_WALLETS)
  moneyWallet(@Param('id') id: string) {
    return this.customers.getMoneyWallet(id);
  }

  @Get('customers/:id/point-wallet')
  @RequirePermissions(Permission.VIEW_WALLETS)
  pointWallet(@Param('id') id: string) {
    return this.customers.getPointWallet(id);
  }

  @Get('customers/:id/transactions')
  @RequirePermissions(Permission.VIEW_WALLETS)
  transactions(@Param('id') id: string, @Query() q: PaginationQuery) {
    return this.customers.getTransactions(id, q);
  }

  @Get('customers/:id/bank-details')
  @RequirePermissions(Permission.VIEW_WALLETS)
  bankDetails(
    @Param('id') id: string,
    @CurrentAdmin() user: { adminId: string },
    @ClientIp() ip: string,
  ) {
    return this.customers.getBankDetails(id, { adminId: user.adminId, ip });
  }

  @Get('withdrawals')
  @RequirePermissions(Permission.VIEW_WALLETS)
  withdrawals(@Query() q: WithdrawalListQuery) {
    return this.customers.listWithdrawals({ status: q.status, page: q.page, limit: q.limit });
  }

  @Post('withdrawals/:id/approve')
  @RequirePermissions(Permission.VIEW_WALLETS)
  approveWithdrawal(
    @Param('id') id: string,
    @Body() dto: NoteDto,
    @CurrentAdmin() user: { adminId: string },
    @ClientIp() ip: string,
  ) {
    return this.customers.approveWithdrawal(id, dto.note, { adminId: user.adminId, ip });
  }

  @Post('withdrawals/:id/reject')
  @RequirePermissions(Permission.VIEW_WALLETS)
  rejectWithdrawal(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @CurrentAdmin() user: { adminId: string },
    @ClientIp() ip: string,
  ) {
    return this.customers.rejectWithdrawal(id, dto.reason, { adminId: user.adminId, ip });
  }
}
