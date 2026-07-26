/**
 * Script de migración única: Lee datos de LocalStorage (navegador)
 * y los persiste en SQLite vía Prisma.
 *
 * Uso: npx tsx scripts/migrar-localstorage.ts
 *
 * IMPORTANTE: Ejecutar UNA SOLA VEZ al hacer deploy.
 * Este script asume que localStorage ya tiene datos en el formato
 * que usa actualmente la app.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Claves esperadas en localStorage (según useAsistencia, useEvaluaciones, etc.) ───
// Formato: <materiaId>_<anioId>_<seccionId>

const MATERIAS = ["matematicas", "lengua", "ciencias", "historia", "ingles"];
const SECCIONES = ["A", "B", "C", "D"];
const ANIOS = ["1ro", "2do", "3ro", "4to", "5to"];

function buildKey(prefix: string, materia: string, anio: string, seccion: string): string {
  return `${prefix}_${materia}_${anio}_${seccion}`;
}

/**
 * Intenta leer datos desde un archivo JSON exportado del localStorage.
 * El archivo debe estar en `scripts/localstorage-export.json` y tener el formato:
 *   { "clave": [{...}, {...}], "otra_clave": [...] }
 *
 * Para exportar desde el navegador:
 *   1. Abrir DevTools (F12)
 *   2. Ejecutar en consola: copy(JSON.stringify({...localStorage}))
 *   3. Pegar en scripts/localstorage-export.json
 */
async function cargarDatosExportados(): Promise<Record<string, string>> {
  const fs = await import("fs");
  const path = await import("path");
  const archivo = path.join(__dirname, "localstorage-export.json");

  if (!fs.existsSync(archivo)) {
    console.log("ℹ️  No se encontró scripts/localstorage-export.json — se omite la migración.");
    return {};
  }

  const raw = fs.readFileSync(archivo, "utf-8");
  return JSON.parse(raw);
}

async function migrarAsistencias(datos: Record<string, string>) {
  console.log("📋 Migrando asistencias...");
  let count = 0;

  for (const materia of MATERIAS) {
    for (const anio of ANIOS) {
      for (const seccion of SECCIONES) {
        const key = buildKey("asistencias", materia, anio, seccion);
        const raw = datos[key];
        if (!raw) continue;

        try {
          const registros = JSON.parse(raw);
          if (!Array.isArray(registros)) continue;

          for (const reg of registros) {
            // Buscar el estudiante por nombre
            const estudiante = await prisma.estudiante.findFirst({
              where: { nombre: reg.nombre ?? reg.estudiante, anio, seccion },
            });
            if (!estudiante) continue;

            const fecha = new Date(reg.fecha ?? Date.now());
            // Evitar duplicados (upsert con clave compuesta)
            await prisma.asistencia.upsert({
              where: { estudianteId_materiaId_fecha: { estudianteId: estudiante.id, materiaId: materia, fecha } },
              update: { estado: reg.estado ?? "presente", observacion: reg.observacion },
              create: {
                estudianteId: estudiante.id,
                materiaId: materia,
                fecha,
                estado: reg.estado ?? "presente",
                observacion: reg.observacion,
              },
            });
            count++;
          }
        } catch (e) {
          console.warn(`  ⚠️  Error procesando ${key}:`, (e as Error).message);
        }
      }
    }
  }

  console.log(`  ✅ ${count} asistencias migradas`);
}

async function migrarEvaluaciones(datos: Record<string, string>) {
  console.log("📋 Migrando evaluaciones...");
  let count = 0;

  for (const materia of MATERIAS) {
    for (const anio of ANIOS) {
      for (const seccion of SECCIONES) {
        const key = buildKey("evaluaciones", materia, anio, seccion);
        const raw = datos[key];
        if (!raw) continue;

        try {
          const registros = JSON.parse(raw);
          if (!Array.isArray(registros)) continue;

          for (const reg of registros) {
            const estudiante = await prisma.estudiante.findFirst({
              where: { nombre: reg.nombre ?? reg.estudiante, anio, seccion },
            });
            if (!estudiante) continue;

            await prisma.evaluacion.create({
              data: {
                estudianteId: estudiante.id,
                materiaId: materia,
                tipo: reg.tipo ?? "examen",
                titulo: reg.titulo ?? "Sin título",
                calificacion: reg.calificacion ?? 0,
                fecha: new Date(reg.fecha ?? Date.now()),
              },
            });
            count++;
          }
        } catch (e) {
          console.warn(`  ⚠️  Error procesando ${key}:`, (e as Error).message);
        }
      }
    }
  }

  console.log(`  ✅ ${count} evaluaciones migradas`);
}

async function main() {
  console.log("🔄 Iniciando migración localStorage → SQLite\n");

  const datos = await cargarDatosExportados();
  if (Object.keys(datos).length === 0) {
    console.log(
      "Para migrar datos:\n" +
        "  1. Abre la app en el navegador\n" +
        "  2. En DevTools (F12), ejecuta: copy(JSON.stringify({...localStorage}))\n" +
        "  3. Pega el resultado en scripts/localstorage-export.json\n" +
        "  4. Vuelve a ejecutar: npx tsx scripts/migrar-localstorage.ts"
    );
    return;
  }

  await migrarAsistencias(datos);
  await migrarEvaluaciones(datos);

  console.log("\n🎉 Migración completada.");
}

main()
  .catch((e) => {
    console.error("❌ Error en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
