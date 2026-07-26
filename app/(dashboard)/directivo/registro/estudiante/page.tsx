"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/components/ui/Toast";
import { RegistroPorLista } from "./RegistroPorLista";

const ANIOS = ["1ro", "2do", "3ro", "4to", "5to"];
const SECCIONES = ["A", "B", "C", "D"];

function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement("span");
  ripple.className = "ripple-effect";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

interface RepresentanteOption {
  id: string;
  nombre: string;
  email: string;
}

export default function RegistrarEstudiantePage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  // Modal de registro por lista
  const [mostrarListaModal, setMostrarListaModal] = useState(false);

  // Estudiante
  const [nombre, setNombre] = useState("");
  const [anio, setAnio] = useState("");
  const [seccion, setSeccion] = useState("");
  const [fnDia, setFnDia] = useState("");
  const [fnMes, setFnMes] = useState("");
  const [fnAnio, setFnAnio] = useState("");
  const diaRef = useRef<HTMLInputElement>(null);
  const mesRef = useRef<HTMLInputElement>(null);
  const anioRef = useRef<HTMLInputElement>(null);

  const fechaNacimiento = fnDia && fnMes && fnAnio
    ? `${fnAnio}-${fnMes.padStart(2, "0")}-${fnDia.padStart(2, "0")}`
    : "";

  const abrirCalendario = () => {
    // Usar un input date oculto para el calendario nativo
    const input = document.createElement("input");
    input.type = "date";
    input.style.position = "absolute";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);
    input.showPicker?.();
    input.addEventListener("change", () => {
      if (input.value) {
        const [y, m, d] = input.value.split("-");
        setFnAnio(y);
        setFnMes(String(Number(m)));
        setFnDia(String(Number(d)));
      }
      document.body.removeChild(input);
    });
    input.addEventListener("blur", () => {
      setTimeout(() => { if (document.body.contains(input)) document.body.removeChild(input); }, 200);
    });
  };
  const [activo, setActivo] = useState(true);

  // Representante
  const [modoRepresentante, setModoRepresentante] = useState<"existente" | "nuevo">("existente");
  const [repExistenteId, setRepExistenteId] = useState("");
  const [representantes, setRepresentantes] = useState<RepresentanteOption[]>([]);
  const [repNombre, setRepNombre] = useState("");
  const [repApellido, setRepApellido] = useState("");
  const [repCedula, setRepCedula] = useState("");
  const [repTelefono, setRepTelefono] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cargar representantes existentes
  useEffect(() => {
    if (modoRepresentante === "existente") {
      fetch("/api/representantes")
        .then((r) => r.json())
        .then((d) => setRepresentantes(d.representantes ?? []))
        .catch(() => {});
    }
  }, [modoRepresentante]);

  const triggerShake = () => {
    formRef.current?.classList.add("shake");
    setTimeout(() => formRef.current?.classList.remove("shake"), 500);
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="shimmer h-10 w-64" />
      </div>
    );
  }

  if (!user || user.rol !== "directivo") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Acceso restringido a directivos.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 2) errors.nombre = "Nombre requerido";
    if (!anio) errors.anio = "Selecciona un año";
    if (!seccion) errors.seccion = "Selecciona una sección";

    if (modoRepresentante === "existente") {
      if (!repExistenteId) errors.repExistenteId = "Selecciona un representante";
    } else {
      if (!repNombre.trim() || repNombre.trim().length < 2) errors.repNombre = "Nombre requerido";
      if (!repApellido.trim() || repApellido.trim().length < 2) errors.repApellido = "Apellido requerido";
      if (!repCedula.trim() || repCedula.trim().length < 5) errors.repCedula = "Cédula requerida (mín. 5 dígitos)";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        nombre: nombre.trim(),
        anio,
        seccion,
        fechaNacimiento: fechaNacimiento || null,
        activo,
        modoRepresentante,
      };

      if (modoRepresentante === "existente") {
        body.repExistenteId = repExistenteId;
      } else {
        body.repNombre = repNombre.trim();
        body.repApellido = repApellido.trim();
        body.repCedula = repCedula.trim();
        body.repTelefono = repTelefono.trim();
      }

      const res = await fetch("/api/directivo/registro-estudiante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error al registrar estudiante");
        triggerShake();
      } else {
        toast(`Estudiante registrado. Representante: ${data.representante?.email ?? "asignado"}`, "success");
        router.push("/directivo");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Modal de Registro por Lista */}
      {mostrarListaModal && (
        <RegistroPorLista onClose={() => setMostrarListaModal(false)} />
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
            🎒 Registrar Nuevo Estudiante
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Asigna un estudiante a un año y sección. Elige un representante existente o crea uno nuevo.
          </p>
        </div>
        <button
          onClick={() => setMostrarListaModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all"
        >
          📋 Registro por Lista
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="error-message"><span>❌</span> {error}</div>}

          {/* ── DATOS DEL ESTUDIANTE ── */}
          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-bold text-gray-600">📚 Datos del Estudiante</legend>

            <div className="input-group">
              <input id="nombre" type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); setFieldErrors(p => ({...p, nombre:""})); }} placeholder=" " autoComplete="off" />
              <label htmlFor="nombre">👤 Nombre completo</label>
              {fieldErrors.nombre && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.nombre}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">🎂 Fecha de Nacimiento</label>
                <button type="button" onClick={abrirCalendario}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors">
                  📅 Calendario
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  ref={diaRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="DD"
                  value={fnDia}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    if (v === "" || (Number(v) >= 1 && Number(v) <= 31)) {
                      setFnDia(v);
                      if (v.length === 2) mesRef.current?.focus();
                    }
                  }}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-center font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  ref={mesRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  value={fnMes}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    if (v === "" || (Number(v) >= 1 && Number(v) <= 12)) {
                      setFnMes(v);
                      if (v.length === 2) anioRef.current?.focus();
                    }
                  }}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-center font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  ref={anioRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="AAAA"
                  value={fnAnio}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setFnAnio(v);
                  }}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-center font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              {fechaNacimiento && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  📅 {fnDia}/{["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][Number(fnMes)]}/{fnAnio}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="anio" className="mb-1 block text-sm font-semibold text-gray-600">📅 Año</label>
                <select id="anio" value={anio} onChange={(e) => { setAnio(e.target.value); setFieldErrors(p => ({...p, anio:""})); }} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Seleccionar</option>
                  {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {fieldErrors.anio && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.anio}</p>}
              </div>
              <div>
                <label htmlFor="seccion" className="mb-1 block text-sm font-semibold text-gray-600">📋 Sección</label>
                <select id="seccion" value={seccion} onChange={(e) => { setSeccion(e.target.value); setFieldErrors(p => ({...p, seccion:""})); }} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Seleccionar</option>
                  {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.seccion && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.seccion}</p>}
              </div>
            </div>
          </fieldset>

          {/* ── DATOS DEL REPRESENTANTE ── */}
          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-bold text-gray-600">👨‍👧 Datos del Representante</legend>

            {/* Toggle: existente / nuevo */}
            <div className={`toggle-container mb-4 ${modoRepresentante === "nuevo" ? "register" : ""}`}>
              <div className="toggle-slider" />
              <button type="button" onClick={() => { setModoRepresentante("existente"); setFieldErrors({}); }} className={`toggle-btn ${modoRepresentante === "existente" ? "active" : ""}`}>
                📋 Existente
              </button>
              <button type="button" onClick={() => { setModoRepresentante("nuevo"); setFieldErrors({}); }} className={`toggle-btn ${modoRepresentante === "nuevo" ? "active" : ""}`}>
                ✨ Nuevo
              </button>
            </div>

            {modoRepresentante === "existente" ? (
              <div>
                <label htmlFor="repExistente" className="mb-1 block text-sm font-semibold text-gray-600">👨‍👧 Seleccionar Representante</label>
                <select id="repExistente" value={repExistenteId} onChange={(e) => { setRepExistenteId(e.target.value); setFieldErrors(p => ({...p, repExistenteId:""})); }} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Seleccionar representante...</option>
                  {representantes.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.email})</option>)}
                </select>
                {fieldErrors.repExistenteId && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.repExistenteId}</p>}
                {representantes.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">⚠️ No hay representantes registrados. Cambia a &quot;Nuevo&quot; para crear uno.</p>
                )}
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-gray-400">
                  Email: <code className="font-mono bg-gray-100 px-1 rounded">{(repCedula || "12345678").replace(/\D/g, "")}@escuela.edu</code>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <input id="repNombre" type="text" value={repNombre} onChange={(e) => { setRepNombre(e.target.value); setFieldErrors(p => ({...p, repNombre:""})); }} placeholder=" " autoComplete="off" />
                    <label htmlFor="repNombre">Nombre</label>
                    {fieldErrors.repNombre && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.repNombre}</p>}
                  </div>
                  <div className="input-group">
                    <input id="repApellido" type="text" value={repApellido} onChange={(e) => { setRepApellido(e.target.value); setFieldErrors(p => ({...p, repApellido:""})); }} placeholder=" " autoComplete="off" />
                    <label htmlFor="repApellido">Apellido</label>
                    {fieldErrors.repApellido && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.repApellido}</p>}
                  </div>
                </div>
                <div className="input-group mt-4">
                  <input id="repCedula" type="text" value={repCedula} onChange={(e) => { setRepCedula(e.target.value); setFieldErrors(p => ({...p, repCedula:""})); }} placeholder=" " autoComplete="off" />
                  <label htmlFor="repCedula">🪪 Cédula de Identidad</label>
                  {fieldErrors.repCedula && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.repCedula}</p>}
                </div>
                <div className="input-group">
                  <input id="repTelefono" type="text" value={repTelefono} onChange={(e) => { setRepTelefono(e.target.value); }} placeholder=" " autoComplete="tel" />
                  <label htmlFor="repTelefono">📞 Teléfono</label>
                </div>
              </>
            )}
          </fieldset>

          {/* Activo */}
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:border-blue-300 transition-colors">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">✅ Estudiante activo</span>
          </label>

          <button type="submit" disabled={loading} onClick={(e) => createRipple(e)} className={`btn-primary w-full ${loading ? "loading" : ""}`}>
            <div className="spinner" />
            <span className="btn-text">{loading ? "Registrando..." : "🎒 Registrar Estudiante"}</span>
          </button>
        </form>
      </div>
    </main>
  );
}
