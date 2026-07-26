"use client";

import { useState, useRef } from "react";
import { validateRegister, getPasswordStrength } from "@/lib/validations";
import { toast } from "@/components/ui/Toast";
import { SuccessBurst } from "@/components/ui/SuccessBurst";

const ROLES = [
  { value: "profesor", label: "Profesor", icon: "👨‍🏫" },
  { value: "representante", label: "Representante", icon: "👨‍👧" },
  { value: "directivo", label: "Directivo", icon: "🏫" },
];

function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement("span");
  ripple.className = "ripple-effect";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const pwStrength = getPasswordStrength(password);

  const triggerShake = () => {
    formRef.current?.classList.add("shake");
    setTimeout(() => formRef.current?.classList.remove("shake"), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = validateRegister({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      rol,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          rol,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Error al registrarse");
        toast(data.error ?? "Error al registrarse", "error");
        triggerShake();
        setLoading(false);
        return;
      }

      setShowSuccess(true);
      toast("¡Registro exitoso! Ahora inicia sesión.", "success");

      // Auto-switch a login después de la animación
      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch {
      setError("Error de conexión. Intente de nuevo.");
      triggerShake();
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess && <SuccessBurst />}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Success message */}
        {showSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 animate-slideDown">
            <span>✅</span> ¡Cuenta creada! Redirigiendo al login...
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="error-message">
            <span>❌</span> {error}
          </div>
        )}

        {/* Role selector */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-gray-700">
            ¿Cuál es tu rol?
          </legend>
          <div className="role-selector">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={(e) => {
                  createRipple(e);
                  setRol(r.value);
                  setFieldErrors((prev) => ({ ...prev, rol: "" }));
                }}
                className={`role-card ${rol === r.value ? "selected" : ""}`}
              >
                <span className="role-icon">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
          {fieldErrors.rol && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.rol}</p>
          )}
        </fieldset>

        {/* Nombre */}
        <div className="input-group">
          <input
            id="reg-nombre"
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setFieldErrors((prev) => ({ ...prev, nombre: "" }));
            }}
            onFocus={(e) => e.currentTarget.classList.add("input-focus-glow")}
            onBlur={(e) => e.currentTarget.classList.remove("input-focus-glow")}
            placeholder=" "
            autoComplete="name"
          />
          <label htmlFor="reg-nombre">👤 Nombre completo</label>
          {fieldErrors.nombre && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.nombre}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="input-group">
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }}
            onFocus={(e) => e.currentTarget.classList.add("input-focus-glow")}
            onBlur={(e) => e.currentTarget.classList.remove("input-focus-glow")}
            placeholder=" "
            autoComplete="email"
          />
          <label htmlFor="reg-email">📧 Correo electrónico</label>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="input-group">
          <input
            id="reg-password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            onFocus={(e) => e.currentTarget.classList.add("input-focus-glow")}
            onBlur={(e) => e.currentTarget.classList.remove("input-focus-glow")}
            placeholder=" "
            autoComplete="new-password"
          />
          <label htmlFor="reg-password">🔒 Contraseña</label>
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="input-icon"
            tabIndex={-1}
            aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <span
              className="inline-block transition-transform duration-300"
              style={{ transform: showPw ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              {showPw ? "🙈" : "👁️"}
            </span>
          </button>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.password}
            </p>
          )}
          {/* Password strength bar with animated fill */}
          {password && (
            <>
              <div className="pw-strength-bar">
                <div className={`pw-strength-fill ${pwStrength.cssClass}`} />
              </div>
              <p
                className={`mt-1 text-xs font-medium transition-colors duration-300 ${
                  pwStrength.cssClass === "strong"
                    ? "text-green-600"
                    : pwStrength.cssClass === "good"
                      ? "text-blue-600"
                      : pwStrength.cssClass === "fair"
                        ? "text-amber-600"
                        : "text-red-500"
                }`}
              >
                {pwStrength.label}
                {pwStrength.cssClass === "strong" && " 💪"}
              </p>
            </>
          )}
        </div>

        {/* Confirm password */}
        <div className="input-group">
          <input
            id="reg-confirm"
            type={showPw ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            onFocus={(e) => e.currentTarget.classList.add("input-focus-glow")}
            onBlur={(e) => e.currentTarget.classList.remove("input-focus-glow")}
            placeholder=" "
            autoComplete="new-password"
          />
          <label htmlFor="reg-confirm">🔒 Confirmar contraseña</label>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || showSuccess}
          onClick={(e) => createRipple(e)}
          className={`btn-primary w-full ${loading ? "loading" : ""}`}
        >
          <div className="spinner" />
          <span className="btn-text">
            {loading ? "Creando cuenta..." : "✨ Crear Cuenta"}
          </span>
        </button>
      </form>
    </>
  );
}
