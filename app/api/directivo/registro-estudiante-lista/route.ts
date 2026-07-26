export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/directivo/registro-estudiante-lista
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "directivo") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { estudiantes } = await request.json();

    if (!estudiantes || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return NextResponse.json({ error: "Lista de estudiantes requerida" }, { status: 400 });
    }

    let registrados = 0;
    const errores: string[] = [];

    for (const est of estudiantes) {
      try {
        const { nombre, anio, seccion, cedulaRep, repNombre, repApellido, telefonoRep } = est;
        if (!nombre || !anio || !seccion) continue;

        // Buscar o crear representante por cédula
        let representanteId: string | null = null;
        if (cedulaRep) {
          const soloNumeros = cedulaRep.replace(/\D/g, "");
          const emailRep = `${soloNumeros}@escuela.edu`;
          let rep = await prisma.usuario.findUnique({ where: { email: emailRep } });
          if (!rep) {
            const nombreRep = repNombre && repApellido
              ? `${repNombre} ${repApellido}`
              : `Representante de ${nombre.split(" ")[0]}`;
            rep = await prisma.usuario.create({
              data: {
                email: emailRep,
                password: await bcrypt.hash(soloNumeros, 10),
                nombre: nombreRep,
                rol: "representante",
                activo: true,
              },
            });
          }
          representanteId = rep.id;
        }

        // Crear estudiante
        const estudiante = await prisma.estudiante.create({
          data: {
            nombre,
            anio,
            seccion,
            activo: true,
            solvente: true,
          },
        });

        // Vincular representante si existe
        if (representanteId) {
          await prisma.representanteHijo.create({
            data: { representanteId, estudianteId: estudiante.id },
          });
        }

        registrados++;
      } catch (e: any) {
        errores.push(`${est.nombre}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      registrados,
      errores: errores.length > 0 ? errores : undefined,
      message: `${registrados} estudiantes registrados correctamente`,
    });
  } catch {
    return NextResponse.json({ error: "Error al registrar estudiantes" }, { status: 500 });
  }
}
