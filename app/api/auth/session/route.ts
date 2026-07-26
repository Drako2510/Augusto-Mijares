import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Obtener nombre desde BD para tener datos frescos
  let nombre = "";
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { nombre: true },
    });
    nombre = usuario?.nombre ?? "";
  } catch {
    nombre = "";
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      nombre,
      rol: session.rol,
    },
  });
}
