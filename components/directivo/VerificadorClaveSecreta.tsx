"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  materiaId: string;
  anio: string;
  seccion: string;
  materiaNombre: string;
  onSuccess: () => void;
  onCancel: () => void;
  /** Función de validación provista por el hook useClaveSecreta.
   *  Si se provee, se usa en lugar de llamar a la API directamente. */
  onValidate?: (clave: string) => Promise<boolean>;
}

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

export function VerificadorClaveSecreta({
  materiaId,
  anio,
  seccion,
  materiaNombre,
  onSuccess,
  onCancel,
  onValidate,
}: Props) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const triggerShake = () => {
    formRef.current?.classList.add("shake");
    setTimeout(() => formRef.current?.classList.remove("shake"), 500);
  };

  const verificar = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!clave.trim()) {
        setError("Ingresa la clave secreta");
        triggerShake();
        return;
      }

      setLoading(true);

      try {
        // Si el padre proveyó onValidate (desde useClaveSecreta), lo usa;
        // así el hook actualiza el estado React y no solo sessionStorage.
        if (onValidate) {
          const ok = await onValidate(clave.trim());
          if (!ok) {
            setError("Clave incorrecta");
            triggerShake();
            setLoading(false);
            return;
          }
          onSuccess();
          return;
        }

        // Fallback: llamada directa a la API (sin hook)
        const res = await fetch("/api/directivo/validar-clave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materiaId, anio, seccion, clave: clave.trim() }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error ?? "Clave incorrecta");
          triggerShake();
          setLoading(false);
          return;
        }

        // Guardar token y expiración en sessionStorage
        sessionStorage.setItem(`clave_${materiaId}_${anio}_${seccion}`, data.token ?? "true");
        const minutos = Number(process.env.NEXT_PUBLIC_CLAVE_EXPIRACION_MINUTOS) || 30;
        const expira = Date.now() + minutos * 60 * 1000;
        sessionStorage.setItem(`clave_expira_${materiaId}_${anio}_${seccion}`, String(expira));

        onSuccess();
      } catch {
        setError("Error de conexión. Intente de nuevo.");
        triggerShake();
        setLoading(false);
      }
    },
    [clave, materiaId, anio, seccion, onSuccess, onValidate]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <span className="text-xl">🔐</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Clave Secreta Requerida</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Ingresa la clave proporcionada por el profesor de{" "}
              <strong>{materiaNombre}</strong> · {anio} &quot;{seccion}&quot;
            </p>
          </div>
          <button onClick={onCancel} className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 transition">
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form ref={formRef} onSubmit={verificar} className="space-y-4 p-6">
          {error && (
            <div className="error-message text-sm"><span>❌</span> {error}</div>
          )}

          <div className="input-group">
            <input
              id="clave-secreta"
              type="password"
              value={clave}
              onChange={(e) => { setClave(e.target.value); setError(""); }}
              onFocus={(e) => e.currentTarget.classList.add("input-focus-glow")}
              onBlur={(e) => e.currentTarget.classList.remove("input-focus-glow")}
              placeholder=" "
              autoFocus
              autoComplete="off"
            />
            <label htmlFor="clave-secreta">🔑 Clave secreta</label>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            ℹ️ La clave es proporcionada por el profesor de la materia. Al validarla obtendrás los mismos permisos de edición.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => { createRipple(e); onCancel(); }}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => createRipple(e)}
              className={`btn-primary flex-1 ${loading ? "loading" : ""}`}
            >
              <div className="spinner" />
              <span className="btn-text">
                {loading ? "Validando..." : "🔓 Validar Clave"}
              </span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-blue-100 bg-blue-50 dark:bg-blue-900/30 p-4">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ℹ️ Al validar la clave, obtendrás los mismos permisos de edición que el profesor de esta materia.
          </p>
        </div>
      </div>
    </div>
  );
}
