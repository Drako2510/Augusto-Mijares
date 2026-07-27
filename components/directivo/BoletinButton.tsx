"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import JSZip from "jszip";

interface EstudianteOption {
  id: string;
  nombre: string;
}

interface Props {
  anio: string;
  seccion: string;
  esFinal?: boolean;
}

export function BoletinButton({ anio, seccion, esFinal }: Props) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estudiantes, setEstudiantes] = useState<EstudianteOption[]>([]);
  const [modo, setModo] = useState<"inicio" | "individual" | "todos">("inicio");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mostrarModal) {
      fetch(`/api/directivo/estudiantes-por-seccion?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}`)
        .then((r) => r.json())
        .then((d) => setEstudiantes(d.estudiantes ?? []))
        .catch(() => {});
    }
  }, [mostrarModal, anio, seccion]);

  const generarHTML = (est: { nombre: string; anio: string; seccion: string; asistencia: number; totalDias: number; promedio: number; materias: { materia: string; promedio: number; notas: number[] }[]; tareas: number }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Boletín - ${est.nombre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 30px; color: #1f2937; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; color: #2563eb; }
    .header p { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .info { margin-bottom: 20px; }
    .info p { font-size: 13px; margin-bottom: 2px; }
    .info strong { display: inline-block; width: 100px; }
    .kpi { display: flex; gap: 15px; margin-bottom: 20px; }
    .kpi div { flex: 1; text-align: center; padding: 10px; border-radius: 8px; background: #f3f4f6; }
    .kpi div span { display: block; font-size: 22px; font-weight: bold; color: #2563eb; }
    .kpi div small { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border: 1px solid #d1d5db; }
    td { padding: 8px 10px; font-size: 13px; border: 1px solid #d1d5db; }
    td.center { text-align: center; }
    .notas { display: flex; gap: 4px; flex-wrap: wrap; }
    .notas span { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .firma { margin-top: 40px; display: flex; justify-content: space-between; }
    .firma div { text-align: center; }
    .firma div p { border-top: 1px solid #000; padding-top: 4px; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Boletín Académico</h1>
    <p>Asistencia Plus — Reporte de Calificaciones</p>
  </div>
  <div class="info">
    <p><strong>Estudiante:</strong> ${est.nombre}</p>
    <p><strong>Curso:</strong> ${est.anio} "${est.seccion}"</p>
    <p><strong>Promedio General:</strong> ${est.promedio}/10</p>
  </div>
  <div class="kpi">
    <div><span>${est.asistencia}%</span><small>Asistencia</small></div>
    <div><span>${est.promedio}</span><small>Promedio</small></div>
    <div><span>${est.tareas}</span><small>Tareas Pend.</small></div>
    <div><span>${est.materias.length}</span><small>Materias</small></div>
  </div>
  <table>
    <thead><tr><th>Materia</th><th class="center">Notas</th><th class="center">Promedio</th></tr></thead>
    <tbody>
      ${est.materias.map((m) => `
        <tr>
          <td>${m.materia}</td>
          <td class="center"><div class="notas">${m.notas.map((n) => `<span>${n}</span>`).join("")}</div></td>
          <td class="center"><strong>${m.promedio}</strong></td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  <div class="firma">
    <div><p>Director</p></div>
    <div><p>Profesor</p></div>
    <div><p>Representante</p></div>
  </div>
</body>
</html>`;

  const descargarIndividual = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes/boletin?estudianteId=${selectedId}`);
      const data = await res.json();
      if (data.estudiante) {
        const html = generarHTML(data.estudiante);
        const w = window.open("", "_blank");
        w?.document.write(html);
        w?.document.close();
        setTimeout(() => w?.print(), 500);
      }
    } catch {
      toast.error("Error al generar el boletín");
    } finally {
      setLoading(false);
      setMostrarModal(false);
    }
  };

  const descargarTodos = async () => {
    setLoading(true);
    try {
      const zip = new JSZip();
      const anioActual = new Date().getFullYear();

      if (esFinal) {
        // Notas Certificadas: procesar TODAS las secciones de 5to
        const secciones = ["A", "B", "C", "D"];
        const carpetaRaiz = `Notas Certificadas 5to ${anioActual}`;
        let totalEstudiantes = 0;

        for (const sec of secciones) {
          const res = await fetch(`/api/reportes/boletin-seccion?anio=5to&seccion=${sec}`);
          const data = await res.json();
          const estudiantes = data.estudiantes || [];
          if (estudiantes.length === 0) continue;

          totalEstudiantes += estudiantes.length;
          const carpetaSeccion = `${carpetaRaiz}/5to "${sec}"`;

          // Lista de estudiantes de la sección (HTML)
          const listaHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lista de estudiantes "${sec}"</title>
            <style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#2563eb}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #d1d5db;padding:8px;text-align:left;font-size:13px}th{background:#f3f4f6}</style></head><body>
            <h1>📋 Lista de Estudiantes - 5to "${sec}"</h1><p>Año: ${anioActual} | Total: ${estudiantes.length} estudiantes</p>
            <table><thead><tr><th>#</th><th>Nombre</th><th>Promedio</th><th>Asistencia</th></tr></thead><tbody>
            ${estudiantes.map((e: any, i: number) => `<tr><td>${i + 1}</td><td>${e.nombre}</td><td>${e.promedio}/20</td><td>${e.asistencia}%</td></tr>`).join("")}
            </tbody></table></body></html>`;
          zip.file(`${carpetaSeccion}/Lista de estudiantes "${sec}".html`, listaHTML);

          // Boletines individuales por estudiante
          estudiantes.forEach((est: any) => {
            const nombreArchivo = `${est.nombre.replace(/\s+/g, "_")}.html`;
            const html = generarHTML(est);
            zip.file(`${carpetaSeccion}/${nombreArchivo}`, html);
          });
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${carpetaRaiz}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${totalEstudiantes} notas certificadas descargadas en ZIP`);
      } else {
        // Boletín normal: solo la sección actual
        const res = await fetch(`/api/reportes/boletin-seccion?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}`);
        const data = await res.json();
        if (data.estudiantes?.length > 0) {
          const carpeta = `Boletines ${anio} "${seccion}" ${anioActual}`;

          data.estudiantes.forEach((est: any) => {
            const nombreArchivo = `${est.nombre.replace(/\s+/g, "_")}.html`;
            const html = generarHTML(est);
            zip.file(`${carpeta}/${nombreArchivo}`, html);
          });

          const blob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${carpeta}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success(`${data.estudiantes.length} boletines descargados en ZIP`);
        }
      }
    } catch {
      toast.error("Error al generar los boletines");
    } finally {
      setLoading(false);
      setMostrarModal(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setMostrarModal(true); setModo("inicio"); }}
        className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all"
      >
        {esFinal ? "📄 Notas Certificadas" : "📄 Descargar Boletín"}
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-xl">📄</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {modo === "inicio"
                      ? esFinal ? "Notas Certificadas" : "Descargar Boletín"
                      : modo === "individual"
                        ? `Notas Certificadas Individual`
                        : `Notas Certificadas de la Sección`}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {anio} &quot;{seccion}&quot;
                  </p>
                </div>
              </div>
              <button onClick={() => setMostrarModal(false)} className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {modo === "inicio" && (
                <>
                  <button
                    onClick={() => setModo("individual")}
                    className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <p className="font-bold text-blue-700 dark:text-blue-300">
                      {esFinal ? "👤 Notas Certificadas Individual" : "👤 Boletín Individual"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {esFinal ? "Descargar notas certificadas de un solo estudiante" : "Descargar el boletín de un solo estudiante"}
                    </p>
                  </button>
                  <button
                    onClick={() => setModo("todos")}
                    className="w-full rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <p className="font-bold text-green-700 dark:text-green-300">
                      {esFinal ? "👥 Notas Certificadas de la Sección" : "👥 Toda la Sección"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {esFinal ? "Descargar notas certificadas de todos los estudiantes" : "Descargar boletines de todos los estudiantes"} ({estudiantes.length})
                    </p>
                  </button>
                </>
              )}

              {modo === "individual" && (
                <>
                  <button onClick={() => setModo("inicio")} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">⬅️ Volver</button>
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500"
                  >
                    <option value="">Seleccionar estudiante...</option>
                    {estudiantes.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                  <button
                    onClick={descargarIndividual}
                    disabled={!selectedId || loading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Generando..." : "📥 Descargar Boletín"}
                  </button>
                </>
              )}

              {modo === "todos" && (
                <>
                  <button onClick={() => setModo("inicio")} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">⬅️ Volver</button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Se generarán <strong>{estudiantes.length}</strong> {esFinal ? "notas certificadas" : "boletines"}, uno por cada estudiante de {anio} &quot;{seccion}&quot;.
                  </p>
                  <button
                    onClick={descargarTodos}
                    disabled={loading || estudiantes.length === 0}
                    className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Generando..." : `📥 Descargar ${estudiantes.length} Boletines`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
