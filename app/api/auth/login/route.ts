export const dynamic = "force-dynamic";

import { login } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rol } = body;

    if (!email || !password || !rol) {
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

    const result = await login(email, password, rol);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
