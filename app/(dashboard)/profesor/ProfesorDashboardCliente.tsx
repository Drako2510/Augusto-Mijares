"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { HorarioProfesorModal } from "@/components/profesor/HorarioProfesorModal";

interface Asignacion {
  id: string;
  materiaId: string;
  anio: string;
  seccion: string;
  materia: { nombre: string; icono: string };
}

interface Props {
  asignaciones: Asignacion[];
}

export function ProfesorDashboardCliente({ asignaciones }: Props) {
  const [mostrarHorario, setMostrarHorario] = useState(false);

  useEffect(() => {
    const handler = () => setMostrarHorario(true);
    window.addEventListener("prof:verHorario", handler);
    return () => window.removeEventListener("prof:verHorario", handler);
  }, []);

  // Agrupar por materia
  const porMateria = useMemo(() => {
    const map = new Map<string, Asignacion[]>();
    for (const a of asignaciones) {
      const key = a.materiaId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [asignaciones]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Modal de horario combinado */}
      {mostrarHorario && (
        <HorarioProfesorModal
          asignaciones={asignaciones}
          onClose={() => setMostrarHorario(false)}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
            👨‍🏫 Mis Materias
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Selecciona una de tus asignaciones para gestionar asistencia,
            evaluaciones y tareas.
          </p>
        </div>
      </div>

      {asignaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No tienes materias asignadas aún.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Contacta al directivo para que te asigne una materia.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(porMateria.entries()).map(([materiaId, items]) => {
            const materia = items[0].materia;
            return (
              <div
                key={materiaId}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-1"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{materia.icono}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {materia.nombre}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {items.length} sección
                      {items.length > 1 ? "es" : ""} asignada
                      {items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((a) => (
                    <Link
                      key={a.id}
                      href={`/profesor/materia/${a.materiaId}/${a.anio}/${a.seccion}`}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:scale-105 hover:shadow-sm"
                    >
                      {a.anio} &quot;{a.seccion}&quot;
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
