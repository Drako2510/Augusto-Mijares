import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-400/10 dark:bg-indigo-600/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-400/5 dark:bg-purple-600/3 blur-3xl" />
      </div>

      {/* Sidebar flotante */}
      <Sidebar rol={rol} />

      {/* Main content offset for sidebar */}
      <div className="ml-[72px] xl:ml-[244px] transition-all duration-200">
        {/* Navbar */}
        <DashboardNavbar />

        {/* Contenido */}
        <div className="relative z-10 animate-revealUp">
          {children}
        </div>
      </div>

    </div>
  );
}
