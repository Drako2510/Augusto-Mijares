import Link from "next/link";
import type { Anio } from "@/data/seed";

export default function AnioSelector({
  anios,
  materiaId,
}: {
  anios: Anio[];
  materiaId: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {anios.map((anio) => (
        <Link
          key={anio.id}
          href={`/materia/${materiaId}/${anio.id}`}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-brand-blue/20 bg-white dark:bg-gray-900 px-4 py-8 text-center shadow-sm dark:shadow-gray-900/30 hover:border-brand-blue hover:bg-brand-blue/5 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <span className="text-2xl font-extrabold text-brand-blue">
            {anio.nombre}
          </span>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Año escolar</span>
        </Link>
      ))}
    </div>
  );
}
