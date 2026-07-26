"use client";
export const dynamic = "force-dynamic";


import { Suspense, useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

function AuthContent() {
  const [config, setConfig] = useState({ nombre: "Asistencia Plus", logo: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/configuracion")
      .then((r) => r.json())
      .then((d) => setConfig(d))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="dark relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-yellow-900">
      {/* Fondo animado - partículas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-green-500/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-yellow-500/10 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      {/* Grid decorativa */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Contenido principal */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className={`w-full max-w-md transition-all duration-1000 transform ${loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          {/* Card principal */}
          <div className="backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/20 p-8 space-y-6">
            {/* Logo y nombre */}
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 via-emerald-500 to-yellow-500 animate-pulse shadow-xl shadow-green-500/30" />
                <div className="absolute inset-[3px] rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center overflow-hidden">
                  {config.logo ? (
                    <img src={config.logo} alt="Logo" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-4xl">📚</span>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {config.nombre}
                </h1>
                <p className="text-sm text-blue-200/70 mt-1">
                  Inicia sesión para continuar
                </p>
              </div>
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Forgot password */}
            <p className="text-center text-sm text-blue-200/50 hover:text-blue-200/80 cursor-pointer transition-colors duration-300">
              ¿Olvidaste tu contraseña?
            </p>

            {/* Footer */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-center text-xs text-blue-200/30">
                © {new Date().getFullYear()} {config.nombre} — v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="dark relative min-h-screen w-full bg-gradient-to-br from-emerald-950 via-green-900 to-yellow-900 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-4 w-48 mx-auto rounded-full bg-white/10 animate-pulse" />
            <div className="h-3 w-32 mx-auto rounded-full bg-white/10 animate-pulse" />
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
