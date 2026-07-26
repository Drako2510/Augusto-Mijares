import { notFound } from "next/navigation";
import { getAnioById, getMateriaById, secciones } from "@/data/seed";
import SeccionSelector from "@/components/SeccionSelector";
import Breadcrumb from "@/components/Breadcrumb";

export default function SeccionPage({
  params,
}: {
  params: { id: string; anio: string };
}) {
  const materia = getMateriaById(params.id);
  const anio = getAnioById(params.anio);

  if (!materia || !anio) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: materia.nombre, href: `/materia/${materia.id}` },
          { label: anio.nombre },
        ]}
      />

      <header className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">
          {materia.nombre} · {anio.nombre} año
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Selecciona la sección para abrir el panel de asistencia.
        </p>
      </header>

      <SeccionSelector secciones={secciones} materiaId={materia.id} anioId={anio.id} />
    </main>
  );
}
