import { NextRequest, NextResponse } from "next/server";

// Avoid importing server-only helpers into middleware (Edge runtime).
// Middleware runs in the Edge runtime and cannot load Node-only modules
// such as native crypto or argon2. Keep middleware logic minimal and
// edge-compatible.
export function middleware(request: NextRequest) {
  // Example: check if session cookie exists and continue. Don't call
  // `updateSession` here because it imports Node-only modules.
  const session = request.cookies.get("session")?.value;
  // Optionally you can short-circuit or rewrite based on session, e.g.:
  // if (!session) return NextResponse.redirect('/login');
  return NextResponse.next();
}
