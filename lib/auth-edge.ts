/**
 * Auth helpers para Edge Runtime (middleware de Next.js).
 * NO importa bcrypt, prisma, ni jose.
 * Usa Web Crypto API nativa para verificar JWT (HS256).
 */

export const COOKIE_NAME = "auth-token";

export interface Payload {
  userId: string;
  email: string;
  rol: string;
  [key: string]: unknown;
}

const SECRET_KEY = process.env.JWT_SECRET || "asistencia-plus-secret-key-2025";

/**
 * Verifica y decodifica un JWT (HS256) usando Web Crypto API.
 * Compatible con Edge Runtime.
 */
export async function getSessionFromToken(token: string): Promise<Payload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decodificar header y verificar algoritmo
    const header = JSON.parse(base64UrlDecode(parts[0]));
    if (header.alg !== "HS256") return null;

    // Verificar expiración
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Verificar firma HMAC-SHA256
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = enc.encode(parts[0] + "." + parts[1]);
    const sig = base64UrlDecodeToArray(parts[2]);

    const valid = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!valid) return null;

    return payload as Payload;
  } catch {
    return null;
  }
}

function base64UrlDecode(str: string): string {
  // Reemplazar chars de base64url → base64 estándar
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Agregar padding
  while (base64.length % 4 !== 0) base64 += "=";
  return atob(base64);
}

function base64UrlDecodeToArray(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}
