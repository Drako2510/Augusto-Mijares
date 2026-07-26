"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface Props {
  onClose: () => void;
}

export function RegistroPorLista({ onClose }: Props) {
  const router = useRouter();
  const [archivoNombre, setArchivoNombre] = useState("");
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const descargarFormato = () => {
    const headers = ["Nombre Completo", "Año", "Sección", "Nombre Rep.", "Apellido Rep.", "Cédula Rep.", "Teléfono Rep."];
    const rows = [
      ["Ana Pérez", "1ro", "A", "María", "Pérez", "12345678", "0412-5550001"],
      ["Carlos Gómez", "1ro", "A", "Juan", "Gómez", "87654321", "0414-5550002"],
      ["María Rodríguez", "2do", "B", "Laura", "Rodríguez", "11223344", "0424-5550003"],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
    ];
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet["!cols"] = [{ wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Estudiantes");
    XLSX.writeFile(wb, "formato_registro_estudiantes.xlsx");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoNombre(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (json.length < 2) {
          setError("El archivo debe tener al menos 2 filas (encabezados + datos)");
          return;
        }

        const headers = json[0].map((h) => String(h).trim());
        const rows = json.slice(1).filter((row) =>
          row.some((cell) => String(cell).trim() !== "")
        ).map((row) => row.map((cell) => String(cell).trim()));

        if (rows.length === 0) {
          setError("No se encontraron estudiantes en el archivo");
          return;
        }

        setPreview({ headers, rows });
        toast.success(`${rows.length} estudiantes detectados`);
      } catch {
        setError("No se pudo leer el archivo. Usa formato Excel (.xlsx) o CSV.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRegistrar = async () => {
    if (!preview || preview.rows.length === 0) return;
    setLoading(true);
    setError("");

    try {
      // Mapear columnas: Nombre Completo | Año | Sección | Nombre Rep. | Apellido Rep. | Cédula Rep. | Teléfono Rep.
      const h = preview.headers.map((s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
      const idxNombre = h.findIndex((s: string) => s.includes("nombre") && !s.includes("rep"));
      const idxAnio = h.findIndex((s: string) => s.includes("ano") || s.includes("año"));
      const idxSeccion = h.findIndex((s: string) => s.includes("seccion"));
      const idxRepNombre = h.findIndex((s: string) => s.includes("nombre") && s.includes("rep"));
      const idxRepApellido = h.findIndex((s: string) => s.includes("apellido"));
      const idxCedula = h.findIndex((s: string) => s.includes("cedula"));
      const idxTelefono = h.findIndex((s: string) => s.includes("telefono") || s.includes("telf"));

      if (idxNombre === -1 || idxAnio === -1 || idxSeccion === -1) {
        setError("El archivo debe tener columnas: Nombre Completo, Año, Sección");
        setLoading(false);
        return;
      }

      const estudiantes = preview.rows.map((row) => ({
        nombre: row[idxNombre]?.trim() || "",
        anio: row[idxAnio]?.trim() || "",
        seccion: row[idxSeccion]?.trim() || "",
        repNombre: idxRepNombre >= 0 ? row[idxRepNombre]?.trim() || undefined : undefined,
        repApellido: idxRepApellido >= 0 ? row[idxRepApellido]?.trim() || undefined : undefined,
        cedulaRep: idxCedula >= 0 ? row[idxCedula]?.trim() || undefined : undefined,
        telefonoRep: idxTelefono >= 0 ? row[idxTelefono]?.trim() || undefined : undefined,
      })).filter((e) => e.nombre && e.anio && e.seccion);

      if (estudiantes.length === 0) {
        setError("No se encontraron estudiantes con datos válidos");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/directivo/registro-estudiante-lista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estudiantes }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${data.registrados} estudiantes registrados correctamente ✅`);
        router.push("/directivo");
      } else {
        setError(data.error ?? "Error al registrar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-xl">📋</div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Registro por Lista</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sube un archivo Excel con los datos de los estudiantes</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">✕</button>
        </div>

        <div className="p-6 space-y-4">
        {error && <div className="error-message text-sm"><span>❌</span> {error}</div>}

        {/* Descargar formato */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">📥 Formato base</span>
          <button onClick={descargarFormato}
            className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-800 transition-colors">
            📥 Descargar formato base
          </button>
        </div>

        {/* Subir archivo */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">📂 Archivo Excel</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:rounded-full file:border-0 file:bg-green-100 dark:file:bg-green-900/40 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-green-700 dark:file:text-green-300 hover:file:bg-green-200 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Columnas esperadas: <strong>Nombre Completo, Año, Sección, Nombre Rep., Apellido Rep., Cédula Rep., Teléfono Rep.</strong>
            {archivoNombre && <span className="ml-2 text-green-600">✅ {archivoNombre}</span>}
          </p>
        </div>

        {/* Vista previa */}
        {preview && (
          <div>
            <h4 className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-200">👁️ Vista previa ({preview.rows.length} estudiantes)</h4>
            <div className="max-h-[250px] overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {preview.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleRegistrar}
          disabled={loading || !preview || preview.rows.length === 0}
          className="btn-primary w-full"
        >
          {loading ? "Registrando..." : `📋 Registrar ${preview?.rows.length || 0} Estudiantes`}
        </button>
        </div>
      </div>
    </div>
  );
}
