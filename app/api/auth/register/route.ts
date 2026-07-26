export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nombre, rol } = body;

    if (!email || !password || !nombre || !rol) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    const rolesValidos = ["profesor", "representante", "directivo"];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json(
        { success: false, error: "Rol no válido" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json(
        { success: false, error: "Este email ya está registrado" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    await prisma.usuario.create({
      data: { email, password: hash, nombre, rol },
    });

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
