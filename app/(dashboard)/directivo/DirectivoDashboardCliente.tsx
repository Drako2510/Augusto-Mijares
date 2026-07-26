"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { HorarioModal } from "@/components/directivo/HorarioModal";
import toast from "react-hot-toast";
import { BoletinButton } from "@/components/directivo/BoletinButton";
import { PasarAnioButton } from "@/components/directivo/PasarAnioButton";
import { CambiarSeccionButton } from "@/components/directivo/CambiarSeccionButton";
import { anios as aniosSeed, secciones as seccionesSeed } from "@/data/seed";

// ─── Tipos ───────────────────────────────────────────────────
interface MateriaInfo {
  id: string;
  nombre: string;
  icono: string;
}

interface AsignacionInfo {
  id: string;
  usuarioId: string;
  materiaId: string;
  anio: string;
  seccion: string;
  activo: boolean;
  materia: MateriaInfo;
  usuario: { nombre: string; email: string };
}

interface EstudianteInfo {
  id: string;
  nombre: string;
  anio: string;
  seccion: string;
  representantes: { representante: { nombre: string; email: string } }[];
}

interface ProfesorAgrupado {
  id: string;
  nombre: string;
  email: string;
  materias: {
    materia: MateriaInfo;
    anio: string;
    seccion: string;
    asignacionId: string;
  }[];
}

interface Props {
  asignaciones: AsignacionInfo[];
  estudiantes: EstudianteInfo[];
}

type Vista = "grid" | "profesores" | "estudiantes" | "clases" | "reportes";

// ─── Componente Principal ────────────────────────────────────
export function DirectivoDashboardCliente({
  asignaciones,
  estudiantes,
}: Props) {
  const [vista, setVista] = useState<Vista>("grid");

  // Agrupar asignaciones por profesor
  const profesores = useMemo(() => {
    const map = new Map<string, ProfesorAgrupado>();
    for (const a of asignaciones) {
      if (!map.has(a.usuarioId)) {
        map.set(a.usuarioId, {
          id: a.usuarioId,
          nombre: a.usuario.nombre,
          email: a.usuario.email,
          materias: [],
        });
      }
      map.get(a.usuarioId)!.materias.push({
        materia: a.materia,
        anio: a.anio,
        seccion: a.seccion,
        asignacionId: a.id,
      });
    }
    return Array.from(map.values());
  }, [asignaciones]);

  // Breadcrumb
  const breadcrumb = (
    <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
      <button
        onClick={() => setVista("grid")}
        className="hover:text-blue-600 transition-colors"
      >
        Panel Directivo
      </button>
      {vista !== "grid" && (
        <>
          <span>/</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {vista === "profesores"
              ? "Profesores"
              : vista === "estudiantes"
                ? "Estudiantes"
                : "Clases Activas"}
          </span>
        </>
      )}
    </div>
  );

  // ── Renderizar según vista ──────────────────────────────────
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {breadcrumb}

      {vista === "grid" && (
        <GridDashboard
          cantProfesores={profesores.length}
          cantEstudiantes={estudiantes.length}
          cantClases={asignaciones.length}
          onNavigate={setVista}
        />
      )}

      {vista === "profesores" && (
        <ProfesoresView profesores={profesores} onNavigate={setVista} />
      )}

      {vista === "estudiantes" && (
        <EstudiantesView estudiantes={estudiantes} onNavigate={setVista} />
      )}

      {vista === "clases" && (
        <ClasesView asignaciones={asignaciones} onNavigate={setVista} />
      )}

      {vista === "reportes" && <ReportesView onNavigate={setVista} />}
    </main>
  );
}

// ─── Vista: Grid Principal ────────────────────────────────────
function GridDashboard({
  cantProfesores,
  cantEstudiantes,
  cantClases,
  onNavigate,
}: {
  cantProfesores: number;
  cantEstudiantes: number;
  cantClases: number;
  onNavigate: (v: Vista) => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
          👔 Panel de Control — Director
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Gestiona profesores, estudiantes y accede a todas las clases.
        </p>
      </div>

      {/* Grid de 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profesor */}
        <button
          onClick={() => onNavigate("profesores")}
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:shadow-gray-900/50 hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-700 text-left"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-2xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
            👨‍🏫
          </div>
          <h3 className="text-center text-sm font-bold text-gray-800 dark:text-gray-100">
            Profesor
          </h3>
          <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
            {cantProfesores} profesor{cantProfesores !== 1 ? "es" : ""} registrado
            {cantProfesores !== 1 ? "s" : ""}
          </p>
        </button>

        {/* Estudiante */}
        <button
          onClick={() => onNavigate("estudiantes")}
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:shadow-gray-900/50 hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-700 text-left"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
            👨‍🎓
          </div>
          <h3 className="text-center text-sm font-bold text-gray-800 dark:text-gray-100">
            Estudiante
          </h3>
          <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
            {cantEstudiantes} estudiante{cantEstudiantes !== 1 ? "s" : ""}{" "}
            registrado{cantEstudiantes !== 1 ? "s" : ""}
          </p>
        </button>

        {/* Ver Todas las Clases */}
        <button
          onClick={() => onNavigate("clases")}
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:shadow-gray-900/50 hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 text-left"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
            📚
          </div>
          <h3 className="text-center text-sm font-bold text-gray-800 dark:text-gray-100">
            Ver Todas las Clases
          </h3>
          <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
            {cantClases} clase{cantClases !== 1 ? "s" : ""} activa
            {cantClases !== 1 ? "s" : ""}
          </p>
        </button>

        {/* Reportes Globales */}
        <button
          onClick={() => onNavigate("reportes")}
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-700 text-left"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-2xl group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
            📈
          </div>
          <h3 className="text-center text-sm font-bold text-gray-800 dark:text-gray-100">
            Reportes Globales
          </h3>
          <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
            Cuadro de honor y más
          </p>
        </button>
      </div>
    </>
  );
}

// ─── Vista: Profesores ────────────────────────────────────────
function ProfesoresView({
  profesores,
  onNavigate,
}: {
  profesores: ProfesorAgrupado[];
  onNavigate: (v: Vista) => void;
}) {
  return (
    <>
      {/* Header + Botón Registrar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate("grid")}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-200 dark:text-gray-600 transition-colors"
          >
            ⬅️ Volver al Panel
          </button>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
            👨‍🏫 Profesores
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {profesores.length} profesor{profesores.length !== 1 ? "es" : ""}{" "}
            registrado{profesores.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/directivo/registro/profesor"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md dark:shadow-gray-900/40 hover:bg-blue-700 hover:shadow-lg dark:shadow-gray-900/50 transition-all"
        >
          ➕ Registrar Profesor/a
        </Link>
      </div>

      {profesores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400 dark:text-gray-500">No hay profesores registrados aún.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Registra un profesor para comenzar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {profesores.map((prof) => (
            <div
              key={prof.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-md dark:shadow-gray-900/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Info del profesor */}
                <div className="flex-1 min-w-0">
                  {/* Badges de materias — primero, sin repetir misma materia */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Array.from(
                      new Map(prof.materias.map((m) => [m.materia.id, m.materia])).values()
                    ).map((mat) => (
                      <span
                        key={mat.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-sm font-bold text-blue-700 dark:text-blue-300"
                      >
                        {mat.icono} Prof. {mat.nombre}
                      </span>
                    ))}
                  </div>
                  {/* Nombre y correo — debajo */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {prof.nombre}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {prof.email}
                    </span>
                  </div>
                  {/* Años y secciones */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {prof.materias.map((m, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-500 dark:text-gray-400"
                      >
                        {m.anio} &quot;{m.seccion}&quot;
                      </span>
                    ))}
                  </div>
                </div>
                {/* Botón Gestionar */}
                <Link
                  href={`/directivo/profesor/${prof.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 transition-all hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-sm dark:shadow-gray-900/30 flex-shrink-0"
                >
                  ⚙️ Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Vista: Estudiantes ───────────────────────────────────────
function EstudiantesView({
  estudiantes,
  onNavigate,
}: {
  estudiantes: EstudianteInfo[];
  onNavigate: (v: Vista) => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return estudiantes;
    const q = busqueda.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return estudiantes.filter((e) =>
      e.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)
    );
  }, [estudiantes, busqueda]);

  return (
    <>
      {/* Header + Botón Registrar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate("grid")}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-200 dark:text-gray-600 transition-colors"
          >
            ⬅️ Volver al Panel
          </button>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
            👨‍🎓 Estudiantes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {busqueda.trim() ? `${filtrados.length} de ${estudiantes.length}` : `${estudiantes.length}`} estudiante{estudiantes.length !== 1 ? "s" : ""} registrado{estudiantes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-56 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <Link
            href="/directivo/registro/estudiante"
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all flex-shrink-0"
          >
            ➕ Registrar Estudiante/a
          </Link>
        </div>
      </div>

      {estudiantes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No hay estudiantes registrados aún.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Registra un estudiante para comenzar.
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No se encontraron estudiantes con &quot;{busqueda}&quot;
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3">Estudiante</th>
                  <th className="px-5 py-3">Año</th>
                  <th className="px-5 py-3 hidden sm:table-cell text-center">Sección</th>
                  <th className="px-5 py-3 hidden md:table-cell">Representante</th>
                  <th className="px-5 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtrados.map((est) => {
                  const rep = est.representantes[0]?.representante;
                  return (
                    <tr
                      key={est.id}
                      className="hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">
                        {est.nombre}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-200 dark:text-gray-600">{est.anio}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-200 dark:text-gray-600 hidden sm:table-cell">
                        &quot;{est.seccion}&quot;
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 dark:text-gray-500 hidden md:table-cell text-xs">
                        {rep ? `${rep.nombre} (${rep.email})` : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Link
                          href={`/directivo/estudiante/${est.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 transition-all hover:bg-green-100 dark:bg-green-900/40 hover:shadow-sm dark:shadow-gray-900/30"
                        >
                          📊 Ver Historial
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Vista: Clases Activas ────────────────────────────────────
function ClasesView({
  asignaciones,
  onNavigate,
}: {
  asignaciones: AsignacionInfo[];
  onNavigate: (v: Vista) => void;
}) {
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null);
  const [expandedAnio, setExpandedAnio] = useState<string | null>(null);
  const [mostrarHorarioModal, setMostrarHorarioModal] = useState(false);
  const [horarios, setHorarios] = useState<
    {
      id: string;
      anio: string;
      seccion: string;
      data: {
        headers: ({ value: string; align?: string; bold?: boolean } | string)[];
        rows: ({ value: string; align?: string; bold?: boolean } | string)[][];
        merges?: { r: number; c: number; colSpan: number; rowSpan: number }[];
      };
      archivoNombre: string;
      updatedAt: string;
    }[]
  >([]);
  const [horarioExpandido, setHorarioExpandido] = useState<string | null>(null);

  const cargarHorarios = useCallback(async () => {
    try {
      const res = await fetch(`/api/horarios?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setHorarios(json.horarios ?? []);
        // Notificar a profesores/representantes que el horario cambió
        window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    cargarHorarios();
  }, [cargarHorarios]);

  // Generar TODOS los años+secciones (1ro-5to x A-D), mezclar con datos reales
  const cursos = useMemo(() => {
    const all: { anio: string; seccion: string; asignaciones: AsignacionInfo[] }[] = [];
    for (const anio of ["1ro", "2do", "3ro", "4to", "5to"]) {
      for (const seccion of ["A", "B", "C", "D"]) {
        all.push({ anio, seccion, asignaciones: [] });
      }
    }
    for (const a of asignaciones) {
      const curso = all.find((c) => c.anio === a.anio && c.seccion === a.seccion);
      if (curso) curso.asignaciones.push(a);
    }
    return all;
  }, [asignaciones]);

  const cursoData = selectedCurso
    ? cursos.find((c) => `${c.anio}_${c.seccion}` === selectedCurso)
    : null;

  return (
    <>
      {mostrarHorarioModal && (
        <HorarioModal
          anios={aniosSeed}
          secciones={seccionesSeed}
          onClose={() => setMostrarHorarioModal(false)}
          onGuardado={cargarHorarios}
        />
      )}

      <div className="mb-6">
        <button
          onClick={() => {
            if (selectedCurso) setSelectedCurso(null);
            else onNavigate("grid");
          }}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {selectedCurso ? "⬅️ Volver a Cursos" : "⬅️ Volver al Panel"}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
              {selectedCurso
                ? `📚 ${selectedCurso.split("_")[0]} "${selectedCurso.split("_")[1]}"`
                : "📚 Clases Activas"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedCurso
                ? `${cursoData?.asignaciones.length || 0} materia(s) asignada(s)`
                : "Selecciona un año y sección para ver sus materias"}
            </p>
          </div>
          {!selectedCurso ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarHorarioModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-purple-700 hover:shadow-lg transition-all"
              >
                📅 Agregar Horario
              </button>
              <PasarAnioButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <BoletinButton
                anio={selectedCurso.split("_")[0]}
                seccion={selectedCurso.split("_")[1]}
              />
              {selectedCurso.split("_")[0] === "5to" && (
                <BoletinButton
                  anio={selectedCurso.split("_")[0]}
                  seccion={selectedCurso.split("_")[1]}
                  esFinal
                />
              )}
              <CambiarSeccionButton
                anio={selectedCurso.split("_")[0]}
                seccion={selectedCurso.split("_")[1]}
              />
            </div>
          )}
        </div>
      </div>

      {asignaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No hay materias asignadas en el sistema.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Registra un profesor para comenzar.
          </p>
        </div>
      ) : !selectedCurso ? (
        /* Años con secciones expandibles */
        <div className="space-y-4">
          {["1ro", "2do", "3ro", "4to", "5to"].map((anio) => {
            const seccionesDelAnio = cursos.filter((c) => c.anio === anio);
            return (
              <div
                key={anio}
                className={`group rounded-2xl border bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md ${
                  expandedAnio === anio
                    ? "border-purple-300 dark:border-purple-700 shadow-md"
                    : "border-gray-200 dark:border-gray-700 dark:shadow-gray-900/30"
                }`}
              >
                {/* Cabecera del año */}
                <button
                  onClick={() =>
                    setExpandedAnio(expandedAnio === anio ? null : anio)
                  }
                  className="w-full flex items-center gap-4 px-6 py-4 text-left"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-xl flex-shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
                      {anio}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {seccionesDelAnio.filter((s) => s.asignaciones.length > 0).length}/4 secciones con materias
                    </p>
                  </div>
                </button>

                {/* Secciones (visibles al hover o click) */}
                <div
                  className={`grid-cols-4 gap-3 px-6 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 ${
                    expandedAnio === anio
                      ? "grid"
                      : "hidden group-hover:grid"
                  }`}
                >
                  {seccionesDelAnio.map((c) => {
                    const tiene = c.asignaciones.length > 0;
                    return (
                      <button
                        key={`${c.anio}_${c.seccion}`}
                        onClick={() => setSelectedCurso(`${c.anio}_${c.seccion}`)}
                        className={`rounded-xl border p-4 text-center transition-all hover:scale-105 hover:shadow-md ${
                          tiene
                            ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 hover:border-gray-400"
                        }`}
                      >
                        <p className={`text-3xl font-extrabold ${
                          tiene
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}>
                          &quot;{c.seccion}&quot;
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {tiene
                            ? `${c.asignaciones.length} materia${c.asignaciones.length !== 1 ? "s" : ""}`
                            : "Sin asignar"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Indicador de expansión */}
                {expandedAnio !== anio && (
                  <div className="text-center pb-3 group-hover:hidden">
                    <span className="text-xs text-gray-300 dark:text-gray-600">
                      Click o pasa el mouse para ver secciones
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : cursoData && cursoData.asignaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No hay materias asignadas para {selectedCurso?.split("_")[0]} &quot;{selectedCurso?.split("_")[1]}&quot;.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Registra un profesor para este curso.
          </p>
        </div>
      ) : (
        /* Tabla de materias del curso seleccionado */
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-3 py-3 sm:px-5">Materia</th>
                <th className="px-3 py-3 sm:px-5 hidden md:table-cell">Profesor</th>
                <th className="px-3 py-3 sm:px-5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {cursoData?.asignaciones.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-3 py-3 sm:px-5 font-medium text-gray-800 dark:text-gray-100">
                    <span className="mr-1 sm:mr-2">{a.materia.icono}</span>
                    <span>{a.materia.nombre}</span>
                  </td>
                  <td className="px-3 py-3 sm:px-5 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {a.usuario.nombre}
                  </td>
                  <td className="px-3 py-3 sm:px-5 text-center">
                    <Link
                      href={`/directivo/materia/${a.materiaId}/${a.anio}/${a.seccion}`}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-1.5 sm:px-3 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-all hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-sm"
                    >
                      🔍 <span className="hidden sm:inline">Ver Clase</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Horarios Guardados ── */}
      {horarios.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-gray-700 dark:text-gray-200">
            📅 Horarios Guardados
          </h2>
          <div className="space-y-4">
            {horarios.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() =>
                    setHorarioExpandido(
                      horarioExpandido === h.id ? null : h.id
                    )
                  }
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <div className="text-left">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {h.anio} &quot;{h.seccion}&quot;
                      </span>
                      <span className="ml-3 text-xs text-gray-400 dark:text-gray-500">
                        {h.archivoNombre}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 text-sm">
                    {horarioExpandido === h.id ? "▲" : "▼"}
                  </span>
                </button>

                {horarioExpandido === h.id && (
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-xs border-collapse border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          {h.data.headers.map((header, i) => {
                            const hdr =
                              typeof header === "string"
                                ? { value: header, align: "left" as const }
                                : header;
                            return (
                              <th
                                key={i}
                                className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-200 whitespace-nowrap border border-gray-300 dark:border-gray-600"
                                style={{
                                  textAlign: (hdr.align || "left") as
                                    | "left"
                                    | "center"
                                    | "right",
                                }}
                              >
                                {hdr.value}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {h.data.rows.map((row, ri) => {
                          const merges = h.data.merges || [];
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
                                    className={`px-3 py-1.5 whitespace-nowrap border border-gray-300 dark:border-gray-600 ${
                                      merge || cell.bold
                                  ? "font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Vista: Reportes ────────────────────────────────────────
function ReportesView({
  onNavigate,
}: {
  onNavigate: (v: Vista) => void;
}) {
  const [subVista, setSubVista] = useState<
    "grid" | "cuadro-honor" | "solvencia"
  >("grid");

  if (subVista === "cuadro-honor") {
    return <CuadroHonorView onBack={() => setSubVista("grid")} />;
  }

  if (subVista === "solvencia") {
    return <ListaSolvenciaView onBack={() => setSubVista("grid")} />;
  }

  return (
    <>
      <div className="mb-8">
        <button
          onClick={() => onNavigate("grid")}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ⬅️ Volver al Panel
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
          📈 Reportes Globales
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Accede a los reportes del sistema
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cuadro de Honor */}
        <button
          onClick={() => setSubVista("cuadro-honor")}
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-yellow-300 dark:hover:border-yellow-700 text-left"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/40 text-2xl group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition-colors">
            🏆
          </div>
          <h3 className="text-center text-sm font-bold text-gray-800 dark:text-gray-100">
            Cuadro de Honor
          </h3>
          <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
            Ranking de estudiantes por promedio
          </p>
        </button>

        {/* Lista de Solvencia */}
        <button
          onClick={() => setSubVista("solvencia")}
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-700 text-left"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
            💰
          </div>
          <h3 className="text-center text-sm font-bold text-gray-800 dark:text-gray-100">
            Lista de Solvencia
          </h3>
          <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
            Control de pagos de estudiantes
          </p>
        </button>
      </div>
    </>
  );
}

// ─── Vista: Cuadro de Honor (Ranking) ────────────────────────
function CuadroHonorView({
  onBack,
}: {
  onBack: () => void;
}) {
  const [ranking, setRanking] = useState<
    {
      id: string;
      nombre: string;
      anio: string;
      seccion: string;
      promedio: number;
      cantidad: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    try {
      const res = await fetch("/api/reportes/cuadro-honor");
      if (res.ok) {
        const json = await res.json();
        setRanking(json.ranking ?? []);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
    // Polling cada 30s para mantener el ranking actualizado
    const interval = setInterval(fetchRanking, 30000);
    return () => clearInterval(interval);
  }, [fetchRanking]);

  // Refrescar instantáneo vía evento global
  useEffect(() => {
    const handler = () => fetchRanking();
    window.addEventListener("dashboard:refresh", handler);
    return () => window.removeEventListener("dashboard:refresh", handler);
  }, [fetchRanking]);

  const medalla = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return "";
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ⬅️ Volver a Reportes
        </button>
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
          🏆 Cuadro de Honor
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ranking de estudiantes por promedio académico
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-100 border-t-amber-600" />
        </div>
      ) : ranking.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            No hay evaluaciones registradas aún.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            El cuadro de honor se generará cuando haya evaluaciones cargadas.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[1, 0, 2].map((idx) => {
                if (idx >= ranking.length) return <div key={idx} />;
                const e = ranking[idx];
                const sizes = ["text-4xl", "text-5xl", "text-3xl"];
                return (
                  <div
                    key={e.id}
                    className={`flex flex-col items-center ${idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}
                  >
                    <span className={sizes[idx]}>{medalla(idx)}</span>
                    <p className="mt-1 font-bold text-gray-800 dark:text-gray-100 text-sm">
                      {e.nombre.split(" ")[0]}
                    </p>
                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                      {e.promedio}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {e.anio} &quot;{e.seccion}&quot;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Estudiante</th>
                  <th className="px-5 py-3">Curso</th>
                  <th className="px-5 py-3 text-center">Eval.</th>
                  <th className="px-5 py-3 text-center">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ranking.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      i < 3 ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-bold text-gray-500 dark:text-gray-400">
                      {i < 3 ? medalla(i) : i + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {e.nombre}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {e.anio} &quot;{e.seccion}&quot;
                    </td>
                    <td className="px-5 py-3 text-center text-gray-500 dark:text-gray-400">
                      {e.cantidad}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          e.promedio >= 9
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                            : e.promedio >= 7
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : e.promedio >= 5
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {e.promedio}/10
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Vista: Lista de Solvencia ───────────────────────────────
function BandejaPagosModal({ onClose, onAprobar }: { onClose: () => void; onAprobar: () => void }) {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [confirmados, setConfirmados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pendientes" | "confirmados">("pendientes");

  const fetchData = useCallback(() => {
    fetch("/api/reportes/solvencia/comprobantes")
      .then((r) => r.json())
      .then((d) => {
        setPendientes(d.pendientes || []);
        setConfirmados(d.confirmados || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const aprobar = async (p: any) => {
    try {
      await fetch(`/api/reportes/solvencia/comprobante/${p.id}`, { method: "PUT" });
      await fetch("/api/reportes/solvencia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estudianteId: p.estudianteId, solvente: true }),
      });
      setPendientes((prev) => prev.filter((x: any) => x.id !== p.id));
      setConfirmados((prev) => [{ ...p, aprobado: true }, ...prev]);
      onAprobar();
      toast.success("Pago confirmado ✅");
    } catch {}
  };

  const lista = tab === "pendientes" ? pendientes : confirmados;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-xl">📬</div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Bandeja de Pagos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""} · {confirmados.length} confirmado{confirmados.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab("pendientes")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === "pendientes" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>
              ⏳ Por Confirmar ({pendientes.length})
            </button>
            <button onClick={() => setTab("confirmados")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === "confirmados" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>
              ✅ Confirmados ({confirmados.length})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-100 border-t-amber-600" /></div>
          ) : lista.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              {tab === "pendientes" ? "No hay comprobantes pendientes" : "No hay pagos confirmados"}
            </p>
          ) : (
            <div className="space-y-3">
              {lista.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{p.estudianteNombre}</p>
                      <p className="text-xs text-gray-400">{p.estudianteAnio} &quot;{p.estudianteSeccion}&quot;</p>
                      <p className="text-xs text-gray-500 mt-1">📋 Ref: {p.referencia}</p>
                      <p className="text-xs text-gray-500">💳 Método: {p.metodo}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleString("es")}</p>
                    </div>
                  </div>
                  {p.screenshot && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">📎 Comprobante:</p>
                      <img src={p.screenshot} alt="Comprobante" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 object-contain bg-gray-100 dark:bg-gray-800" />
                    </div>
                  )}
                  {tab === "pendientes" && (
                    <button onClick={() => aprobar(p)}
                      className="mt-3 w-full rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors">
                      ✅ Pago Confirmado
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListaSolvenciaView({ onBack }: { onBack: () => void }) {
  interface EstudianteSolvencia {
    id: string;
    nombre: string;
    anio: string;
    seccion: string;
    solvente: boolean;
    representantes: { representante: { nombre: string; email: string } }[];
  }

  const [solventes, setSolventes] = useState<EstudianteSolvencia[]>([]);
  const [noSolventes, setNoSolventes] = useState<EstudianteSolvencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [mostrarBandeja, setMostrarBandeja] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/reportes/solvencia");
      if (res.ok) {
        const json = await res.json();
        setSolventes(json.solventes ?? []);
        setNoSolventes(json.noSolventes ?? []);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSolvencia = async (est: EstudianteSolvencia) => {
    setUpdating(est.id);
    const nuevoEstado = !est.solvente;
    try {
      const res = await fetch("/api/reportes/solvencia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudianteId: est.id,
          solvente: nuevoEstado,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // silencioso
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ⬅️ Volver a Reportes
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
              💰 Lista de Solvencia
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Control de pagos — {solventes.length} solventes, {noSolventes.length}{" "}
              pendientes
            </p>
          </div>
          <button
            onClick={() => setMostrarBandeja(true)}
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 hover:shadow-lg transition-all"
          >
            📬 Bandeja de Pagos
          </button>
        </div>
      </div>

      {/* Modal Bandeja de Pagos */}
      {mostrarBandeja && (
        <BandejaPagosModal onClose={() => setMostrarBandeja(false)} onAprobar={fetchData} />
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* No Solventes */}
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 px-5 py-3 border-b border-red-100 dark:border-red-800">
              <h2 className="text-sm font-bold text-red-700 dark:text-red-400">
                ❌ No Solventes ({noSolventes.length})
              </h2>
            </div>
            {noSolventes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Todos los estudiantes están solventes ✅
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                {noSolventes.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                        {e.nombre}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {e.anio} &quot;{e.seccion}&quot;
                        {e.representantes[0]?.representante && (
                          <>
                            {" · "}
                            {e.representantes[0].representante.nombre}
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSolvencia(e)}
                      disabled={updating === e.id}
                      className="ml-3 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                    >
                      {updating === e.id ? "..." : "✅ Marcar Solvente"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solventes */}
          <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="bg-green-50 dark:bg-green-900/20 px-5 py-3 border-b border-green-100 dark:border-green-800">
              <h2 className="text-sm font-bold text-green-700 dark:text-green-400">
                ✅ Solventes ({solventes.length})
              </h2>
            </div>
            {solventes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Ningún estudiante ha pagado aún
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                {solventes.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                        {e.nombre}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {e.anio} &quot;{e.seccion}&quot;
                        {e.representantes[0]?.representante && (
                          <>
                            {" · "}
                            {e.representantes[0].representante.nombre}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
