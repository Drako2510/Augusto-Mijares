"use client";

import { useThemeContext } from "@/components/ThemeProvider";

export function FloatingThemeSwitch() {
  const { theme, toggle } = useThemeContext();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-600/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-4 py-3 group"
      title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
    >
      <span className="text-xl">{theme === "light" ? "🌙" : "☀️"}</span>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
        {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
      </span>
    </button>
  );
}
