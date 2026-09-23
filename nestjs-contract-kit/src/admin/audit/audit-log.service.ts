import { Injectable, NotImplementedException } from '@nestjs/common';
import { RequestContext } from '../common/interfaces';

export interface AuditEntry {
  action: string; // e.g. UPI_CHANGED, BUY_APPROVED, PAYMENT_VERIFIED, ADMIN_CREATED, SOCIAL_LINKS_CHANGED
  entity: string; // e.g. PAYMENT, BUY_REQUEST, PAYMENT_SETTINGS, ADMIN, SOCIAL_LINKS
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * IMPLEMENT over an `audit_logs` table:
 * (id, adminId, action, entity, entityId, oldValue JSON, newValue JSON, ip, createdAt).
 * Call `record()` inside every state-changing admin service method.
 */
export abstract class AuditLogService {
  abstract record(ctx: RequestContext, entry: AuditEntry): Promise<void>;
  abstract list(query: {
    adminId?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number; page: number; limit: number }>;
}

@Injectable()
export class UnimplementedAuditLogService extends AuditLogService {
  async record(): Promise<void> {
    // Intentionally silent no-op is NOT allowed for production —
    // throw so missing audit wiring is caught early.
    throw new NotImplementedException('AuditLogService.record not wired to database yet');
  }
  async list(): Promise<never> {
    throw new NotImplementedException('AuditLogService.list not wired to database yet');
  }
}
