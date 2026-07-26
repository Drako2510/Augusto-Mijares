import Link from "next/link";
import type { Seccion } from "@/data/seed";

export default function SeccionSelector({
  secciones,
  materiaId,
  anioId,
}: {
  secciones: Seccion[];
  materiaId: string;
  anioId: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {secciones.map((seccion) => (
        <Link
          key={seccion.id}
          href={`/materia/${materiaId}/${anioId}/${seccion.id}/dashboard`}
          className={`flex min-h-[100px] flex-col items-center justify-center rounded-2xl border-2 shadow-sm dark:shadow-gray-900/30 hover:-translate-y-0.5 hover:shadow-md dark:shadow-gray-900/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue ${seccion.colorClass}`}
        >
          <span className="text-3xl font-extrabold">{seccion.nombre}</span>
          <span className="mt-1 text-xs font-medium opacity-80">Sección</span>
        </Link>
      ))}
    </div>
  );
}
