import Link from "next/link";
import type { Materia } from "@/data/seed";

export default function MateriaCard({ materia }: { materia: Materia }) {
  return (
    <Link
      href={`/materia/${materia.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 hover:shadow-lg dark:shadow-gray-900/50 hover:-translate-y-1 hover:border-brand-blue/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
    >
      <div className="flex items-start justify-between">
        <span className="text-4xl">{materia.icono}</span>
        <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
          {materia.estudiantesInscritos} estudiantes
        </span>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-brand-blue transition-colors">
          {materia.nombre}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Ver años y secciones disponibles
        </p>
      </div>
    </Link>
  );
}
