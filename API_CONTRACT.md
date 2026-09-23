# DEAR DOLLAR - Backend API Contract (Admin)

This document is the **exact API contract** the Admin Panel is built against.
The existing NestJS POINT MARKET backend must expose these endpoints under the
base URL configured in `NEXT_PUBLIC_API_URL` (e.g. `https://api.yourdomain.com`).

General rules:

- All endpoints below require `Authorization: Bearer <accessToken>` unless noted.
- The backend is the FINAL authority for authentication, RBAC, permissions and
  all financial state changes. The panel never modifies wallets directly.
- Content type: `application/json`.
- Error shape (NestJS default): `{ "statusCode": 400, "message": "..." | ["..."], "error": "..." }`.
- Paginated responses use: `{ "items": T[], "total": number, "page": number, "limit": number }`.
- List endpoints accept `page` (1-based) and `limit` query params.

Roles: `SUPER_ADMIN`, `ADMIN`.

Permissions: `VIEW_CUSTOMERS`, `VIEW_WALLETS`, `VERIFY_PAYMENTS`,
`MANAGE_BUY_LISTINGS`, `MANAGE_DEMAND_LISTINGS`, `APPROVE_BUY`, `APPROVE_SELL`,
`VIEW_REPORTS`, `MANAGE_PAYMENT_SETTINGS`, `MANAGE_ADMINS`, `VIEW_AUDIT_LOGS`.
`SUPER_ADMIN` implicitly has all permissions.

---

## 1. Authentication (separate from customer auth)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/auth/login` | Public (rate limited) | Email/username + password login. NO OTP, NO mobile auth. |
| POST | `/admin/auth/refresh` | Public (refresh token) | Refresh-token rotation. |
| POST | `/admin/auth/logout` | Bearer | Revokes the given refresh token. |
| GET | `/admin/auth/me` | Bearer | Current admin profile. |

`POST /admin/auth/login` request:
```json
{ "email": "admin@deardollar.com", "password": "********" }
```
Response `200`:
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-or-jwt>",
  "admin": {
    "id": "uuid", "name": "Admin", "email": "admin@deardollar.com",
    "role": "SUPER_ADMIN", "permissions": ["VIEW_CUSTOMERS"], "status": "ACTIVE"
  }
}
```
Backend requirements: Argon2id/bcrypt password hashing, refresh-token rotation +
revocation, strict login rate limiting / brute-force protection, no plaintext
passwords, never expose hashes or secrets.

`POST /admin/auth/refresh` request: `{ "refreshToken": "..." }` ->
response: `{ "accessToken": "...", "refreshToken": "..." }` (new rotated pair; old one revoked).

`POST /admin/auth/logout` request: `{ "refreshToken": "..." }` -> `200`.

---

## 2. Dashboard

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/dashboard/stats` | any authenticated admin |

Response:
```json
{
  "totalCustomers": 0, "totalMoneyDeposits": 0, "pendingPayments": 0,
  "pendingBuyRequests": 0, "pendingSellRequests": 0,
  "totalDollarPurchased": 0, "totalDollarSold": 0,
  "activeBuyListings": 0, "activeDemandListings": 0
}
```

---

## 3. Customer management

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/customers?search=&page=&limit=` | VIEW_CUSTOMERS |
| GET | `/admin/customers/:id` | VIEW_CUSTOMERS |
| GET | `/admin/customers/:id/money-wallet` | VIEW_WALLETS |
| GET | `/admin/customers/:id/point-wallet` | VIEW_WALLETS |
| GET | `/admin/customers/:id/transactions?page=&limit=` | VIEW_WALLETS |
| GET | `/admin/customers/:id/bank-details` | VIEW_WALLETS (access should be audit-logged) |
| GET | `/admin/withdrawals?status=&page=&limit=` | VIEW_WALLETS |
| POST | `/admin/withdrawals/:id/approve` body `{ "note": "?" }` | VIEW_WALLETS |
| POST | `/admin/withdrawals/:id/reject` body `{ "reason": "..." }` | VIEW_WALLETS |

Customer: `{ id, name, mobile, email?, status, createdAt }`
Wallet: `{ balance, currency?, updatedAt? }`
Transaction: `{ id, type, wallet: "MONEY"|"POINT", direction: "CREDIT"|"DEBIT", amount, status, description?, createdAt }`
BankDetails: `{ accountHolder?, accountNumber?, ifsc?, bankName?, upiId? }`
Withdrawal: `{ id, customer?, amount, status, bankDetails?, createdAt }`

---

## 4. Buy $dollar listings (e.g. ₹40 = 9 $dollar)

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/buy-listings?status=&page=&limit=` | MANAGE_BUY_LISTINGS |
| POST | `/admin/buy-listings` | MANAGE_BUY_LISTINGS |
| PATCH | `/admin/buy-listings/:id` | MANAGE_BUY_LISTINGS |
| POST | `/admin/buy-listings/:id/activate` | MANAGE_BUY_LISTINGS |
| POST | `/admin/buy-listings/:id/pause` | MANAGE_BUY_LISTINGS |
| POST | `/admin/buy-listings/:id/close` | MANAGE_BUY_LISTINGS |

Body / entity:
```json
{
  "title": "Festive pack", "description": "...", "moneyValue": 40,
  "pointQuantity": 9, "availableQuantity": 1000,
  "startDate": "2025-06-01", "endDate": "2025-06-30", "status": "ACTIVE"
}
```
Status enum: `DRAFT | ACTIVE | PAUSED | CLOSED`.

---

## 5. Demand listings (e.g. ₹20 = 10 $dollar)

Same pattern under `/admin/demand-listings` with fields:
`title, description, moneyValue, pointQuantity, demandQuantity, remainingQuantity (server-managed), startDate, endDate, status`.

---

## 6. Buy request approval

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/buy-requests?status=&page=&limit=` | APPROVE_BUY |
| POST | `/admin/buy-requests/:id/approve` body `{ "note": "?" }` | APPROVE_BUY |
| POST | `/admin/buy-requests/:id/reject` body `{ "reason": "..." }` | APPROVE_BUY |

BuyRequest: `{ id, customer, dollarQuantity, rate, amount, listing: { id, title }, status, createdAt }`
Backend performs final validation and wallet credit. Frontend never touches wallets.

---

## 7. Sell request approval

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/sell-requests?status=&page=&limit=` | APPROVE_SELL |
| POST | `/admin/sell-requests/:id/approve` body `{ "note": "?" }` | APPROVE_SELL |
| POST | `/admin/sell-requests/:id/reject` body `{ "reason": "..." }` | APPROVE_SELL |

SellRequest: `{ id, customer, dollarQuantity, rate, expectedAmount, demandListing: { id, title }, status, createdAt }`

---

## 8. Payment verification (UPI)

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/payments?status=&page=&limit=` | VERIFY_PAYMENTS |
| POST | `/admin/payments/:id/verify` body `{ "note": "?" }` | VERIFY_PAYMENTS |
| POST | `/admin/payments/:id/reject` body `{ "reason": "..." }` | VERIFY_PAYMENTS |

Payment: `{ id, customer, paymentId, amount, utr, upiId, paidAt, status, createdAt }`
Only backend verification credits the Money Wallet.

---

## 9. Payment settings (SUPER_ADMIN only)

| Method | Path |
|---|---|
| GET | `/admin/payment-settings` (current config) |
| GET | `/admin/payment-settings/history` (all previous versions, newest first) |
| PUT | `/admin/payment-settings` (creates a NEW version; old records preserved) |
| POST | `/admin/payment-settings/qr-upload` (multipart upload of the QR image) |

Body: `{ "upiId": "merchant@upi", "merchantName": "DEAR DOLLAR", "qrImageUrl": "https://...", "instructions": "...", "enabled": true }`
Changing settings must NOT modify old payment records and must be audit-logged.

`POST /admin/payment-settings/qr-upload`: `multipart/form-data` with a single
`file` field (PNG/JPG/WebP, max 2 MB). The backend stores the image (local disk
served by Nginx, or S3-compatible storage) and responds
`{ "url": "https://api.yourdomain.com/uploads/qr/<name>.png" }`. The returned URL
is then submitted as `qrImageUrl` via `PUT /admin/payment-settings`.

---

## 10. Admin management (SUPER_ADMIN only)

| Method | Path |
|---|---|
| GET | `/admin/admins?page=&limit=` |
| POST | `/admin/admins` |
| PATCH | `/admin/admins/:id` |
| POST | `/admin/admins/:id/disable` (also revokes refresh tokens) |
| POST | `/admin/admins/:id/enable` |

Create body:
```json
{
  "name": "Support Staff", "email": "staff@deardollar.com", "mobile": "9999999999",
  "password": "plaintext-only-in-transit", "role": "ADMIN",
  "permissions": ["VIEW_CUSTOMERS", "VERIFY_PAYMENTS"], "status": "ACTIVE"
}
```
Backend hashes the password (Argon2id/bcrypt) and never returns hashes.

---

## 11. Audit logs

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/audit-logs?adminId=&action=&entity=&from=&to=&page=&limit=` | VIEW_AUDIT_LOGS |

AuditLog: `{ id, admin: { id, name, email }, action, entity, entityId, oldValue, newValue, ip, createdAt }`
Expected actions include: `UPI_CHANGED`, `QR_CHANGED`, `BUY_APPROVED`, `SELL_APPROVED`,
`PAYMENT_VERIFIED`, `RATE_CHANGED`, `ADMIN_CREATED`, `SOCIAL_LINKS_CHANGED`, ...

---

## 12. Reports

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/reports/:type?from=&to=&customerId=&status=&type=&page=&limit=` | VIEW_REPORTS |
| GET | `/admin/reports/:type/export?format=csv&...same filters` | VIEW_REPORTS (returns `text/csv`) |

`:type` one of: `deposits`, `buy-transactions`, `sell-transactions`, `dollar-volume`,
`wallet-transactions`, `payment-verifications`, `pending-transactions`, `admin-activity`.
Returns the standard paginated shape; the panel renders columns dynamically from row keys.

---

## 13. Social / community links (SUPER_ADMIN only)

| Method | Path |
|---|---|
| GET | `/admin/settings/social-links` |
| PUT | `/admin/settings/social-links` |

Body / response:
```json
{ "telegramUrl": "https://t.me/...", "telegramEnabled": true,
  "discordUrl": "https://discord.gg/...", "discordEnabled": false }
```
Stored in the backend database (never hardcoded in the frontend); every change audit-logged.
