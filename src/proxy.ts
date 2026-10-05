import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Sends anyone without a valid session to /login. Pages and server actions
// also check the session themselves (requireUser), so this is the first line, not the only one.
export async function proxy(request: NextRequest) {
  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (userId) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
