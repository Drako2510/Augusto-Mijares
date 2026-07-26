"use client";

import { useSession } from "@/hooks/useSession";
import { useNotificacionesRepresentante } from "@/hooks/useNotificacionesRepresentante";

export function RepresentanteHeader() {
  const { user } = useSession();
  const { cantidadNoLeidas, conectado } = useNotificacionesRepresentante();

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">
          👋 Hola, {user?.nombre || "Representante"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {conectado
            ? "🟢 Conectado en tiempo real"
            : "🔴 Reconectando..."}
        </p>
      </div>

      {/* Campana con badge */}
      <div className="relative">
        <span className="text-3xl">🔔</span>
        {cantidadNoLeidas > 0 && (
          <span className="absolute -top-2 -right-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-bounce-in shadow-md">
            {cantidadNoLeidas > 9 ? "9+" : cantidadNoLeidas}
          </span>
        )}
      </div>
    </div>
  );
}
