import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMateriaById, anios, secciones } from "@/data/seed";
import { NuevaAsignacionCliente } from "./NuevaAsignacionCliente";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function NuevaAsignacionPage({ params }: Props) {
  const session = await getSession();

  if (!session)
    redirect(`/login?redirect=/directivo/profesor/${params.id}/nueva-asignacion`);
  if (session.rol !== "directivo") redirect("/unauthorized");

  // Verificar que el profesor existe
  const profesor = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: { id: true, nombre: true, rol: true },
  });

  if (!profesor || profesor.rol !== "profesor") notFound();

  // Obtener materias disponibles desde seed data
  const materias = [
    { id: "matematicas", nombre: "Matemáticas", icono: "➗" },
    { id: "lengua", nombre: "Lengua", icono: "📖" },
    { id: "ciencias", nombre: "Ciencias", icono: "🔬" },
    { id: "historia", nombre: "Historia", icono: "📜" },
    { id: "ingles", nombre: "Inglés", icono: "🇬🇧" },
  ];

  return (
    <NuevaAsignacionCliente
      profesorId={profesor.id}
      profesorNombre={profesor.nombre}
      materias={materias}
      anios={anios}
      secciones={secciones}
    />
  );
}
