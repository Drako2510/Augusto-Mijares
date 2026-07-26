export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/directivo/registro-profesor — Solo directivos
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || session.rol !== "directivo") {
    return NextResponse.json(
      { success: false, error: "Solo directivos pueden registrar profesores" },
      { status: 403 }
    );
  }

  try {
    const {
      nombre,
      apellido,
      email,
      password,
      materiaId,
      anio,
      seccion,
      passwordConfirmacion,
      activo,
    } = await request.json();

    if (!nombre || !apellido || !email || !password || !materiaId || !anio || !seccion) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar contraseña del directivo
    if (!passwordConfirmacion) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar tu contraseña para confirmar" },
        { status: 400 }
      );
    }

    const directivo = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { password: true },
    });

    if (!directivo) {
      return NextResponse.json(
        { success: false, error: "Directivo no encontrado" },
        { status: 404 }
      );
    }

    const passwordValida = await bcrypt.compare(
      passwordConfirmacion,
      directivo.password
    );

    if (!passwordValida) {
      return NextResponse.json(
        { success: false, error: "Contraseña incorrecta. No se puede confirmar el registro." },
        { status: 403 }
      );
    }

    // Verificar email único
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { success: false, error: "Este email ya está registrado" },
        { status: 409 }
      );
    }

    // Verificar que la sección no tenga ya un profesor asignado
    const asignacionExistente = await prisma.profesorMateria.findFirst({
      where: { materiaId, anio, seccion, activo: true },
    });
    if (asignacionExistente) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe un profesor asignado a ${materiaId} - ${anio} "${seccion}"`,
        },
        { status: 409 }
      );
    }

    // Generar clave secreta automáticamente
    const prefijo = materiaId.slice(0, 3).toUpperCase();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let aleatorio = "";
    for (let i = 0; i < 4; i++) {
      aleatorio += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const claveSecreta = `${prefijo}${anio.slice(0, 1)}${seccion}${aleatorio}`;

    // Crear usuario + asignación en transacción
    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hash,
        nombre: `${nombre} ${apellido}`,
        activo: activo !== false,
        rol: "profesor",
        profesorMaterias: {
          create: {
            materiaId,
            anio,
            seccion,
            claveSecreta,
          },
        },
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "REGISTRO_PROFESOR",
        detalle: `Registrado profesor "${nombre} ${apellido}" (${email}) para ${materiaId} - ${anio} "${seccion}"`,
      },
    });

    return NextResponse.json({
      success: true,
      profesor: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      materiaId,
      anio,
      seccion,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error interno al registrar profesor" },
      { status: 500 }
    );
  }
}
