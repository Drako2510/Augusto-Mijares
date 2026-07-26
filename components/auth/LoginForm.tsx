"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validateLogin } from "@/lib/validations";
import { toast } from "@/components/ui/Toast";
import { SuccessBurst } from "@/components/ui/SuccessBurst";

const ROLES = [
  { value: "profesor", label: "Profesor", icon: "👨‍🏫" },
  { value: "representante", label: "Representante", icon: "👨‍👧" },
  { value: "directivo", label: "Directivo", icon: "🏫" },
];

/** Crea ripple en la posición del click */
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || undefined;
  const formRef = useRef<HTMLFormElement>(null);

  const [rol, setRol] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [userName, setUserName] = useState("");

  const triggerShake = () => {
    formRef.current?.classList.add("shake");
    setTimeout(() => formRef.current?.classList.remove("shake"), 500);
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = validateLogin({ email: email.trim(), password, rol });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rol }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Credenciales inválidas");
        toast(data.error ?? "Error al iniciar sesión", "error");
        triggerShake();
        setLoading(false);
        return;
      }

      setUserName(data.user.nombre);
      setShowSuccess(true);

      const dashboards: Record<string, string> = {
        profesor: "/profesor",
        representante: "/representante",
        directivo: "/directivo",
      };

      // Redirigir después de la animación de success
      setTimeout(() => {
        router.push(redirect ?? dashboards[data.user.rol] ?? "/");
        router.refresh();
      }, 1100);
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
          <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-300 animate-slideDown">
            <span>✅</span> ¡Bienvenido{userName ? `, ${userName.split(" ")[0]}` : ""}!
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
          <legend className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Selecciona tu rol
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

        {/* Email */}
        <div className="input-group">
          <input
            id="login-email"
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
          <label htmlFor="login-email">📧 Correo electrónico</label>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="input-group">
          <input
            id="login-password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            onFocus={(e) => e.currentTarget.classList.add("input-focus-glow")}
            onBlur={(e) => e.currentTarget.classList.remove("input-focus-glow")}
            placeholder=" "
            autoComplete="current-password"
          />
          <label htmlFor="login-password">🔒 Contraseña</label>
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
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || showSuccess}
          onClick={handleClick}
          className={`btn-primary w-full ${loading ? "loading" : ""}`}
        >
          <div className="spinner" />
          <span className="btn-text">
            {loading ? "Verificando..." : "🔑 Iniciar Sesión"}
          </span>
        </button>

        {/* Demo hint */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Demo: <strong>prof.matematicas@escuela.edu</strong> /{" "}
          <strong>password123</strong>
        </p>
      </form>
    </>
  );
}
