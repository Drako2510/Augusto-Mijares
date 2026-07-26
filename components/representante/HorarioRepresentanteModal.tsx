"use client";

import { useState, useEffect } from "react";

interface Props {
  anio: string;
  seccion: string;
  onClose: () => void;
}

interface HorarioInfo {
  id: string;
  anio: string;
  seccion: string;
  data: {
    headers: ({ value: string; align?: string; bold?: boolean } | string)[];
    rows: ({ value: string; align?: string; bold?: boolean } | string)[][];
    merges?: { r: number; c: number; colSpan: number; rowSpan: number }[];
  };
  archivoNombre: string;
}

export function HorarioRepresentanteModal({
  anio,
  seccion,
  onClose,
}: Props) {
  const [horario, setHorario] = useState<HorarioInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const descargarJPG = async () => {
    if (!horario) return;

    const data = horario.data;
    const merges = data.merges || [];
    const cols = data.headers.length;
    const rows = data.rows.length;

    // Construir set de celdas cubiertas por merges
    const covered = new Set<string>();
    merges.forEach((m) => {
      for (let r = m.r; r < m.r + m.rowSpan; r++) {
        for (let c = m.c; c < m.c + m.colSpan; c++) {
          if (r !== m.r || c !== m.c) covered.add(`${r},${c}`);
        }
      }
    });

    // Dimensiones
    const colW = 150;
    const rowH = 44;
    const padX = 12;
    const padY = 8;
    const headerH = 42;
    const borderW = 3;
    const borderRadius = 14;
    const outerPad = 12;

    const totalW = cols * colW + borderW * 2 + outerPad * 2;
    const totalH = headerH + rows * rowH + borderW * 2 + outerPad * 2;

    const canvas = document.createElement("canvas");
    canvas.width = totalW * 2;
    canvas.height = totalH * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);

    // Fondo blanco con borde redondeado
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(0, 0, totalW, totalH, borderRadius);
    ctx.fill();

    // Borde exterior
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = borderW;
    ctx.beginPath();
    ctx.roundRect(
      borderW / 2,
      borderW / 2,
      totalW - borderW,
      totalH - borderW,
      borderRadius
    );
    ctx.stroke();

    const startX = outerPad + borderW;
    const startY = outerPad + borderW;

    // Función helper: dibujar celda
    const drawCell = (
      x: number,
      y: number,
      w: number,
      h: number,
      text: string,
      isHeader: boolean,
      isMerged: boolean,
      isEmpty: boolean
    ) => {
      // Fondo
      if (isHeader) {
        ctx.fillStyle = "#f9fafb";
      } else if (isMerged) {
        ctx.fillStyle = "#f3f4f6";
      } else if (isEmpty) {
        ctx.fillStyle = "#ffffff";
      } else {
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillRect(x, y, w, h);

      // Borde
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5);

      // Texto
      if (text) {
        ctx.fillStyle = "#1f2937";
        const fontSize = isMerged ? 11 : 10;
        const fontWeight = isHeader || isMerged ? "bold 11px" : `10px`;
        ctx.font = `${isHeader || isMerged ? "bold" : "normal"} ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const lines = text.split("\n");
        const lineH = fontSize + 2;
        const totalTextH = lines.length * lineH;
        const textStartY = y + h / 2 - totalTextH / 2 + lineH / 2;

        lines.forEach((line, li) => {
          ctx.fillText(line, x + w / 2, textStartY + li * lineH);
        });
      }
    };

    // Encabezados
    for (let c = 0; c < cols; c++) {
      const hdr = typeof data.headers[c] === "string" ? data.headers[c] : (data.headers[c] as any).value || "";
      drawCell(startX + c * colW, startY, colW, headerH, hdr, true, false, false);
    }

    // Filas de datos
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (covered.has(`${r},${c}`)) continue;

        const raw = data.rows[r]?.[c];
        const cell = typeof raw === "string" ? { value: raw } : (raw || { value: "" });
        const txt = cell.value || "";

        const merge = merges.find((m) => m.r === r && m.c === c);
        const cw = merge ? merge.colSpan * colW : colW;
        const rh = merge ? merge.rowSpan * rowH : rowH;
        const x = startX + c * colW;
        const y = startY + headerH + r * rowH;

        const isMerged = !!merge;
        const isEmpty = !txt;

        drawCell(x, y, cw, rh, txt, false, isMerged, isEmpty);
      }
    }

    // Descargar
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Horario_${anio}_${seccion}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.95);
  };

  useEffect(() => {
    const fetchHorario = async () => {
      try {
        const res = await fetch(
          `/api/horarios?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}&_t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          setHorario(json.horarios?.[0] ?? null);
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    fetchHorario();
  }, [anio, seccion]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-xl">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Horario de Clases
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {anio} &quot;{seccion}&quot;
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

        <div className="p-6 pb-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
            </div>
          ) : !horario ? (
            <div className="text-center py-12">
              <span className="text-4xl">📭</span>
              <p className="mt-3 text-gray-500 dark:text-gray-400 font-medium">
                No hay horario asignado para esta sección
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                El directivo aún no ha subido el horario para {anio} &quot;
                {seccion}&quot;
              </p>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-xl border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 p-2"
            >
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {horario.data.headers.map((header, i) => {
                      const hdr =
                        typeof header === "string"
                          ? { value: header }
                          : header;
                      return (
                        <th
                          key={i}
                          className="px-2 py-2 font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 text-xs"
                          style={{ textAlign: "center", verticalAlign: "middle" }}
                        >
                          <span className="whitespace-nowrap">{hdr.value}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {horario.data.rows.map((row, ri) => {
                    const merges = horario.data.merges || [];
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
                        {row.map((rawCell, ci) => {
                          if (coveredCells.has(ci))
                            return null;

                          const cell =
                            typeof rawCell === "string"
                              ? { value: rawCell }
                              : rawCell;
                          const merge = mergeStarts.find(
                            (m) => m.c === ci
                          );
                          const textAlign = (cell.align ||
                            "center") as "left" | "center" | "right";

                          return (
                            <td
                              key={ci}
                              colSpan={merge?.colSpan || 1}
                              rowSpan={merge?.rowSpan || 1}
                              className={`px-2 py-2 border border-gray-300 dark:border-gray-600 text-xs ${
                                merge || cell.bold
                                  ? "font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                  : cell.value
                                    ? "text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                    : "text-gray-300 dark:text-gray-600"
                              }`}
                              style={{ textAlign: "center", verticalAlign: "middle" }}
                            >
                              <span className="whitespace-nowrap">{cell.value || ""}</span>
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
          <button onClick={onClose} className="btn-secondary flex-1">
            Cerrar
          </button>
          {horario && (
            <button onClick={descargarJPG} className="btn-primary flex-1">
              📥 Descargar Horario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
