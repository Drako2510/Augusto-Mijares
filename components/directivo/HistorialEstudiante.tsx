interface AsistenciaRecord {
  id: string;
  fecha: string;
  materia: string;
  icono: string;
  estado: string;
}

interface EvaluacionRecord {
  id: string;
  fecha: string;
  materia: string;
  icono: string;
  titulo: string;
  calificacion: number;
}

interface TareaRecord {
  id: string;
  materia: string;
  icono: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
}

interface Props {
  asistencias: AsistenciaRecord[];
  evaluaciones: EvaluacionRecord[];
  tareas: TareaRecord[];
}

export function HistorialAsistencias({ asistencias }: { asistencias: AsistenciaRecord[] }) {
  if (asistencias.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-gray-400">Sin registros de asistencia</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
        <tr>
          <th className="px-5 py-2">Fecha</th>
          <th className="px-5 py-2">Materia</th>
          <th className="px-5 py-2">Estado</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {asistencias.map((a) => (
          <tr key={a.id} className="hover:bg-gray-50">
            <td className="px-5 py-2 text-gray-600">{a.fecha}</td>
            <td className="px-5 py-2 text-gray-700">{a.icono} {a.materia}</td>
            <td className="px-5 py-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                a.estado === "presente" ? "bg-green-100 text-green-700" :
                a.estado === "ausente" ? "bg-red-100 text-red-700" :
                a.estado === "justificado" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {a.estado === "presente" ? "✅ Presente" :
                 a.estado === "ausente" ? "❌ Ausente" :
                 a.estado === "justificado" ? "📝 Justificado" : `⏰ ${a.estado}`}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HistorialEvaluaciones({ evaluaciones }: { evaluaciones: EvaluacionRecord[] }) {
  if (evaluaciones.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-gray-400">Sin evaluaciones registradas</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
        <tr>
          <th className="px-5 py-2">Fecha</th>
          <th className="px-5 py-2">Materia</th>
          <th className="px-5 py-2">Título</th>
          <th className="px-5 py-2 text-center">Nota</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {evaluaciones.map((ev) => (
          <tr key={ev.id} className="hover:bg-gray-50">
            <td className="px-5 py-2 text-gray-600">{ev.fecha}</td>
            <td className="px-5 py-2 text-gray-700">{ev.icono} {ev.materia}</td>
            <td className="px-5 py-2 font-medium text-gray-800">{ev.titulo}</td>
            <td className="px-5 py-2 text-center">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                ev.calificacion >= 7 ? "bg-green-100 text-green-700" :
                ev.calificacion >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              }`}>{ev.calificacion}/10</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HistorialTareas({ tareas }: { tareas: TareaRecord[] }) {
  if (tareas.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-gray-400">Sin tareas pendientes</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
        <tr>
          <th className="px-5 py-2">Materia</th>
          <th className="px-5 py-2">Título</th>
          <th className="px-5 py-2">Descripción</th>
          <th className="px-5 py-2 text-center">Entrega</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {tareas.map((t) => (
          <tr key={t.id} className="hover:bg-gray-50">
            <td className="px-5 py-2 text-gray-700">{t.icono} {t.materia}</td>
            <td className="px-5 py-2 font-medium text-gray-800">{t.titulo}</td>
            <td className="px-5 py-2 text-gray-500 text-xs max-w-xs truncate">{t.descripcion || "—"}</td>
            <td className="px-5 py-2 text-center">
              <span className="text-xs font-semibold text-amber-600">📆 {t.fechaEntrega}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
