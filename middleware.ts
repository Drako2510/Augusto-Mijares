import { NextRequest, NextResponse } from "next/server";
import { getSessionFromToken, COOKIE_NAME } from "@/lib/auth-edge";

// Rutas públicas que no requieren autenticación
const PUBLICAS = ["/", "/login", "/unauthorized"];
const PUBLICAS_PREFIJOS = ["/_next", "/favicon", "/api/auth", "/api/notificaciones/sse"];

// Mapeo de roles a sus dashboards base
const DASHBOARDS: Record<string, string> = {
  profesor: "/profesor",
  representante: "/representante",
  directivo: "/directivo",
};

function esPublica(pathname: string): boolean {
  if (PUBLICAS.includes(pathname)) return true;
  return PUBLICAS_PREFIJOS.some((pref) => pathname.startsWith(pref));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas sin validación
  if (esPublica(pathname)) return NextResponse.next();

  // Leer token del usuario
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await getSessionFromToken(token) : null;

  // ── No hay sesión ─────────────────────────────────────
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Ya logueado → /login redirige a dashboard ────────
  if (pathname === "/login") {
    const destino = DASHBOARDS[session.rol] || "/";
    return NextResponse.redirect(new URL(destino, request.url));
  }

  // ── Restricciones por rol ─────────────────────────────
  const rol = session.rol;

  // Profesor: acceso a su dashboard, materias, y API
  if (rol === "profesor") {
    const permitido =
      pathname.startsWith("/profesor") ||
      pathname.startsWith("/materia/") ||
      pathname.startsWith("/api/") ||
      pathname === "/unauthorized";
    if (!permitido) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Representante: acceso a su dashboard, materias (lectura), y API
  if (rol === "representante") {
    const permitido =
      pathname.startsWith("/representante") ||
      pathname.startsWith("/materia/") ||
      pathname.startsWith("/api/") ||
      pathname === "/unauthorized";
    if (!permitido) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Directivo: acceso total
  if (rol === "directivo") {
    // No bloquear nada al directivo
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y favicon
    "/((?!_next/static|_next/image|favicon.ico|globals.css).*)",
  ],
};
