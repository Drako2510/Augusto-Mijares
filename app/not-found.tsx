import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl">🔍</span>
      <h1 className="mt-4 text-2xl font-extrabold text-gray-800 dark:text-gray-100">
        No encontramos esta página
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
        La materia, año o sección que buscas no existe. Verifica la ruta o
        regresa al inicio.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
