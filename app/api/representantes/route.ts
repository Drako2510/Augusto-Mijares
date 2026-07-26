import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/representantes — Lista de representantes (para dropdowns)
export async function GET() {
  const session = await getSession();

  if (!session || session.rol !== "directivo") {
    return NextResponse.json(
      { error: "Solo directivos pueden ver esta lista" },
      { status: 403 }
    );
  }

  try {
    const representantes = await prisma.usuario.findMany({
      where: { rol: "representante", activo: true },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ representantes });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener representantes" },
      { status: 500 }
    );
  }
}
