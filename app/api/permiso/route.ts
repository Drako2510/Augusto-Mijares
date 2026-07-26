import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ProfesorPermisos } from "@/lib/permissions";

// GET /api/permiso?materiaId=...&anio=...&seccion=...&usuarioId=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const materiaId = searchParams.get("materiaId") ?? "";
  const anio = searchParams.get("anio") ?? "";
  const seccion = searchParams.get("seccion") ?? "";
  const usuarioId = searchParams.get("usuarioId") ?? session.userId;

  // Solo verificar permisos propios o de subordinados (directivo puede ver de otros)
  if (usuarioId !== session.userId && session.rol !== "directivo") {
    return NextResponse.json(
      { error: "No puedes verificar permisos de otro usuario" },
      { status: 403 }
    );
  }

  try {
    const resultado = await ProfesorPermisos.canEdit(
      usuarioId,
      materiaId,
      anio,
      seccion
    );
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(
      { error: "Error al verificar permisos" },
      { status: 500 }
    );
  }
}
