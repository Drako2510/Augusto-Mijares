import { notFound } from "next/navigation";
import {
  estudiantesPorSeccion,
  getAnioById,
  getMateriaById,
  getSeccionById,
} from "@/data/seed";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage({
  params,
}: {
  params: { id: string; anio: string; seccion: string };
}) {
  const materia = getMateriaById(params.id);
  const anio = getAnioById(params.anio);
  const seccion = getSeccionById(params.seccion);

  if (!materia || !anio || !seccion) {
    notFound();
  }

  const estudiantes = estudiantesPorSeccion[seccion.id] ?? [];

  return (
    <DashboardClient
      materia={materia}
      anio={anio}
      seccion={seccion}
      estudiantesIniciales={estudiantes}
    />
  );
}
