import { getSession } from "@/lib/auth";
import { ProfesorPermisos } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { ProfesorDashboardCliente } from "./ProfesorDashboardCliente";

export const dynamic = "force-dynamic";

export default async function ProfesorDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/profesor");
  }

  if (session.rol !== "profesor") {
    redirect("/unauthorized");
  }

  const asignaciones = await ProfesorPermisos.getAsignaciones(session.userId);

  return <ProfesorDashboardCliente asignaciones={asignaciones} />;
}
