import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerUltimoTimestamp } from "@/lib/eventos";
import { registrarConexion } from "@/lib/sse-connections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/notificaciones/sse
 * Server-Sent Events con conexiones rastreables.
 * Se registra en sse-connections para que el endpoint de eventos
 * pueda notificar instantáneamente sin esperar el polling.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("No autenticado", { status: 401 });
  }

  if (session.rol !== "representante" && session.rol !== "directivo") {
    return new Response("Rol no autorizado para SSE", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastTimestamp = obtenerUltimoTimestamp(session.userId);

      const write = (data: string) => {
        if (!closed) {
          try { controller.enqueue(encoder.encode(data)); } catch { closed = true; }
        }
      };

      // Registrar esta conexión en el pool compartido
      const unregister = registrarConexion(session.userId, {
        write: (data: string) => {
          if (!closed) {
            try { controller.enqueue(encoder.encode(data)); } catch { closed = true; }
          }
        },
        close: () => { closed = true; },
      });

      // Enviar notificaciones iniciales (no enviadas)
      try {
        const iniciales = await prisma.notificacion.findMany({
          where: { usuarioId: session.userId, enviado: false },
          orderBy: { fecha: "asc" },
          take: 10,
          include: {
            estudiante: { select: { nombre: true, anio: true, seccion: true } },
            materia: { select: { nombre: true, icono: true } },
          },
        });

        if (iniciales.length > 0) {
          await prisma.notificacion.updateMany({
            where: { id: { in: iniciales.map((n) => n.id) } },
            data: { enviado: true },
          });

          write(
            `data: ${JSON.stringify({
              type: "notificaciones",
              data: iniciales.map((n) => ({
                id: n.id,
                tipo: n.tipo,
                titulo: n.titulo,
                mensaje: n.mensaje,
                leida: n.leida,
                fecha: n.fecha.toISOString(),
                estudianteId: n.estudianteId,
                materiaId: n.materiaId,
                estudiante: n.estudiante,
                materia: n.materia,
              })),
            })}\n\n`
          );
        } else {
          write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
        }
      } catch {
        write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
      }

      // Polling de respaldo cada 10s para notificaciones no capturadas por push
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const fresh = await prisma.notificacion.findMany({
            where: { usuarioId: session.userId, enviado: false },
            orderBy: { fecha: "asc" },
            take: 5,
            include: {
              estudiante: { select: { nombre: true, anio: true, seccion: true } },
              materia: { select: { nombre: true, icono: true } },
            },
          });

          if (fresh.length > 0) {
            await prisma.notificacion.updateMany({
              where: { id: { in: fresh.map((n) => n.id) } },
              data: { enviado: true },
            });

            write(
              `data: ${JSON.stringify({
                type: "notificaciones",
                data: fresh.map((n) => ({
                  id: n.id,
                  tipo: n.tipo,
                  titulo: n.titulo,
                  mensaje: n.mensaje,
                  leida: n.leida,
                  fecha: n.fecha.toISOString(),
                  estudianteId: n.estudianteId,
                  materiaId: n.materiaId,
                  estudiante: n.estudiante,
                  materia: n.materia,
                })),
              })}\n\n`
            );
          } else {
            write(": keepalive\n\n");
          }
        } catch {
          write(": keepalive\n\n");
        }
      }, 10000);

      // Cleanup al desconectar
      const cleanup = () => {
        closed = true;
        clearInterval(interval);
        unregister();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
