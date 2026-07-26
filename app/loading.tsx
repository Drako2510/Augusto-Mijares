/**
 * Componente de carga global — se muestra durante transiciones entre páginas.
 */
export default function GlobalLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-bg gap-6">
      {/* Spinner animado */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <span className="absolute text-2xl">📚</span>
      </div>

      {/* Texto con shimmer */}
      <div className="text-center space-y-2">
        <div className="shimmer mx-auto h-5 w-48 rounded" />
        <div className="shimmer mx-auto h-3 w-32 rounded" />
      </div>

      <p className="text-sm text-gray-400 animate-pulse">Cargando...</p>
    </main>
  );
}
