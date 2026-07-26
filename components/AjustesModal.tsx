"use client";

import { useState } from "react";
import { useInstitucion } from "@/components/InstitucionProvider";
import toast from "react-hot-toast";

const TABS = ["Perfil", "Notificaciones", "Apariencia", "Seguridad"];

export function AjustesModal({ rol, onClose }: { rol?: string; onClose: () => void }) {
  const [tab, setTab] = useState("Perfil");
  const { nombre, logo, setNombre, setLogo } = useInstitucion();
  const [nombreInstitucion, setNombreInstitucion] = useState(nombre);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
      toast.success("✅ Logo actualizado");
    };
    reader.readAsDataURL(file);
  };

  const esDirectivo = rol === "directivo";
  const tabs = esDirectivo
    ? ["Perfil", "Notificaciones", "Apariencia", "Seguridad", "Métodos de Pago"]
    : ["Notificaciones", "Apariencia"];

  const guardarInstitucion = () => {
    setNombre(nombreInstitucion);
    toast.success("✅ Nombre de la institución guardado");
  };

  // Métodos de pago
  const getMetodosPago = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("metodosPago") || "[]");
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    // Defaults
    return [
      { nombre: "Transferencia", datos: [
        { clave: "Banco", valor: "Banco Nacional" },
        { clave: "Titular", valor: "U.E. Asistencia Plus" },
        { clave: "RIF", valor: "J-12345678-9" },
        { clave: "Cuenta", valor: "01021234567890123456" },
        { clave: "Tipo", valor: "Corriente" },
      ]},
      { nombre: "Pago Móvil", datos: [
        { clave: "Banco", valor: "Banco Nacional" },
        { clave: "Teléfono", valor: "04125550000" },
        { clave: "Titular", valor: "U.E. Asistencia Plus" },
        { clave: "RIF", valor: "J-12345678-9" },
      ]},
    ];
  };
  const [metodosPago, setMetodosPago] = useState<any[]>(getMetodosPago);
  const [editandoMetodo, setEditandoMetodo] = useState<any | null>(null);
  const [nuevoMetodo, setNuevoMetodo] = useState(false);

  const plantillasMetodos: Record<string, { clave: string; valor: string }[]> = {
    "Transferencia": [
      { clave: "Banco", valor: "" },
      { clave: "Titular", valor: "" },
      { clave: "RIF", valor: "" },
      { clave: "Cuenta", valor: "" },
      { clave: "Tipo", valor: "Corriente" },
    ],
    "Pago Móvil": [
      { clave: "Banco", valor: "" },
      { clave: "Teléfono", valor: "" },
      { clave: "Titular", valor: "" },
      { clave: "RIF", valor: "" },
      { clave: "Cédula", valor: "" },
    ],
    "Zelle": [
      { clave: "Banco", valor: "" },
      { clave: "Titular", valor: "" },
      { clave: "Correo", valor: "" },
      { clave: "Teléfono", valor: "" },
    ],
    "Personalizado": [
      { clave: "", valor: "" },
    ],
  };

  const iniciarNuevoMetodo = (tipo?: string) => {
    const plantilla = tipo && plantillasMetodos[tipo]
      ? plantillasMetodos[tipo]
      : [{ clave: "", valor: "" }];
    setEditandoMetodo({ nombre: tipo || "", datos: plantilla });
    setNuevoMetodo(true);
  };

  // Guardar defaults si el storage está vacío
  useState(() => {
    if (!localStorage.getItem("metodosPago")) {
      localStorage.setItem("metodosPago", JSON.stringify(getMetodosPago()));
    }
  });

  const guardarMetodos = (data: any[]) => {
    localStorage.setItem("metodosPago", JSON.stringify(data));
    setMetodosPago(data);
    toast.success("✅ Métodos de pago actualizados");
  };

  const guardarMetodo = () => {
    if (!editandoMetodo || !editandoMetodo.nombre.trim()) return;
    let nuevos: any[];
    if (nuevoMetodo) {
      nuevos = [...metodosPago, editandoMetodo];
    } else {
      nuevos = metodosPago.map((m: any) =>
        m.nombre === editandoMetodo.nombreOriginal ? editandoMetodo : m
      );
    }
    guardarMetodos(nuevos);
    setEditandoMetodo(null);
    setNuevoMetodo(false);
  };

  const actualizarCampo = (idx: number, field: "clave" | "valor", value: string) => {
    if (!editandoMetodo) return;
    const nuevosDatos = [...editandoMetodo.datos];
    nuevosDatos[idx] = { ...nuevosDatos[idx], [field]: value };
    setEditandoMetodo({ ...editandoMetodo, datos: nuevosDatos });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-lg shadow-lg shadow-blue-500/20">⚙️</div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ajustes</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="p-6">
          {tab === "Perfil" && esDirectivo && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">🖼️ Logo de la Institución</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl shadow-lg overflow-hidden flex-shrink-0">
                    {logo ? (
                      <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      "📚"
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleLogoUpload}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:rounded-full file:border-0 file:bg-blue-100 dark:file:bg-blue-900/40 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 dark:file:text-blue-300" />
                    <p className="mt-1 text-xs text-gray-400">PNG, JPG. Recomendado: 200x200px</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">🏫 Nombre de la Institución</label>
                <div className="flex gap-2">
                  <input type="text" value={nombreInstitucion} onChange={(e) => setNombreInstitucion(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={guardarInstitucion}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors">💾 Guardar</button>
                </div>
              </div>
            </div>
          )}
          {tab === "Perfil" && !esDirectivo && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Solo el directivo puede modificar los datos de la institución.</p>
          )}

          {tab === "Notificaciones" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Configuración de notificaciones para representantes y profesores.</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Recibir notificaciones de calificaciones</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Recibir notificaciones de asistencia</span>
              </label>
            </div>
          )}

          {tab === "Apariencia" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                El cambio de modo claro/oscuro está disponible desde el botón flotante en la esquina inferior derecha de la pantalla.
              </p>
            </div>
          )}

          {tab === "Seguridad" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Opciones de seguridad y privacidad.</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Requerir contraseña para acciones críticas</span>
              </label>
            </div>
          )}

          {tab === "Métodos de Pago" && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configura los métodos de pago que verán los representantes.
              </p>

              {metodosPago.map((m: any, i: number) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-700 dark:text-gray-200">{m.nombre}</p>
                    <button onClick={() => setEditandoMetodo({ ...m, nombreOriginal: m.nombre })}
                      className="text-xs text-blue-600 hover:text-blue-800">✏️ Editar</button>
                  </div>
                  <div className="space-y-1">
                    {m.datos.map((d: any, j: number) => (
                      <p key={j} className="text-xs text-gray-500"><strong>{d.clave}:</strong> {d.valor}</p>
                    ))}
                  </div>
                </div>
              ))}

              {!editandoMetodo && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500">➕ Agregar método de pago con plantilla:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(plantillasMetodos).map((tipo) => (
                      <button key={tipo} onClick={() => iniciarNuevoMetodo(tipo)}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        💳 {tipo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editandoMetodo && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
                  <p className="font-bold text-sm text-blue-700 dark:text-blue-300">
                    {nuevoMetodo ? "Nuevo Método" : "Editar Método"}
                  </p>
                  <input type="text" value={editandoMetodo.nombre} onChange={(e) => setEditandoMetodo({ ...editandoMetodo, nombre: e.target.value })}
                    placeholder="Nombre del método (ej: Transferencia)"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {editandoMetodo.datos.map((d: any, j: number) => (
                    <div key={j} className="flex gap-2">
                      <input type="text" value={d.clave} onChange={(e) => actualizarCampo(j, "clave", e.target.value)}
                        placeholder="Clave (ej: Banco)" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={d.valor} onChange={(e) => actualizarCampo(j, "valor", e.target.value)}
                        placeholder="Valor (ej: Banco Nacional)" className="flex-[2] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <button onClick={() => setEditandoMetodo({ ...editandoMetodo, datos: [...editandoMetodo.datos, { clave: "", valor: "" }] })}
                    className="text-xs text-blue-600 hover:text-blue-800">➕ Agregar campo</button>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditandoMetodo(null); setNuevoMetodo(false); }}
                      className="btn-secondary flex-1 text-sm">Cancelar</button>
                    <button onClick={guardarMetodo}
                      className="btn-primary flex-1 text-sm">💾 Guardar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
