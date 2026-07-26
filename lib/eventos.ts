/**
 * Sistema de eventos simple para notificaciones en tiempo real.
 *
 * Como Next.js en serverless no soporta WebSockets nativamente,
 * usamos un store en memoria para coordinar el SSE polling.
 *
 * En producción, reemplazar por Redis Pub/Sub o similar.
 */

type EventoCallback = () => void;

interface UltimoEvento {
  timestamp: number;
  usuarioIds: Set<string>;
}

// Store global en memoria (se reinicia en cada deploy/serverless cold start)
const listeners = new Map<string, Set<EventoCallback>>();
const ultimoEvento = new Map<string, UltimoEvento>();

/**
 * Registra un listener para eventos de un usuario específico.
 * El SSE endpoint llama esto para ser notificado.
 */
export function suscribir(usuarioId: string, callback: EventoCallback): () => void {
  if (!listeners.has(usuarioId)) {
    listeners.set(usuarioId, new Set());
  }
  listeners.get(usuarioId)!.add(callback);

  // Retornar función de limpieza
  return () => {
    listeners.get(usuarioId)?.delete(callback);
    if (listeners.get(usuarioId)?.size === 0) {
      listeners.delete(usuarioId);
    }
  };
}

/**
 * Dispara un evento de notificación para los usuarios específicos.
 * Notifica a los listeners SSE suscritos.
 */
export function emitirEvento(usuarioIds: string[]): void {
  const ts = Date.now();

  for (const uid of usuarioIds) {
    // Actualizar último evento
    if (!ultimoEvento.has(uid)) {
      ultimoEvento.set(uid, { timestamp: ts, usuarioIds: new Set() });
    }
    ultimoEvento.get(uid)!.timestamp = ts;

    // Notificar listeners SSE
    listeners.get(uid)?.forEach((cb) => {
      try { cb(); } catch { /* ignorar errores de listener */ }
    });
  }

  // Disparar evento global para refrescar dashboards (client-side)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dashboard:refresh"));
  }
}

/**
 * Retorna el timestamp del último evento para un usuario.
 * Útil para polling: si no hay cambios desde la última consulta, no re-consultar BD.
 */
export function obtenerUltimoTimestamp(usuarioId: string): number {
  return ultimoEvento.get(usuarioId)?.timestamp ?? 0;
}

/**
 * Verifica si hay nuevos eventos desde un timestamp dado.
 */
export function hayNuevosEventos(usuarioId: string, desde: number): boolean {
  const ultimo = ultimoEvento.get(usuarioId)?.timestamp ?? 0;
  return ultimo > desde;
}
