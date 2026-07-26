"use client";

import { useInstitucion } from "@/components/InstitucionProvider";

interface Props {
  onMenuClick: () => void;
}

export function DashboardNavbar({ onMenuClick }: Props) {
  const { nombre } = useInstitucion();

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200/50 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500">
      <div className="flex items-center justify-between px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Hamburguesa móvil */}
          <button
            onClick={onMenuClick}
            className="xl:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl">☰</span>
          </button>

          <a href="/" className="flex items-center gap-2 sm:gap-3 group">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-yellow-500 text-xs sm:text-base text-white shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 group-hover:scale-105 transition-all duration-300 ring-2 ring-white dark:ring-gray-800">
              📚
            </span>
            <span className="text-sm sm:text-lg font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate max-w-[140px] sm:max-w-xs">
              {nombre}
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}
