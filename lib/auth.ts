import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { COOKIE_NAME, getSessionFromToken } from "@/lib/auth-edge";
import type { Payload } from "@/lib/auth-edge";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "asistencia-plus-secret-key-2025"
);

const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

// ─── Login ─────────────────────────────────────────────────
export async function login(
  email: string,
  password: string,
  rol: string
): Promise<{ success: true; user: { id: string; nombre: string; rol: string } } | { success: false; error: string }> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) return { success: false, error: "Credenciales inválidas" };

  if (usuario.rol !== rol) return { success: false, error: "El rol seleccionado no coincide con este usuario" };
  if (!usuario.activo) return { success: false, error: "Cuenta desactivada. Contacte al administrador." };

  const ok = await bcrypt.compare(password, usuario.password);
  if (!ok) return { success: false, error: "Credenciales inválidas" };

  const token = await new SignJWT({
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
  } as Payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return {
    success: true,
    user: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  };
}

// ─── Get Session ───────────────────────────────────────────
export async function getSession(): Promise<Payload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionFromToken(token);
}

// ─── Logout ────────────────────────────────────────────────
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };
