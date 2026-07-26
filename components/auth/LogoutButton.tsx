"use client";

import { useRouter } from "next/navigation";

/**
 * Botón de cerrar sesión que invalida TODAS las claves de edición
 * guardadas en sessionStorage antes de redirigir al logout.
 */
export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // 1. Invalidar todas las claves de edición en sessionStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith("clave_") || key.startsWith("clave_expira_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    // 2. Llamar al endpoint de logout (limpia la cookie JWT)
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continuar aunque falle
    }

    // 3. Redirigir al login
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-600 transition-all hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600"
    >
      🚪 Cerrar Sesión
    </button>
  );
}
