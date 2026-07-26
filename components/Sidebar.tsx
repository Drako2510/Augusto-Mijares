"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AjustesModal } from "@/components/AjustesModal";
import { useInstitucion } from "@/components/InstitucionProvider";
import { useThemeContext } from "@/components/ThemeProvider";
import { useSession } from "@/hooks/useSession";

const NAV_ITEMS: Record<string, { href: string; icon: string; label: string }[]> = {
  directivo: [
    { href: "/directivo", icon: "👔", label: "Inicio" },
    { href: "/directivo/registro/profesor", icon: "👨‍🏫", label: "Registrar Profesor" },
    { href: "/directivo/registro/estudiante", icon: "👨‍🎓", label: "Registrar Estudiante" },
  ],
  profesor: [
    { href: "/profesor", icon: "📚", label: "Mis Materias" },
  ],
  representante: [
    { href: "/representante", icon: "🏠", label: "Inicio" },
  ],
};

interface Props {
  rol: string;
  abierto: boolean;
  onClose: () => void;
}

export function Sidebar({ rol, abierto, onClose }: Props) {
  const pathname = usePathname();
  const { user } = useSession();
  const { theme, toggle } = useThemeContext();
  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  const items = NAV_ITEMS[rol] || NAV_ITEMS.representante;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const iniciales = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
    : "?";

  return (
    <>
      {/* Overlay móvil */}
      {abierto && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 transition-transform duration-300 xl:translate-x-0 xl:z-40 xl:w-[72px] xl:w-[244px] ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Perfil del usuario */}
        <div className="px-3 mb-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-yellow-500 text-white text-lg font-bold shadow-lg shadow-green-500/30 ring-2 ring-white dark:ring-gray-800">
              {iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                {user?.nombre || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{rol}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto sidebar-scroll">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 space-y-1 mt-auto border-t border-gray-200 dark:border-gray-800 pt-3">
          <button onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
            <span className="text-xl flex-shrink-0">{theme === "light" ? "🌙" : "☀️"}</span>
            <span>{theme === "light" ? "Modo Oscuro" : "Modo Claro"}</span>
          </button>

          <button onClick={() => { setMostrarAjustes(true); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
            <span className="text-xl flex-shrink-0">⚙️</span>
            <span>Ajustes</span>
          </button>

          <Link href="/login" onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
            <span className="text-xl flex-shrink-0">🚪</span>
            <span>Salir</span>
          </Link>
        </div>
      </aside>

      {mostrarAjustes && <AjustesModal rol={rol} onClose={() => setMostrarAjustes(false)} />}
    </>
  );
}
