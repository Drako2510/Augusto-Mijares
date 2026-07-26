"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

// ─── Tipos ───────────────────────────────────────────────────
interface AnioOption {
  id: string;
  nombre: string;
}

interface SeccionOption {
  id: string;
  nombre: string;
}

interface Props {
  anios: AnioOption[];
  secciones: SeccionOption[];
  onClose: () => void;
  onGuardado: () => void;
}

interface HorarioCell {
  value: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
}

interface HorarioData {
  headers: HorarioCell[];
  rows: HorarioCell[][];
  merges?: { r: number; c: number; colSpan: number; rowSpan: number }[];
}

// ─── Componente ──────────────────────────────────────────────
export function HorarioModal({ anios, secciones, onClose, onGuardado }: Props) {
  const [anio, setAnio] = useState("");
  const [seccion, setSeccion] = useState("");
  const [archivoNombre, setArchivoNombre] = useState("");
  const [horarioData, setHorarioData] = useState<HorarioData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Descargar formato base Excel
  const descargarFormato = () => {
    const headers = ["Hora", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const rows = [
      ["7:00 - 7:45", "", "", "", "", ""],
      ["7:45 - 8:30", "", "", "", "", ""],
      ["8:30 - 9:15", "", "", "", "", ""],
      ["9:15 - 10:00", "", "", "", "", ""],
      ["10:00 - 10:30", "RECREO", "RECREO", "RECREO", "RECREO", "RECREO"],
      ["10:30 - 11:15", "", "", "", "", ""],
      ["11:15 - 12:00", "", "", "", "", ""],
      ["12:00 - 12:45", "", "", "", "", ""],
      ["12:45 - 1:30", "", "", "", "", ""],
      ["1:30 - 2:15", "", "", "", "", ""],
      ["2:15 - 3:00", "", "", "", "", ""],
    ];

    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet["!cols"] = headers.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Horario");

    XLSX.writeFile(workbook, "formato_horario_base.xlsx");
  };

  // Parsear archivo Excel/CSV
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoNombre(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellStyles: true });

        // Tomar la primera hoja
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Determinar rango de la hoja
        const ref = sheet["!ref"];
        if (!ref) {
          setError("El archivo está vacío o no tiene datos");
          return;
        }
        const range = XLSX.utils.decode_range(ref);

        // Leer cada celda individualmente para preservar valores y estilos
        const allRows: HorarioCell[][] = [];

        // Obtener estilos compartidos del libro si existen
        const sharedStyles = (workbook as any).Styles;

        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: HorarioCell[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = sheet[addr];

            let value = "";
            let align: "left" | "center" | "right" | undefined;
            let bold: boolean | undefined;

            if (cell) {
              // Obtener valor
              value = String(cell.w ?? cell.v ?? "").trim();

              // Intentar resolver el estilo de la celda
              let style: any = cell.s;

              // Si s es un número, buscar en los estilos compartidos
              if (typeof style === "number" && sharedStyles?.CellXf?.[style]) {
                const xf = sharedStyles.CellXf[style];
                if (xf.alignment) {
                  style = { alignment: xf.alignment };
                  if (xf.fontId != null && sharedStyles.Fonts?.[xf.fontId]) {
                    style.font = sharedStyles.Fonts[xf.fontId];
                  }
                } else if (xf.fontId != null) {
                  style = {
                    font: sharedStyles.Fonts?.[xf.fontId],
                  };
                }
              }

              // Leer alineación
              if (style?.alignment?.horizontal) {
                const h = style.alignment.horizontal;
                if (h === "center") align = "center";
                else if (h === "right") align = "right";
                else if (h === "left") align = "left";
              }

              // Leer negrita
              if (style?.font?.bold) {
                bold = true;
              }
            }

            // Si no tiene alineación pero tiene contenido, centrar por defecto
            if (!align && value) {
              // Primera columna (hora) o headers: centrado
              // Celdas de contenido: centrado
              align = "center";
            }

            row.push({ value, align, bold });
          }
          allRows.push(row);
        }

        if (allRows.length < 2) {
          setError(
            "El archivo debe tener al menos 2 filas (encabezados + datos)"
          );
          setHorarioData(null);
          return;
        }

        // Primera fila = headers
        const headers = allRows[0];
        const rows = allRows.slice(1);

        // Extraer celdas combinadas (merged cells)
        const rawMerges = sheet["!merges"] || [];
        const merges = rawMerges
          .map((m: XLSX.Range) => ({
            r: m.s.r - 1, // -1 porque headers es fila 0 de datos (sheet row 0)
            c: m.s.c,
            colSpan: m.e.c - m.s.c + 1,
            rowSpan: m.e.r - m.s.r + 1,
          }))
          .filter((m: { r: number }) => m.r >= 0); // solo filas de datos

        setHorarioData({ headers, rows, merges });
        toast.success(`Horario detectado: ${rows.length} filas × ${headers.length} columnas`);
      } catch {
        setError(
          "No se pudo leer el archivo. Asegúrate de que sea un Excel (.xlsx) o CSV válido."
        );
        setHorarioData(null);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Guardar horario
  const handleGuardar = async () => {
    if (!anio || !seccion) {
      setError("Selecciona año y sección");
      return;
    }
    if (!horarioData) {
      setError("Sube un archivo de horario primero");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio,
          seccion,
          data: horarioData,
          archivoNombre,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(
          `Horario guardado: ${anio} "${seccion}" — ${archivoNombre}`
        );
        onGuardado();
        onClose();
      } else {
        setError(json.error ?? "Error al guardar");
      }
    } catch {
      setError("Error de conexión al guardar el horario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-xl">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Agregar Horario
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sube un archivo Excel con el horario de clases
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

        <div className="p-6 space-y-4">
          {error && (
            <div className="error-message text-sm">
              <span>❌</span> {error}
            </div>
          )}

          {/* Selectores Año + Sección */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                📅 Año
              </label>
              <select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar año...</option>
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                🏫 Sección
              </label>
              <select
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar sección...</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    &quot;{s.nombre}&quot;
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subir archivo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                📂 Archivo de Horario (Excel o CSV)
              </label>
              <button
                type="button"
                onClick={descargarFormato}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
              >
                📥 Descargar formato base
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:rounded-full file:border-0 file:bg-purple-100 dark:file:bg-purple-900/40 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-200 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              El archivo debe tener la primera fila como encabezados (ej: Hora,
              Lunes, Martes, ...) y las siguientes filas con los datos.
            </p>
          </div>

          {/* Vista previa */}
          {horarioData && (
            <div>
              <h4 className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                👁️ Vista previa del horario
              </h4>
              <div className="overflow-x-auto rounded-xl border-2 border-gray-300 dark:border-gray-600">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      {horarioData.headers.map((h, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-200 whitespace-nowrap border border-gray-300 dark:border-gray-600"
                          style={{ textAlign: h.align || "left" }}
                        >
                          {h.value}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horarioData.rows.map((row, ri) => {
                      const mergeStarts = (horarioData.merges || []).filter(
                        (m) => m.r === ri
                      );
                      const coveredCells = new Set<number>();
                      (horarioData.merges || []).forEach((m) => {
                        if (ri > m.r && ri < m.r + m.rowSpan) {
                          for (let c = m.c; c < m.c + m.colSpan; c++) {
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

                            const textAlign = (cell.align || "center") as
                              | "left"
                              | "center"
                              | "right";

                            return (
                              <td
                                key={ci}
                                colSpan={merge?.colSpan || 1}
                                rowSpan={merge?.rowSpan || 1}
                                className={`px-3 py-1.5 whitespace-nowrap border border-gray-300 dark:border-gray-600 ${
                                  merge || cell.bold
                                    ? "font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                    : cell.value
                                    ? "text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                      : "text-gray-300 dark:text-gray-600"
                                }`}
                                style={{ textAlign }}
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading || !horarioData}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all ${
              loading || !horarioData
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Guardando..." : "💾 Guardar Horario"}
          </button>
        </div>
      </div>
    </div>
  );
}
