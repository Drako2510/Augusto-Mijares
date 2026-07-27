"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AsignacionProfesor {
  materiaId: string;
  anio: string;
  seccion: string;
  materia: { nombre: string; icono: string };
}

interface Props {
  asignaciones: AsignacionProfesor[];
  onClose: () => void;
}

interface HorarioInfo {
  anio: string;
  seccion: string;
  data: {
    headers: ({ value: string; align?: string } | string)[];
    rows: ({ value: string; align?: string; bold?: boolean } | string)[][];
    merges?: { r: number; c: number; colSpan: number; rowSpan: number }[];
  };
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function coincideMateria(valorCelda: string, materia: string) {
  if (!valorCelda || !materia) return false;
  const v = normalizar(valorCelda);
  const m = normalizar(materia);
  return v.includes(m) || m.includes(v);
}

export function HorarioProfesorModal({
  asignaciones,
  onClose,
}: Props) {
  const [horarios, setHorarios] = useState<HorarioInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const tablaRef = useRef<HTMLDivElement>(null);

  const descargarJPG = async () => {
    if (!tablaRef.current || !horarioBase) return;
    const el = tablaRef.current;
    const origOverflow = el.style.overflow;
    const origMaxHeight = el.style.maxHeight;
    const origMaxWidth = el.style.maxWidth;
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.maxWidth = "none";
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true, logging: false });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Horario_Profesor_${asignaciones[0]?.anio || ""}_${asignaciones[0]?.seccion || ""}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.95);
    } catch { /* silencioso */ }
    el.style.overflow = origOverflow;
    el.style.maxHeight = origMaxHeight;
    el.style.maxWidth = origMaxWidth;
  };

  const fetchHorarios = useCallback(async () => {
    setLoading(true);
    try {
      const claveSet = new Set<string>();
      const pares: { anio: string; seccion: string }[] = [];
      for (const a of asignaciones) {
        const clave = `${a.anio}_${a.seccion}`;
        if (!claveSet.has(clave)) {
          claveSet.add(clave);
          pares.push({ anio: a.anio, seccion: a.seccion });
        }
      }
      const resultados: HorarioInfo[] = [];
      for (const par of pares) {
        try {
          const res = await fetch(
            `/api/horarios?anio=${encodeURIComponent(par.anio)}&seccion=${encodeURIComponent(par.seccion)}&_t=${Date.now()}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const json = await res.json();
            if (json.horarios?.[0]) {
              resultados.push({ anio: par.anio, seccion: par.seccion, data: json.horarios[0].data });
            }
          }
        } catch {}
      }
      setHorarios(resultados);
    } catch {}
    setLoading(false);
  }, [asignaciones]);

  useEffect(() => {
    fetchHorarios();
    // Polling cada 30s + evento instantáneo
    const interval = setInterval(fetchHorarios, 30000);
    const handler = () => fetchHorarios();
    window.addEventListener("dashboard:refresh", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("dashboard:refresh", handler);
    };
  }, [fetchHorarios]);

  // Construir horario combinado usando el primer horario como base estructural
  const horarioBase = horarios[0];
  const headers = horarioBase
    ? horarioBase.data.headers.map((h) =>
        typeof h === "string" ? { value: h, align: "center" as const } : h
      )
    : [];

  const rowsCombinadas = horarioBase
    ? horarioBase.data.rows.map((row, ri) => {
        return row.map((rawCell, ci) => {
          const baseCell =
            typeof rawCell === "string"
              ? { value: rawCell, align: "center" as const }
              : rawCell;
          const valorBase = baseCell.value.toUpperCase().trim();

          // Preservar RECREO, hora (columna 0)
          if (ci === 0 || valorBase === "RECREO" || valorBase === "RECESO") {
            return baseCell;
          }

          // Buscar en todos los horarios si hay una materia del profesor en esta celda
          let encontrado: string | null = null;

          for (const h of horarios) {
            if (ri >= h.data.rows.length) continue;
            const rowH = h.data.rows[ri];
            if (ci >= rowH.length) continue;

            const cellH =
              typeof rowH[ci] === "string"
                ? { value: rowH[ci] }
                : rowH[ci];
            const valorH = cellH.value.trim();

            if (!valorH) continue;

            const asignacion = asignaciones.find(
              (a) =>
                a.anio === h.anio &&
                a.seccion === h.seccion &&
                coincideMateria(valorH, a.materia.nombre)
            );

            if (asignacion) {
              encontrado = `${asignacion.materia.nombre.toUpperCase()}\n${asignacion.anio} "${asignacion.seccion}"`;
              break;
            }
          }

          return {
            ...baseCell,
            value: encontrado || "",
            bold: !!encontrado,
          };
        });
      })
    : [];

  const merges = horarioBase?.data.merges || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-xl">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Mi Horario
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {asignaciones.length} clase{asignaciones.length > 1 ? "s" : ""} —{" "}
                {asignaciones.map((a) => a.materia.icono).join(" ")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : horarios.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">📭</span>
              <p className="mt-3 text-gray-500 dark:text-gray-400 font-medium">
                No hay horarios asignados para tus secciones
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                El directivo aún no ha subido los horarios correspondientes.
              </p>
            </div>
          ) : (
            <div ref={tablaRef} className="overflow-x-auto rounded-xl border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 p-2">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {headers.map((hdr, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap border border-gray-300 dark:border-gray-600"
                        style={{
                          textAlign: (hdr.align || "center") as
                            | "left"
                            | "center"
                            | "right",
                        }}
                      >
                        {hdr.value}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsCombinadas.map((row, ri) => {
                    const mergeStarts = merges.filter(
                      (m) => m.r === ri
                    );
                    const coveredCells = new Set<number>();
                    merges.forEach((m) => {
                      if (ri > m.r && ri < m.r + m.rowSpan) {
                        for (
                          let c = m.c;
                          c < m.c + m.colSpan;
                          c++
                        ) {
                          coveredCells.add(c);
                        }
                      }
                    });

                    return (
                      <tr
                        key={ri}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {row.map((cell, ci) => {
                          if (coveredCells.has(ci)) return null;

                          const merge = mergeStarts.find(
                            (m) => m.c === ci
                          );
                          const textAlign = (cell.align ||
                            "center") as "left" | "center" | "right";
                          const hasContent = !!cell.value;

                          return (
                            <td
                              key={ci}
                              colSpan={merge?.colSpan || 1}
                              rowSpan={merge?.rowSpan || 1}
                              className={`px-2 py-1 whitespace-pre-line text-center ${
                                merge || cell.bold
                                  ? "font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                                  : hasContent
                                    ? "text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/30 border border-gray-300 dark:border-gray-600"
                                    : ""
                              }`}
                              style={{
                                textAlign,
                                fontSize: hasContent ? "0.65rem" : undefined,
                                lineHeight: hasContent ? "1.2" : undefined,
                              }}
                            >
                              {cell.value || ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cerrar</button>
          {horarioBase && (
            <button onClick={descargarJPG} className="btn-primary flex-1">📥 Descargar Horario</button>
          )}
        </div>
      </div>
    </div>
  );
}
