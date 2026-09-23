import { NextResponse } from 'next/server';

// ============================================================
// DEAR DOLLAR Admin Panel - internal route
// This admin panel does NOT have its own backend or database.
// All business/data APIs live on the existing NestJS backend
// configured via NEXT_PUBLIC_API_URL. This route only exposes
// a health check used by hosting / reverse-proxy monitors.
// ============================================================

function handle() {
  return NextResponse.json({
    service: 'dear-dollar-admin-panel',
    status: 'ok',
    note: 'This panel uses the existing NestJS POINT MARKET API (NEXT_PUBLIC_API_URL). No local backend or database.',
  });
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
