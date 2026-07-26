"use client";

import { useInstitucion } from "@/components/InstitucionProvider";

export function DashboardNavbar() {
  const { nombre, logo } = useInstitucion();

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200/50 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="/"
          className="flex items-center gap-3 text-lg font-extrabold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-yellow-500 text-base text-white shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 group-hover:scale-105 transition-all duration-300 overflow-hidden ring-2 ring-white dark:ring-gray-800">
            {logo ? <img src={logo} alt="Logo" className="h-full w-full object-cover" /> : "📚"}
          </span>
          <span className="hidden sm:inline bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {nombre}
          </span>
        </a>
      </div>
    </nav>
  );
}
