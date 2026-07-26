import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/migrar — recibe datos de localStorage y los persiste en BD
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "No autenticado" },
      { status: 401 }
    );
  }

  // Solo profesores y directivos pueden migrar datos
  if (session.rol !== "profesor" && session.rol !== "directivo") {
    return NextResponse.json(
      { success: false, error: "No tienes permisos para migrar datos" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { asistencias, evaluaciones, tareas } = body;
    let total = 0;

    // ── Migrar asistencias ───────────────────────────────
    if (asistencias && typeof asistencias === "object") {
      for (const [key, registros] of Object.entries(asistencias)) {
        if (!Array.isArray(registros)) continue;

        // Extraer materia, anio, seccion de la key
        // Formato: asistencias_[materia]_[anio]_[seccion]
        const partes = key.split("_");
        if (partes.length < 4) continue;
        const materiaId = partes[1];
        const anio = partes[2];
        const seccion = partes[3];

        for (const reg of registros) {
          try {
            const nombreEstudiante = reg.nombre ?? reg.estudiante ?? "";
            if (!nombreEstudiante) continue;

            // Buscar estudiante por nombre
            const estudiante = await prisma.estudiante.findFirst({
              where: { nombre: nombreEstudiante, anio, seccion },
            });
            if (!estudiante) continue;

            const estado = reg.estado ?? "sin_marcar";
            if (estado === "sin_marcar") continue; // No migrar sin marcar

            await prisma.asistencia.upsert({
              where: {
                estudianteId_materiaId_fecha: {
                  estudianteId: estudiante.id,
                  materiaId,
                  fecha: new Date(reg.fecha ?? Date.now()),
                },
              },
              update: { estado },
              create: {
                estudianteId: estudiante.id,
                materiaId,
                fecha: new Date(reg.fecha ?? Date.now()),
                estado,
              },
            });
            total++;
          } catch {
            // Silencioso: saltar registros problemáticos
          }
        }
      }
    }

    // ── Migrar evaluaciones ─────────────────────────────
    if (evaluaciones && typeof evaluaciones === "object") {
      for (const [key, registros] of Object.entries(evaluaciones)) {
        if (!Array.isArray(registros)) continue;
        const partes = key.split("_");
        if (partes.length < 4) continue;
        const materiaId = partes[1];
        const anio = partes[2];
        const seccion = partes[3];

        for (const reg of registros) {
          try {
            if (!reg.titulo) continue;

            // Buscar estudiantes de la sección y asignar la evaluación al primero
            const estudiante = await prisma.estudiante.findFirst({
              where: { anio, seccion },
            });
            if (!estudiante) continue;

            await prisma.evaluacion.create({
              data: {
                estudianteId: estudiante.id,
                materiaId,
                tipo: "examen",
                titulo: reg.titulo,
                calificacion: 0,
                fecha: new Date(reg.fechaISO ?? Date.now()),
              },
            });
            total++;
          } catch {
            // Silencioso
          }
        }
      }
    }

    // ── Migrar tareas ────────────────────────────────────
    if (tareas && typeof tareas === "object") {
      for (const [key, registros] of Object.entries(tareas)) {
        if (!Array.isArray(registros)) continue;
        const partes = key.split("_");
        if (partes.length < 4) continue;
        const materiaId = partes[1];

        for (const reg of registros) {
          try {
            if (!reg.titulo) continue;

            await prisma.tarea.create({
              data: {
                materiaId,
                titulo: reg.titulo,
                descripcion: reg.descripcion ?? "",
                fechaEntrega: new Date(reg.fechaEntrega ?? Date.now()),
              },
            });
            total++;
          } catch {
            // Silencioso
          }
        }
      }
    }

    // Registrar en log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "MIGRACION_LOCALSTORAGE",
        detalle: `Migrados ${total} registros desde localStorage a BD`,
      },
    });

    return NextResponse.json({
      success: true,
      total,
      message: `✅ ${total} registros migrados exitosamente.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error en la migración",
        message: "❌ Ocurrió un error durante la migración. Intenta de nuevo.",
      },
      { status: 500 }
    );
  }
}
