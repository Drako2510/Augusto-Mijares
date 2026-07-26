/**
 * Validaciones manuales (sin Zod, para no agregar dependencias).
 * Esquemas simples pero completos para formularios de auth.
 */

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// ─── Login ──────────────────────────────────────────────────
export function validateLogin(data: {
  email: string;
  password: string;
  rol: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.rol || !["profesor", "representante", "directivo"].includes(data.rol)) {
    errors.rol = "Selecciona un rol válido";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Ingresa un email válido";
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Register ───────────────────────────────────────────────
export function validateRegister(data: {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.nombre || data.nombre.trim().length < 3) {
    errors.nombre = "El nombre debe tener al menos 3 caracteres";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Ingresa un email válido";
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "Mínimo 6 caracteres";
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }

  if (!data.rol || !["profesor", "representante", "directivo"].includes(data.rol)) {
    errors.rol = "Selecciona un rol válido";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Password Strength ──────────────────────────────────────
export function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  cssClass: "weak" | "fair" | "good" | "strong" | "";
} {
  if (!password) return { score: 0, label: "", cssClass: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Débil", cssClass: "weak" };
  if (score === 2) return { score: 2, label: "Regular", cssClass: "fair" };
  if (score === 3) return { score: 3, label: "Buena", cssClass: "good" };
  return { score: 4, label: "Fuerte", cssClass: "strong" };
}
