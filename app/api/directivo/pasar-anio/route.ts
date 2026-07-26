import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/directivo/pasar-anio
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "directivo") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { anio, seccion, estudianteIds, todos } = await request.json();

    if (!anio || !seccion) {
      return NextResponse.json({ error: "anio y seccion son requeridos" }, { status: 400 });
    }

    // Si es "todos", obtener todos los IDs de estudiantes activos de esa sección
    let ids: string[] = estudianteIds;
    if (todos) {
      const ests = await prisma.estudiante.findMany({
        where: { anio, seccion, activo: true },
        select: { id: true },
      });
      ids = ests.map((e) => e.id);
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, pasados: 0, message: "No hay estudiantes para promover" });
    }

    // Determinar el siguiente año
    const ordenAnios = ["1ro", "2do", "3ro", "4to", "5to"];
    const idx = ordenAnios.indexOf(anio);
    if (idx === -1) return NextResponse.json({ error: "Año inválido" }, { status: 400 });

    if (idx === ordenAnios.length - 1) {
      // 5to: egresan, se desactivan
      await prisma.estudiante.updateMany({
        where: { id: { in: ids }, anio, seccion },
        data: { activo: false },
      });
      await prisma.logAuditoria.create({
        data: {
          usuarioId: session.userId,
          accion: "PASAR_ANIO_EGRESO",
          detalle: `${ids.length} estudiantes de ${anio} "${seccion}" egresaron`,
        },
      });
      return NextResponse.json({ success: true, pasados: ids.length, egresados: true });
    }

    const siguienteAnio = ordenAnios[idx + 1];

    // Pasar al siguiente año
    await prisma.estudiante.updateMany({
      where: { id: { in: ids }, anio, seccion },
      data: { anio: siguienteAnio },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "PASAR_ANIO",
        detalle: `${ids.length} estudiantes de ${anio} "${seccion}" promovidos a ${siguienteAnio} "${seccion}"`,
      },
    });

    return NextResponse.json({
      success: true,
      pasados: ids.length,
      siguienteAnio,
      message: `${ids.length} estudiantes pasaron de ${anio} a ${siguienteAnio} "${seccion}"`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
