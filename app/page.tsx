import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  // Si ya está autenticado, redirigir a su dashboard según rol
  if (session) {
    const dashboards: Record<string, string> = {
      profesor: "/profesor",
      representante: "/representante",
      directivo: "/directivo",
    };
    redirect(dashboards[session.rol] ?? "/login");
  }

  // Si no está autenticado, mostrar login
  redirect("/login");
}
