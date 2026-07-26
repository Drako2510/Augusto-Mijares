import { notFound } from "next/navigation";
import { anios, getMateriaById } from "@/data/seed";
import AnioSelector from "@/components/AnioSelector";
import Breadcrumb from "@/components/Breadcrumb";

export default function AnioPage({ params }: { params: { id: string } }) {
  const materia = getMateriaById(params.id);

  if (!materia) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: materia.nombre }]} />

      <header className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold text-gray-800 sm:text-3xl">
          <span className="text-4xl">{materia.icono}</span>
          {materia.nombre}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Selecciona el año escolar para continuar.
        </p>
      </header>

      <AnioSelector anios={anios} materiaId={materia.id} />
    </main>
  );
}
