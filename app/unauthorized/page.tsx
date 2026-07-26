export const dynamic = 'force-dynamic';
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <span className="text-4xl">🚫</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
          Acceso No Autorizado
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
          No tienes permisos para acceder a esta sección.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/login"
            className="btn-primary"
          >
            🔑 Iniciar Sesión
          </Link>
          <Link
            href="/"
            className="btn-secondary"
          >
            🏠 Ir al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
