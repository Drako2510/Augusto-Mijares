"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/components/ui/Toast";

const MATERIAS_BASE = [
  { id: "matematicas", nombre: "Matemáticas", icono: "➗" },
  { id: "lengua", nombre: "Lengua Española", icono: "📖" },
  { id: "ciencias", nombre: "Ciencias Naturales", icono: "🔬" },
  { id: "historia", nombre: "Historia", icono: "🏛️" },
  { id: "ingles", nombre: "Inglés", icono: "🌎" },
];

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

export default function RegistrarProfesorPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [anio, setAnio] = useState("");
  const [seccion, setSeccion] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successData, setSuccessData] = useState<{ nombre: string; email: string; materiaId: string; anio: string; seccion: string } | null>(null);

  // Nueva materia
  const [materiasDisponibles, setMateriasDisponibles] = useState(MATERIAS_BASE);
  const [mostrarNuevaMateria, setMostrarNuevaMateria] = useState(false);
  const [nuevaMateriaNombre, setNuevaMateriaNombre] = useState("");

  const triggerShake = () => {
    formRef.current?.classList.add("shake");
    setTimeout(() => formRef.current?.classList.remove("shake"), 500);
  };

  const agregarNuevaMateria = () => {
    const nombre = nuevaMateriaNombre.trim();
    if (!nombre) return;
    const id = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "").slice(0, 20);
    const nueva = { id, nombre, icono: "📚" };
    setMateriasDisponibles((prev) => [...prev, nueva]);
    setMateriaId(id);
    setNuevaMateriaNombre("");
    setMostrarNuevaMateria(false);
    toast(`Materia "${nombre}" agregada`, "success");
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

  if (successData) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">✅</div>
          <h1 className="text-xl font-extrabold text-gray-800">Profesor Registrado</h1>
          <p className="mt-1 text-sm text-gray-500">{successData.nombre} — {successData.email}</p>

          <div className="mt-6 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-5">
            <p className="text-xs font-semibold uppercase text-green-600 dark:text-green-400 tracking-wide">✅ Registro Exitoso</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              La clave secreta se generó automáticamente y está asociada a la clase.
            </p>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => { setSuccessData(null); setNombre(""); setApellido(""); setEmail(""); setPassword(""); setMateriaId(""); setAnio(""); setSeccion(""); setPasswordConfirmacion(""); }} className="btn-secondary">
              ➕ Registrar Otro
            </button>
            <button onClick={() => router.push("/directivo")} className="btn-primary">
              ✅ Ir al Panel
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 2) errors.nombre = "Nombre requerido";
    if (!apellido.trim() || apellido.trim().length < 2) errors.apellido = "Apellido requerido";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email válido requerido";
    if (!password || password.length < 6) errors.password = "Mínimo 6 caracteres";
    if (!materiaId) errors.materiaId = "Selecciona una materia";
    if (!anio) errors.anio = "Selecciona un año";
    if (!seccion) errors.seccion = "Selecciona una sección";
    if (!passwordConfirmacion.trim()) errors.passwordConfirmacion = "Ingresa tu contraseña para confirmar";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/directivo/registro-profesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          password,
          materiaId,
          anio,
          seccion,
          passwordConfirmacion: passwordConfirmacion,
          activo,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Error al registrar profesor");
        triggerShake();
      } else {
        setSuccessData({
          nombre: data.profesor.nombre,
          email: data.profesor.email,
          materiaId: data.materiaId,
          anio: data.anio,
          seccion: data.seccion,
        });
        toast("Profesor registrado exitosamente", "success");
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
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">
          👨‍🏫 Registrar Nuevo Profesor
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Asigna una materia, año, sección y genera una clave secreta para el profesor.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="error-message"><span>❌</span> {error}</div>
          )}

          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <input id="nombre" type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); setFieldErrors(p => ({...p, nombre:""})); }} placeholder=" " autoComplete="given-name" />
              <label htmlFor="nombre">👤 Nombre</label>
              {fieldErrors.nombre && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.nombre}</p>}
            </div>
            <div className="input-group">
              <input id="apellido" type="text" value={apellido} onChange={(e) => { setApellido(e.target.value); setFieldErrors(p => ({...p, apellido:""})); }} placeholder=" " autoComplete="family-name" />
              <label htmlFor="apellido">👤 Apellido</label>
              {fieldErrors.apellido && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.apellido}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email:""})); }} placeholder=" " autoComplete="email" />
            <label htmlFor="email">📧 Correo electrónico</label>
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="input-group">
            <input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password:""})); }} placeholder=" " autoComplete="new-password" />
            <label htmlFor="password">🔒 Contraseña</label>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.password}</p>}
          </div>

          {/* Materia */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="materia" className="text-sm font-semibold text-gray-600">📚 Materia</label>
              <button
                type="button"
                onClick={() => setMostrarNuevaMateria(!mostrarNuevaMateria)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
              >
                {mostrarNuevaMateria ? "Cancelar" : "➕ Nueva Materia"}
              </button>
            </div>

            {mostrarNuevaMateria && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={nuevaMateriaNombre}
                  onChange={(e) => setNuevaMateriaNombre(e.target.value)}
                  placeholder="Nombre de la nueva materia"
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarNuevaMateria(); } }}
                />
                <button
                  type="button"
                  onClick={agregarNuevaMateria}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
            )}

            <select required id="materia" value={materiaId} onChange={(e) => { setMateriaId(e.target.value); setFieldErrors(p => ({...p, materiaId:""})); }} className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="">Seleccionar materia</option>
              {materiasDisponibles.map(m => <option key={m.id} value={m.id}>{m.icono} {m.nombre}</option>)}
            </select>
            {fieldErrors.materiaId && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.materiaId}</p>}
          </div>

          {/* Año + Sección */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="anio" className="mb-1 block text-sm font-semibold text-gray-600">📅 Año</label>
              <select required id="anio" value={anio} onChange={(e) => { setAnio(e.target.value); setFieldErrors(p => ({...p, anio:""})); }} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="">Seleccionar</option>
                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {fieldErrors.anio && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.anio}</p>}
            </div>
            <div>
              <label htmlFor="seccion" className="mb-1 block text-sm font-semibold text-gray-600">📋 Sección</label>
              <select required id="seccion" value={seccion} onChange={(e) => { setSeccion(e.target.value); setFieldErrors(p => ({...p, seccion:""})); }} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="">Seleccionar</option>
                {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {fieldErrors.seccion && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.seccion}</p>}
            </div>
          </div>

          {/* Contraseña del directivo (confirmación) */}
          <div>
            <label htmlFor="passwordConfirmacion" className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
              🔒 Contraseña del directivo
            </label>
            <input
              id="passwordConfirmacion"
              type="password"
              value={passwordConfirmacion}
              onChange={(e) => { setPasswordConfirmacion(e.target.value); setFieldErrors(p => ({...p, passwordConfirmacion:""})); }}
              placeholder="Ingresa tu contraseña para confirmar"
              autoComplete="current-password"
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              La clave secreta del profesor se generará automáticamente.
            </p>
            {fieldErrors.passwordConfirmacion && <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.passwordConfirmacion}</p>}
          </div>

          {/* Activo */}
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:border-blue-300 transition-colors">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">✅ Usuario activo</span>
          </label>

          <button type="submit" disabled={loading} onClick={(e) => createRipple(e)} className={`btn-primary w-full ${loading ? "loading" : ""}`}>
            <div className="spinner" />
            <span className="btn-text">{loading ? "Registrando..." : "👨‍🏫 Registrar Profesor"}</span>
          </button>
        </form>
      </div>
    </main>
  );
}
