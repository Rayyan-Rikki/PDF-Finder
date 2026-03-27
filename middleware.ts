import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AUTH_PATH = "/auth";
const ADMIN_PREFIX = "/admin";
const PROTECTED_PREFIXES = ["/", "/worksheets"];

function isStaticPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  );
}

function isProtectedPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return PROTECTED_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix)
  ) || pathname.startsWith(ADMIN_PREFIX);
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname, search } = request.nextUrl;

    if (isStaticPath(pathname) || pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.next();
    }

    const response = NextResponse.next();

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Middleware auth lookup failed:", userError.message);
      return NextResponse.next();
    }

    if (!user && isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = AUTH_PATH;
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (user && pathname === AUTH_PATH) {
      const next = request.nextUrl.searchParams.get("next") || "/";
      return NextResponse.redirect(new URL(next, request.url));
    }

    if (user && pathname.startsWith(ADMIN_PREFIX)) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Middleware profile lookup failed:", profileError.message);
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return response;
  } catch (error: unknown) {
    console.error("Middleware invocation failed:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
