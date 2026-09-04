import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import { isEmailAllowed } from "@/lib/auth/allowlist";

const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const allowed = user ? isEmailAllowed(user.email) : false;

  // Root goes to the dashboard (or login, handled below).
  if (path === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = allowed ? "/home" : "/login";
    return NextResponse.redirect(dest);
  }

  if (!allowed && !isPublic(path)) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    if (user && !allowed) dest.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(dest);
  }

  if (allowed && isPublic(path)) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/home";
    return NextResponse.redirect(dest);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and files with extensions.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
