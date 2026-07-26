export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DirectivoPermisos } from "@/lib/permissions";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "asistencia-plus-secret-key-2025"
);

// POST /api/directivo/validar-clave
// Solo directivos. Valida clave secreta y retorna token de edición temporal (30 min).
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json(
      { success: false, error: "Solo los directivos pueden validar claves" },
      { status: 403 }
    );
  }

  try {
    const { materiaId, anio, seccion, clave } = await request.json();

    if (!materiaId || !anio || !seccion || !clave) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: materiaId, anio, seccion, clave" },
        { status: 400 }
      );
    }

    // 1. Primero buscar clave temporal (OTP de 5 min, 1 solo uso)
    const claveTemp = await prisma.claveTemporal.findFirst({
      where: {
        clave,
        materiaId,
        anio,
        seccion,
        usado: false,
        expiraAt: { gte: new Date() },
      },
    });

    if (claveTemp) {
      // Marcar como usada (1 solo uso)
      await prisma.claveTemporal.update({
        where: { id: claveTemp.id },
        data: { usado: true },
      });

      // Log éxito
      await prisma.logAuditoria.create({
        data: {
          usuarioId: session.userId,
          accion: "VALIDACION_CLAVE_TEMPORAL_EXITOSA",
          detalle: `Clave temporal válida para ${materiaId} - ${anio} "${seccion}" (generada por profesor). Un solo uso.`,
        },
      });

      // Generar token de edición
      const expiracionMinutos = Number(process.env.CLAVE_EXPIRACION_MINUTOS) || 30;
      const expiracionStr = `${expiracionMinutos}min`;
      const tokenEdicion = await new SignJWT({
        userId: session.userId, rol: "directivo", permiso: "edicion",
        materiaId, anio, seccion,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiracionStr)
        .sign(SECRET);

      return NextResponse.json({ success: true, token: tokenEdicion, expiraEn: expiracionStr, tipo: "temporal" });
    }

    // 2. Si no es temporal, validar clave secreta permanente
    const resultado = await DirectivoPermisos.canEdit(materiaId, anio, seccion, clave);

    // 3. Registrar en log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: resultado.permitido
          ? "VALIDACION_CLAVE_EXITOSA"
          : "VALIDACION_CLAVE_FALLIDA",
        detalle: `${materiaId} - ${anio} "${seccion}" — ${
          resultado.permitido ? "Clave válida" : "Clave incorrecta"
        }`,
      },
    });

    if (!resultado.permitido) {
      return NextResponse.json(
        { success: false, error: resultado.motivo },
        { status: 401 }
      );
    }

    // 4. Generar token temporal de edición
    const expiracionMinutos = Number(process.env.CLAVE_EXPIRACION_MINUTOS) || 30;
    const expiracionStr = `${expiracionMinutos}min`;

    const tokenEdicion = await new SignJWT({
      userId: session.userId,
      rol: "directivo",
      permiso: "edicion",
      materiaId,
      anio,
      seccion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiracionStr)
      .sign(SECRET);

    return NextResponse.json({
      success: true,
      token: tokenEdicion,
      expiraEn: expiracionStr,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al validar clave" },
      { status: 500 }
    );
  }
}
