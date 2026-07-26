"use client";

import { useThemeContext } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useThemeContext();

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200/50 dark:border-gray-600/30 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group"
      title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
    >
      <span className="text-lg transition-transform duration-500 group-hover:rotate-12">
        {theme === "light" ? "🌙" : "☀️"}
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
