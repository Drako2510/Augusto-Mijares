import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/directivo/profesor/[id]/asignacion — Agregar asignación a profesor existente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json(
      { error: "Solo los directivos pueden realizar esta acción" },
      { status: 403 }
    );
  }

  try {
    const { materiaId, anio, seccion, passwordConfirmacion } =
      await request.json();

    if (!materiaId || !anio || !seccion) {
      return NextResponse.json(
        { error: "Materia, año y sección son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el profesor existe
    const profesor = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: { id: true, rol: true, nombre: true },
    });

    if (!profesor || profesor.rol !== "profesor") {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar contraseña del directivo como confirmación
    if (!passwordConfirmacion) {
      return NextResponse.json(
        { error: "Debes ingresar tu contraseña para confirmar" },
        { status: 400 }
      );
    }

    const directivo = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { password: true },
    });

    if (!directivo) {
      return NextResponse.json(
        { error: "Directivo no encontrado" },
        { status: 404 }
      );
    }

    const passwordValida = await bcrypt.compare(
      passwordConfirmacion,
      directivo.password
    );

    if (!passwordValida) {
      return NextResponse.json(
        { error: "Contraseña incorrecta. No se puede confirmar la asignación." },
        { status: 403 }
      );
    }

    // Verificar que no exista ya una asignación para esa materia/año/sección
    const existente = await prisma.profesorMateria.findFirst({
      where: {
        materiaId,
        anio,
        seccion,
        activo: true,
      },
    });

    if (existente) {
      return NextResponse.json(
        {
          error: `Ya existe un profesor asignado a ${materiaId} - ${anio} "${seccion}". Una materia no puede tener dos profesores.`,
        },
        { status: 409 }
      );
    }

    // Generar clave secreta automáticamente (sin mostrarla al directivo)
    const prefijo = materiaId.slice(0, 3).toUpperCase();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let aleatorio = "";
    for (let i = 0; i < 4; i++) {
      aleatorio += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const claveSecreta = `${prefijo}${anio.slice(0, 1)}${seccion}${aleatorio}`;

    // Crear la asignación
    const asignacion = await prisma.profesorMateria.create({
      data: {
        usuarioId: params.id,
        materiaId,
        anio,
        seccion,
        claveSecreta,
        activo: true,
      },
      include: {
        materia: { select: { nombre: true, icono: true } },
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "ASIGNACION_CREADA",
        detalle: `Nueva asignación para profesor ${profesor.nombre}: ${asignacion.materia.nombre} - ${anio} "${seccion}"`,
      },
    });

    return NextResponse.json({
      success: true,
      asignacion: {
        id: asignacion.id,
        materiaId: asignacion.materiaId,
        materia: asignacion.materia,
        anio: asignacion.anio,
        seccion: asignacion.seccion,
      },
      message: `Asignación creada: ${asignacion.materia.nombre} - ${anio} "${seccion}"`,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al crear la asignación" },
      { status: 500 }
    );
  }
}
