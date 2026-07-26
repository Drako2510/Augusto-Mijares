"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FiSend } from "react-icons/fi";

interface Props {
  onEnviar: (data: { titulo: string; descripcion: string; fechaEntrega: string }) => void;
}

export default function TareaForm({
  onEnviar,
}: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [enviando, setEnviando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim() || !fechaEntrega) return;

    setEnviando(true);

    // Simulamos una pequeña latencia de envío para dar feedback visual realista.
    setTimeout(() => {
      onEnviar({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaEntrega,
      });
      toast.success("Tarea enviada a los representantes 📨");
      setTitulo("");
      setDescripcion("");
      setFechaEntrega("");
      setEnviando(false);
    }, 500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm dark:shadow-gray-900/30"
    >
      <h3 className="font-bold text-gray-700 dark:text-gray-200">📝 Asignar nueva tarea</h3>
      <input
        type="text"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de la tarea (ej. Ejercicios del capítulo 3)"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />
      <textarea
        required
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Describe la tarea a asignar..."
        rows={3}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Fecha de entrega
        </label>
        <input
          type="date"
          required
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-bold text-white shadow-sm dark:shadow-gray-900/30 hover:bg-amber-600 disabled:opacity-60 transition-colors"
      >
        <FiSend className="h-4 w-4" />
        {enviando ? "Enviando..." : "Enviar Tarea a Representantes"}
      </button>
    </form>
  );
}
