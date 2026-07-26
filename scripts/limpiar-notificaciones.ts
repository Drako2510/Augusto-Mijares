/**
 * Script de limpieza de notificaciones antiguas.
 *
 * Elimina notificaciones leídas con más de 3 meses de antigüedad.
 *
 * Uso:
 *   npx tsx scripts/limpiar-notificaciones.ts
 *
 * O programar con cron (Linux/Mac) o Task Scheduler (Windows):
 *   0 3 * * 0  npx tsx scripts/limpiar-notificaciones.ts  (cada domingo a las 3am)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function limpiarNotificacionesAntiguas() {
  const fechaLimite = new Date();
  fechaLimite.setMonth(fechaLimite.getMonth() - 3); // 3 meses

  console.log(`🔍 Buscando notificaciones anteriores a ${fechaLimite.toISOString()}...`);

  const eliminadas = await prisma.notificacion.deleteMany({
    where: {
      leida: true,
      fecha: { lt: fechaLimite },
    },
  });

  console.log(`🗑️  Eliminadas ${eliminadas.count} notificaciones antiguas.`);

  // También limpiar notificaciones no leídas muy antiguas (>6 meses)
  const fechaLimiteNoLeidas = new Date();
  fechaLimiteNoLeidas.setMonth(fechaLimiteNoLeidas.getMonth() - 6);

  const eliminadasViejas = await prisma.notificacion.deleteMany({
    where: {
      leida: false,
      fecha: { lt: fechaLimiteNoLeidas },
    },
  });

  if (eliminadasViejas.count > 0) {
    console.log(`⚠️  Eliminadas ${eliminadasViejas.count} notificaciones no leídas (>6 meses).`);
  }

  console.log("✅ Limpieza completada.");
}

limpiarNotificacionesAntiguas()
  .catch((e) => {
    console.error("❌ Error en limpieza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
