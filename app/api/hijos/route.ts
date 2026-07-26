import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { RepresentantePermisos } from "@/lib/permissions";

// GET /api/hijos?usuarioId=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const usuarioId = searchParams.get("usuarioId") ?? session.userId;

  // Solo representante puede ver sus hijos, o directivo puede ver de cualquiera
  if (usuarioId !== session.userId && session.rol !== "directivo") {
    return NextResponse.json(
      { error: "No puedes ver los hijos de otro usuario" },
      { status: 403 }
    );
  }

  if (session.rol === "profesor") {
    return NextResponse.json(
      { error: "Los profesores no tienen hijos asignados" },
      { status: 403 }
    );
  }

  try {
    const relaciones = await RepresentantePermisos.getHijos(usuarioId);
    const hijos = relaciones.map((r) => ({
      id: r.estudiante.id,
      nombre: r.estudiante.nombre,
      anio: r.estudiante.anio,
      seccion: r.estudiante.seccion,
    }));

    return NextResponse.json({ hijos });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener hijos" },
      { status: 500 }
    );
  }
}
