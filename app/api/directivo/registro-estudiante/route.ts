import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "password123";

// POST /api/directivo/registro-estudiante — Solo directivos
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || session.rol !== "directivo") {
    return NextResponse.json(
      { success: false, error: "Solo directivos pueden registrar estudiantes" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { nombre, anio, seccion, fechaNacimiento, activo, modoRepresentante } = body;

    if (!nombre || !anio || !seccion) {
      return NextResponse.json(
        { success: false, error: "Nombre, año y sección son obligatorios" },
        { status: 400 }
      );
    }

    // ── Obtener o crear representante ──────────────────
    let representante;

    if (modoRepresentante === "existente") {
      // Usar representante existente
      const { repExistenteId } = body;
      if (!repExistenteId) {
        return NextResponse.json(
          { success: false, error: "Selecciona un representante" },
          { status: 400 }
        );
      }
      representante = await prisma.usuario.findFirst({
        where: { id: repExistenteId, rol: "representante", activo: true },
      });
      if (!representante) {
        return NextResponse.json(
          { success: false, error: "Representante no encontrado" },
          { status: 404 }
        );
      }
    } else {
      // Crear nuevo representante
      const { repNombre, repApellido, repCedula, repTelefono } = body;
      if (!repNombre || !repApellido || !repCedula) {
        return NextResponse.json(
          { success: false, error: "Nombre, apellido y cédula del representante son obligatorios" },
          { status: 400 }
        );
      }

      const soloNumeros = repCedula.trim().replace(/\D/g, "");
      const repEmail = `${soloNumeros}@escuela.edu`;
      const repNombreCompleto = `${repNombre.trim()} ${repApellido.trim()}`;

      representante = await prisma.usuario.findUnique({
        where: { email: repEmail },
      });

      if (!representante) {
        const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        representante = await prisma.usuario.create({
          data: {
            email: repEmail,
            password: hash,
            nombre: repNombreCompleto,
            rol: "representante",
          },
        });
      }
    }

    // ── Crear estudiante + relación ──────────────────────
    const estudiante = await prisma.estudiante.create({
      data: {
        nombre: nombre.trim(),
        anio,
        seccion,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        activo: activo !== false,
        representantes: {
          create: {
            representanteId: representante.id,
          },
        },
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "REGISTRO_ESTUDIANTE",
        detalle: `Registrado estudiante "${nombre.trim()}" en ${anio} "${seccion}". Representante: ${representante.nombre} (${representante.email})`,
      },
    });

    return NextResponse.json({
      success: true,
      estudiante: {
        id: estudiante.id,
        nombre: estudiante.nombre,
        anio: estudiante.anio,
        seccion: estudiante.seccion,
      },
      representante: {
        id: representante.id,
        nombre: representante.nombre,
        email: representante.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error interno al registrar estudiante" },
      { status: 500 }
    );
  }
}
