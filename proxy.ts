import { NextResponse, type NextRequest } from "next/server";

const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function withLocaleCookie(request: NextRequest, locale: "en" | "ko") {
  const requestHeaders = new Headers(request.headers);
  const cookieHeader = requestHeaders.get("cookie") ?? "";
  const cookies = new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...valueParts] = part.split("=");
        return [name, valueParts.join("=")] as const;
      })
  );

  cookies.set(LOCALE_COOKIE, locale);
  requestHeaders.set(
    "cookie",
    Array.from(cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ")
  );

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const role = searchParams.get("role");
  const redirect = searchParams.get("redirect") ?? "";
  const next = searchParams.get("next") ?? "";
  const hasExplicitIntent = Boolean(role || redirect || next);

  const isEnablerAuthEntry =
    role === "enabler" ||
    redirect.startsWith("/enabler-dashboard") ||
    next.startsWith("/enabler-dashboard") ||
    (pathname === "/login" && !hasExplicitIntent);

  if ((pathname === "/login" || pathname === "/signup") && isEnablerAuthEntry) {
    return withLocaleCookie(request, "en");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup"],
};
