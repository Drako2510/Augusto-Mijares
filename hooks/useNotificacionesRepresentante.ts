"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { playNotificationSound } from "@/utils/playSound";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  estudiante?: { nombre: string; anio?: string; seccion?: string } | null;
  materia?: { nombre: string; icono?: string } | null;
  data?: unknown;
}

interface UseNotificacionesResult {
  notificaciones: Notificacion[];
  noLeidas: Notificacion[];
  conectado: boolean;
  error: string | null;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  cantidadNoLeidas: number;
}

/**
 * Hook de notificaciones en tiempo real para representantes.
 * - Conecta a SSE para recibir notificaciones instantáneas.
 * - Carga inicial desde /api/notificaciones/representante.
 * - Expone marcarLeida() y marcarTodasLeidas().
 */
export function useNotificacionesRepresentante(): UseNotificacionesResult {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState<Notificacion[]>([]);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Conectar a SSE ──────────────────────────────────────
  useEffect(() => {
    const connect = () => {
      // Limpiar conexión anterior
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource("/api/notificaciones/sse");
        eventSourceRef.current = es;
        setConectado(true);
        setError(null);

        es.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === "notificaciones" && Array.isArray(payload.data)) {
              const nuevas: Notificacion[] = payload.data;
              let hayFresh = false;
              setNotificaciones((prev) => {
                const ids = new Set(prev.map((n) => n.id));
                const fresh = nuevas.filter((n) => !ids.has(n.id));
                if (fresh.length > 0) hayFresh = true;
                return [...fresh, ...prev];
              });
              setNoLeidas((prev) => {
                const ids = new Set(prev.map((n) => n.id));
                const fresh = nuevas.filter((n) => !ids.has(n.id) && !n.leida);
                return [...fresh, ...prev];
              });
              // Reproducir sonido si hay notificaciones nuevas no del sistema
              if (hayFresh && nuevas.some((n) => n.tipo !== "SISTEMA")) {
                playNotificationSound();
                // Disparar evento para refrescar dashboard
                window.dispatchEvent(new CustomEvent("dashboard:refresh"));
              }
            } else if (payload.type === "ping") {
              // Keepalive, ignorar
            }
          } catch {
            // Ignorar mensajes mal formados
          }
        };

        es.onerror = () => {
          setConectado(false);
          setError("Error de conexión en tiempo real");
          es.close();

          // Reintentar en 5 segundos
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };
      } catch {
        setError("No se pudo establecer conexión SSE");
        // Reintentar
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // ── Carga inicial desde REST ────────────────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/notificaciones/representante?noLeidas=true&limit=50");
        if (!res.ok) return;
        const data = await res.json();
        const lista: Notificacion[] = data.notificaciones ?? [];
        if (Array.isArray(lista)) {
          setNoLeidas(lista.filter((n) => !n.leida));
          setNotificaciones(lista);
        }
      } catch {
        // Silencioso
      }
    };

    fetchInitial();
  }, []);

  // ── Marcar leída ────────────────────────────────────────
  const marcarLeida = useCallback(async (id: string) => {
    // Optimista
    setNoLeidas((prev) => prev.filter((n) => n.id !== id));
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );

    try {
      await fetch("/api/notificaciones/marcar-leida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificacionId: id }),
      });
    } catch {
      // Revertir en caso de error
      // (simplificado: no revierte para mantener UX fluida)
    }
  }, []);

  // ── Marcar todas leídas ─────────────────────────────────
  const marcarTodasLeidas = useCallback(async () => {
    setNoLeidas([]);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));

    try {
      await fetch("/api/notificaciones/representante", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todas: true }),
      });
    } catch {
      // Silencioso
    }
  }, []);

  return {
    notificaciones,
    noLeidas,
    conectado,
    error,
    marcarLeida,
    marcarTodasLeidas,
    cantidadNoLeidas: noLeidas.length,
  };
}
