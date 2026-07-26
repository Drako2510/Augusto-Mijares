"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { SuccessBurst } from "@/components/ui/SuccessBurst";

interface Props {
  estudianteId: string;
  estudianteNombre: string;
  estudianteAnio: string;
  estudianteSeccion: string;
  onClose: () => void;
}

export function PagoMensualidadModal({ estudianteId, estudianteNombre, estudianteAnio, estudianteSeccion, onClose }: Props) {
  const [metodo, setMetodo] = useState<string>("inicio");
  const [showSuccess, setShowSuccess] = useState(false);
  const [refTransaccion, setRefTransaccion] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const getMetodos = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("metodosPago") || "[]");
      if (stored.length > 0) return stored;
    } catch {}
    // Default si no hay configurados
    return [
      { nombre: "Transferencia", datos: [
        { clave: "Banco", valor: "Banco Nacional" },
        { clave: "Titular", valor: "U.E. Asistencia Plus" },
        { clave: "Documento", valor: "J123456789" },
        { clave: "Cuenta", valor: "01021234567890123456" },
        { clave: "Tipo", valor: "Corriente" },
      ]},
      { nombre: "Pago Móvil", datos: [
        { clave: "Banco", valor: "Banco Nacional" },
        { clave: "Teléfono", valor: "04125550000" },
        { clave: "Titular", valor: "U.E. Asistencia Plus" },
        { clave: "Documento", valor: "J123456789" },
      ]},
    ];
  };

  const metodosDisponibles = getMetodos();
  const metodoActual = metodosDisponibles.find((m: any) => m.nombre.toLowerCase() === metodo) || metodosDisponibles[0];
  const datosPago = metodoActual?.datos.map((d: any) => `${d.clave}: ${d.valor}`).join("\n") || "";

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const enviarComprobante = async () => {
    if (!refTransaccion.trim()) { toast.error("Ingresa la referencia de la transacción"); return; }
    setEnviando(true);
    try {
      // Leer screenshot como base64
      let screenshotBase64 = "";
      if (comprobante) {
        const reader = new FileReader();
        screenshotBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(comprobante);
        });
      }

      const res = await fetch("/api/reportes/solvencia/comprobante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudianteId,
          estudianteNombre,
          estudianteAnio,
          estudianteSeccion,
          referencia: refTransaccion.trim(),
          metodo: metodoActual?.nombre || metodo,
          screenshot: screenshotBase64 || undefined,
        }),
      });
      if (res.ok) {
        toast.success("✅ Comprobante enviado al directivo");
        setMetodo("inicio");
        setRefTransaccion("");
        setComprobante(null);
      }
    } catch {
      toast.error("Error al enviar");
    }
    setEnviando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      {showSuccess && <SuccessBurst />}
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-xl">💰</div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {metodo === "inicio" ? "Método de Pago" : metodo === "yaPague" ? "Confirmar Pago" : metodoActual?.nombre || metodo}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{estudianteNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6">
          {metodo === "inicio" ? (
            <div className="space-y-3">
              {metodosDisponibles.map((m: any) => (
                <button key={m.nombre} onClick={() => setMetodo(m.nombre.toLowerCase() as any)}
                  className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <p className="font-bold text-blue-700 dark:text-blue-300">💳 {m.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Realizar pago mediante {m.nombre.toLowerCase()}</p>
                </button>
              ))}
            </div>
          ) : metodo === "yaPague" ? (
            /* Formulario Ya Pagué */
            <div className="space-y-4">
              <button onClick={() => setMetodo("inicio")} className="text-xs text-gray-400 hover:text-gray-600">⬅️ Volver</button>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">👨‍🎓 Estudiante</label>
                  <input type="text" value={estudianteNombre} disabled
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">📅 Año</label>
                    <input type="text" value={estudianteAnio} disabled
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">🏫 Sección</label>
                    <input type="text" value={`"${estudianteSeccion}"`} disabled
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">📋 Referencia de la transacción</label>
                  <input type="text" value={refTransaccion} onChange={(e) => setRefTransaccion(e.target.value)}
                    placeholder="Nro. de referencia o comprobante"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">📎 Comprobante (screenshot)</label>
                  <input type="file" accept="image/*" onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:rounded-full file:border-0 file:bg-green-100 dark:file:bg-green-900/40 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-green-700 dark:file:text-green-300" />
                  {comprobante && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-green-600">✅ {comprobante.name}</p>
                      <button onClick={() => setComprobante(null)} className="text-xs text-red-500 hover:text-red-700">🗑️ Quitar</button>
                    </div>
                  )}
                </div>
                <button onClick={enviarComprobante} disabled={enviando}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors">
                  {enviando ? "Enviando..." : "✅ Enviar Comprobante"}
                </button>
              </div>
            </div>
          ) : (
            /* Detalle del método de pago */
            <div className="space-y-4">
              <button onClick={() => setMetodo("inicio")} className="text-xs text-gray-400 hover:text-gray-600">⬅️ Volver</button>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-700 dark:text-gray-200">
                  Datos para {metodoActual?.nombre || metodo}:
                </p>
                <pre className="text-gray-600 dark:text-gray-300 whitespace-pre-line font-sans">
                  {datosPago}
                </pre>
                <button onClick={() => copiar(datosPago)}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
                  📋 Copiar Todo
                </button>
              </div>
              <button onClick={() => setMetodo("yaPague")}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors">
                ✅ Ya Pagué
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="btn-secondary w-full">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
