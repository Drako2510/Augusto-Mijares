import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── 1. Usuarios ──────────────────────────────────────────
  const hash = await bcrypt.hash("password123", 10);

  const usuarios = await Promise.all([
    // Profesores
    prisma.usuario.upsert({
      where: { email: "prof.matematicas@escuela.edu" },
      update: {},
      create: { email: "prof.matematicas@escuela.edu", password: hash, nombre: "Prof. Matemáticas", rol: "profesor" },
    }),
    prisma.usuario.upsert({
      where: { email: "prof.lengua@escuela.edu" },
      update: {},
      create: { email: "prof.lengua@escuela.edu", password: hash, nombre: "Prof. Lengua", rol: "profesor" },
    }),
    prisma.usuario.upsert({
      where: { email: "prof.ciencias@escuela.edu" },
      update: {},
      create: { email: "prof.ciencias@escuela.edu", password: hash, nombre: "Prof. Ciencias", rol: "profesor" },
    }),
    // Representante
    prisma.usuario.upsert({
      where: { email: "representante@escuela.edu" },
      update: {},
      create: { email: "representante@escuela.edu", password: hash, nombre: "María García", rol: "representante" },
    }),
    // Directivo
    prisma.usuario.upsert({
      where: { email: "directivo@escuela.edu" },
      update: {},
      create: { email: "directivo@escuela.edu", password: hash, nombre: "Dr. Roberto Castillo", rol: "directivo" },
    }),
  ]);

  const [profMatematicas, profLengua, profCiencias, representante, directivo] = usuarios;
  console.log(`  ✅ ${usuarios.length} usuarios creados`);

  // ─── 2. Materias ──────────────────────────────────────────
  const materiasData = [
    { id: "matematicas", nombre: "Matemáticas", icono: "➗" },
    { id: "lengua", nombre: "Lengua Española", icono: "📖" },
    { id: "ciencias", nombre: "Ciencias Naturales", icono: "🔬" },
    { id: "historia", nombre: "Historia", icono: "🏛️" },
    { id: "ingles", nombre: "Inglés", icono: "🌎" },
  ];

  const materias = await Promise.all(
    materiasData.map((m) =>
      prisma.materia.upsert({ where: { id: m.id }, update: {}, create: m })
    )
  );
  console.log(`  ✅ ${materias.length} materias creadas`);

  // ─── 3. ProfesorMateria (asignaciones con clave secreta) ──
  const asignaciones = [
    { usuarioId: profMatematicas.id, materiaId: "matematicas", anio: "3ro", seccion: "A", clave: "MAT3A2025" },
    { usuarioId: profLengua.id, materiaId: "lengua", anio: "3ro", seccion: "B", clave: "LEN3B2025" },
    { usuarioId: profCiencias.id, materiaId: "ciencias", anio: "2do", seccion: "A", clave: "CIE2A2025" },
  ];

  for (const a of asignaciones) {
    await prisma.profesorMateria.upsert({
      where: { usuarioId_materiaId_anio_seccion: { usuarioId: a.usuarioId, materiaId: a.materiaId, anio: a.anio, seccion: a.seccion } },
      update: {},
      create: { usuarioId: a.usuarioId, materiaId: a.materiaId, anio: a.anio, seccion: a.seccion, claveSecreta: a.clave },
    });
  }
  console.log(`  ✅ ${asignaciones.length} asignaciones profesor-materia`);

  // ─── 4. Estudiantes ───────────────────────────────────────
  const nombresPorSeccion: Record<string, string[]> = {
    A: ["Ana Pérez", "Luis Gómez", "Carla Ruiz", "Pedro Díaz", "Sofía Méndez", "Juan Castro", "María López", "Carlos Sánchez", "Laura Torres", "David Ríos"],
    B: ["Andrea Flores", "José Ramírez", "Valentina Ortiz", "Diego Morales", "Camila Vargas", "Miguel Herrera", "Isabella Cruz", "Fernando Silva", "Gabriela Rojas", "Ricardo Peña"],
    C: ["Paola Jiménez", "Eduardo Navarro", "Daniela Guerrero", "Sebastián Aguilar", "Natalia Campos", "Alejandro Vega", "Mariana Reyes", "Gustavo Delgado", "Fernanda Soto", "Rodrigo Paredes"],
    D: ["Lucía Fernández", "Tomás Molina", "Emilia Contreras", "Nicolás Bravo", "Renata Espinoza", "Adrián Cordero", "Ximena Salazar", "Bruno Cabrera", "Antonella Marín", "Ignacio Fuentes"],
  };

  const anios = ["2do", "3ro"];
  const secciones = ["A", "B", "C", "D"];
  let totalEstudiantes = 0;

  for (const anio of anios) {
    for (const seccion of secciones) {
      const nombres = nombresPorSeccion[seccion];
      for (const nombre of nombres) {
        // Clave única compuesta: usamos nombre+anio+seccion para idempotencia
        const clave = `${nombre}-${anio}-${seccion}`;
        // Como Estudiante usa @id @default(cuid()), no tenemos campo único.
        // Usamos upsert con where sobre id único generado. Para idempotencia,
        // usamos createMany con skipDuplicates o chequeamos existencia.
        const existe = await prisma.estudiante.findFirst({
          where: { nombre, anio, seccion },
        });
        if (!existe) {
          await prisma.estudiante.create({ data: { nombre, anio, seccion } });
          totalEstudiantes++;
        }
      }
    }
  }
  console.log(`  ✅ ${totalEstudiantes} estudiantes creados (${anios.length} años × ${secciones.length} secciones × 10)`);

  // ─── 5. RepresentanteHijo ─────────────────────────────────
  // Asignamos "Ana Pérez" de 3ro A como hija del representante
  const hija = await prisma.estudiante.findFirst({
    where: { nombre: "Ana Pérez", anio: "3ro", seccion: "A" },
  });

  if (hija) {
    await prisma.representanteHijo.upsert({
      where: { representanteId_estudianteId: { representanteId: representante.id, estudianteId: hija.id } },
      update: {},
      create: { representanteId: representante.id, estudianteId: hija.id },
    });
    console.log(`  ✅ Relación representante → hija: ${hija.nombre}`);
  }

  console.log("\n🎉 Seed completado con éxito.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
