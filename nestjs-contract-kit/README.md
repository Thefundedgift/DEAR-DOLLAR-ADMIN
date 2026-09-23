# DEAR DOLLAR — NestJS Admin Contract Kit

This folder is a **ready-made NestJS module skeleton** that implements the exact
API contract the Admin Panel expects (see `../API_CONTRACT.md`). It is meant to be
**copied into your EXISTING NestJS POINT MARKET backend** — it is not a separate
backend and has no database of its own.

```
src/admin/
├── admin.module.ts              # Import this into your AppModule
├── common/                      # Enums, pagination, shared types
├── auth/                        # FULLY IMPLEMENTED admin auth (JWT + refresh rotation)
├── dashboard/  customers/  listings/  requests/
├── payments/   admins/     audit/     reports/   settings/
```

## What is already done vs. what your team wires up

| Layer | Status |
|---|---|
| Routes, DTO validation, guards, RBAC permission checks | ✅ Complete |
| Admin auth: argon2 verify, JWT access token, refresh-token **rotation + revocation**, logout, `/me` | ✅ Complete |
| Rate limiting on login (`@nestjs/throttler`) | ✅ Complete |
| Persistence (`AdminUsersRepository`, `RefreshTokenStore`) | 🔌 Implement over your DB (in-memory reference impls included) |
| Domain logic (`*Service` abstract classes) | 🔌 Implement over your existing entities/wallets |
| Audit logging (`AuditLogService`) | 🔌 Implement (interface + call sites ready) |

Every unimplemented service ships with a default provider that returns
`501 Not Implemented` — so you can merge the kit, boot the app, and wire
endpoints one by one while the Admin Panel shows clear errors for the rest.

## 1. Install dependencies (in YOUR backend)

```bash
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt argon2 @nestjs/throttler class-validator class-transformer
yarn add -D @types/passport-jwt
```

## 2. Copy the kit

```bash
cp -r nestjs-contract-kit/src/admin  YOUR_BACKEND/src/admin
```

## 3. Register the module

```ts
// app.module.ts
import { AdminModule } from './admin/admin.module';

@Module({ imports: [/* ...existing */, AdminModule] })
export class AppModule {}
```

## 4. Environment variables (add to your backend .env)

```
ADMIN_JWT_SECRET=change-me-long-random-string
ADMIN_JWT_EXPIRES_IN=15m
ADMIN_REFRESH_TTL_DAYS=7

# QR image upload (local-disk storage, works out of the box)
UPLOAD_DIR=./uploads
PUBLIC_ASSETS_URL=https://api.yourdomain.com/uploads
```

> Serve the uploads directory statically, e.g. with Nginx:
> `location /uploads/ { alias /opt/deardollar/backend/uploads/; }`
> or in Nest via `ServeStaticModule.forRoot({ rootPath: 'uploads', serveRoot: '/uploads' })`.

> Access tokens are short-lived JWTs. Refresh tokens are **opaque random
> strings stored hashed (sha256)** — never JWTs, never stored in plaintext.

## 5. CORS for the admin panel

```ts
app.enableCors({ origin: ['https://admin.yourdomain.com'], credentials: true });
```

## 6. Wire persistence (the only required work)

1. `auth/admin-users.repository.ts` — implement `AdminUsersRepository` over your
   admins table/collection (TypeORM/Prisma/Mongoose). Passwords must be stored
   as **argon2id hashes** (`argon2.hash(password)` on create/update).
2. `auth/token.store.ts` — implement `RefreshTokenStore` over a `admin_refresh_tokens`
   table (columns: id, adminId, tokenHash, expiresAt, revokedAt). The in-memory
   implementation is for local testing only.
3. Implement each abstract `*Service` (e.g. `DashboardStatsService`,
   `CustomersAdminService`, ...) by delegating to your existing domain services.
   Replace the `Unimplemented*` providers in `admin.module.ts` with your classes.
4. Implement `AuditLogService.record(...)` writing to an `audit_logs` table.
   Controllers already pass `oldValue`/`newValue`/`ip` where relevant.

## 7. Bootstrap the first SUPER_ADMIN (no default credentials!)

Create a one-off CLI/seed script in YOUR backend, e.g.:

```ts
const hash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD!);
await adminUsersRepository.create({
  name: 'Owner', email: process.env.SEED_ADMIN_EMAIL!,
  passwordHash: hash, role: AdminRole.SUPER_ADMIN, permissions: [], status: AdminStatus.ACTIVE,
});
```

Run it once on the VPS, then remove/disable it. Never hardcode credentials.

## 8. Verify against the Admin Panel

Set the panel's `NEXT_PUBLIC_API_URL` to your backend URL, rebuild the panel
container, and log in. Endpoints still returning 501 will show as clear errors
in the panel until wired.
