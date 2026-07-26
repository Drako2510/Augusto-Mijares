export interface Materia {
  id: string;
  nombre: string;
  icono: string;
  estudiantesInscritos: number;
}

export const materias: Materia[] = [
  { id: "matematicas", nombre: "Matemáticas", icono: "➗", estudiantesInscritos: 28 },
  { id: "lengua", nombre: "Lengua Española", icono: "📖", estudiantesInscritos: 30 },
  { id: "ciencias", nombre: "Ciencias Naturales", icono: "🔬", estudiantesInscritos: 25 },
  { id: "historia", nombre: "Historia", icono: "🏛️", estudiantesInscritos: 27 },
  { id: "ingles", nombre: "Inglés", icono: "🌎", estudiantesInscritos: 29 },
];

export interface Anio {
  id: string;
  nombre: string;
}

export const anios: Anio[] = [
  { id: "1ro", nombre: "1ro" },
  { id: "2do", nombre: "2do" },
  { id: "3ro", nombre: "3ro" },
  { id: "4to", nombre: "4to" },
  { id: "5to", nombre: "5to" },
];

export interface Seccion {
  id: string;
  nombre: string;
  colorClass: string;
}

export const secciones: Seccion[] = [
  { id: "A", nombre: "A", colorClass: "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300" },
  { id: "B", nombre: "B", colorClass: "bg-green-100 hover:bg-green-200 text-green-800 border-green-300" },
  { id: "C", nombre: "C", colorClass: "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300" },
  { id: "D", nombre: "D", colorClass: "bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300" },
];

export const estudiantesPorSeccion: Record<string, string[]> = {
  A: [
    "Ana Pérez",
    "Luis Gómez",
    "Carla Ruiz",
    "Pedro Díaz",
    "Sofía Méndez",
    "Juan Castro",
    "María López",
    "Carlos Sánchez",
    "Laura Torres",
    "David Ríos",
  ],
  B: [
    "Andrea Flores",
    "José Ramírez",
    "Valentina Ortiz",
    "Diego Morales",
    "Camila Vargas",
    "Miguel Herrera",
    "Isabella Cruz",
    "Fernando Silva",
    "Gabriela Rojas",
    "Ricardo Peña",
  ],
  C: [
    "Paola Jiménez",
    "Eduardo Navarro",
    "Daniela Guerrero",
    "Sebastián Aguilar",
    "Natalia Campos",
    "Alejandro Vega",
    "Mariana Reyes",
    "Gustavo Delgado",
    "Fernanda Soto",
    "Rodrigo Paredes",
  ],
  D: [
    "Lucía Fernández",
    "Tomás Molina",
    "Emilia Contreras",
    "Nicolás Bravo",
    "Renata Espinoza",
    "Adrián Cordero",
    "Ximena Salazar",
    "Bruno Cabrera",
    "Antonella Marín",
    "Ignacio Fuentes",
  ],
};

/** Devuelve el objeto materia a partir de su slug, o undefined si no existe. */
export function getMateriaById(id: string): Materia | undefined {
  return materias.find((m) => m.id === id);
}

/** Devuelve el objeto año a partir de su id, o undefined si no existe. */
export function getAnioById(id: string): Anio | undefined {
  return anios.find((a) => a.id === id);
}

/** Devuelve el objeto sección a partir de su id, o undefined si no existe. */
export function getSeccionById(id: string): Seccion | undefined {
  return secciones.find((s) => s.id === id.toUpperCase());
}
