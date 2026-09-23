import { randomUUID } from 'crypto';
import { AdminUserRecord } from '../common/interfaces';

/**
 * Persistence port for admin users.
 * IMPLEMENT THIS over your existing database (TypeORM / Prisma / Mongoose).
 * Passwords must be stored as argon2id hashes — never plaintext.
 */
export abstract class AdminUsersRepository {
  abstract findByEmail(email: string): Promise<AdminUserRecord | null>;
  abstract findById(id: string): Promise<AdminUserRecord | null>;
  abstract list(page: number, limit: number): Promise<{ items: AdminUserRecord[]; total: number }>;
  abstract create(data: Omit<AdminUserRecord, 'id' | 'createdAt'>): Promise<AdminUserRecord>;
  abstract update(id: string, data: Partial<AdminUserRecord>): Promise<AdminUserRecord>;
  abstract touchLastLogin(id: string): Promise<void>;
}

/** In-memory reference implementation — LOCAL TESTING ONLY. Replace with DB. */
export class InMemoryAdminUsersRepository extends AdminUsersRepository {
  private readonly rows = new Map<string, AdminUserRecord>();

  async findByEmail(email: string) {
    return [...this.rows.values()].find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }
  async list(page: number, limit: number) {
    const all = [...this.rows.values()];
    return { items: all.slice((page - 1) * limit, page * limit), total: all.length };
  }
  async create(data: Omit<AdminUserRecord, 'id' | 'createdAt'>) {
    const record: AdminUserRecord = { ...data, id: randomUUID(), createdAt: new Date() };
    this.rows.set(record.id, record);
    return record;
  }
  async update(id: string, data: Partial<AdminUserRecord>) {
    const existing = this.rows.get(id);
    if (!existing) throw new Error('Admin not found');
    const next = { ...existing, ...data, id };
    this.rows.set(id, next);
    return next;
  }
  async touchLastLogin(id: string) {
    const existing = this.rows.get(id);
    if (existing) this.rows.set(id, { ...existing, lastLoginAt: new Date() });
  }
}
