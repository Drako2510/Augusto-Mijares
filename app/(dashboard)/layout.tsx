export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { DashboardLayoutClient } from "./DashboardLayoutClient";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard — Asistencia Plus",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const rol = session?.rol || "representante";

  return <DashboardLayoutClient rol={rol}>{children}</DashboardLayoutClient>;
}
