# Sistema de Gestión Escolar — Asistencia Plus

Aplicación Next.js 14 (App Router) + TypeScript estricto + Tailwind CSS para la
gestión de asistencia, calendario de evaluaciones y tareas, con navegación
jerárquica: **Materia → Año → Sección → Dashboard**.

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el entorno de desarrollo
npm run dev

# 3. Abrir en el navegador
http://localhost:3000
```

### Build de producción

```bash
npm run build
npm run start
```

## 📦 Dependencias principales

| Paquete | Uso |
|---|---|
| `next` | Framework (App Router) |
| `react` / `react-dom` | UI |
| `zustand` | Estado global (materia/año/sección activos) |
| `date-fns` | Cálculo y formateo de fechas del calendario |
| `react-hot-toast` | Notificaciones toast (confirmación de tareas) |
| `react-icons` | Iconografía (Feather Icons) |
| `tailwindcss`, `postcss`, `autoprefixer` | Estilos |
| `typescript` | Tipado estricto |

## 🗺️ Flujo de navegación

```
/                                              → Lista de materias
/materia/matematicas                           → Selección de año
/materia/matematicas/3ro                       → Selección de sección
/materia/matematicas/3ro/A/dashboard           → Dashboard completo
```

## 🧩 Módulos del Dashboard

1. **Asistencia**: tabla de 10 estudiantes por sección, con botones
   Presente/Ausente mutuamente excluyentes (toggle a "Sin marcar" si se
   presiona dos veces el mismo botón).
2. **Notificaciones**: historial en tiempo real, persistido en
   `localStorage` (`historial_notificaciones_[materia]_[anio]_[seccion]`).
3. **Calendario de evaluaciones**: calendario mensual propio (construido con
   `date-fns`), puntos naranjas en días con evaluación, formulario de alta y
   listado de próximas evaluaciones.
4. **Tareas**: formulario con descripción y fecha de entrega; al enviar,
   agrega una entrada al historial de notificaciones y muestra un toast de
   confirmación.

## 💾 Persistencia (localStorage)

| Dato | Clave |
|---|---|
| Asistencia | `asistencias_[materia]_[anio]_[seccion]` |
| Evaluaciones | `evaluaciones_[materia]_[anio]_[seccion]` |
| Notificaciones | `historial_notificaciones_[materia]_[anio]_[seccion]` |

Cada combinación materia/año/sección tiene su propio espacio de
almacenamiento, evitando colisiones de datos entre grupos.

## 📁 Estructura de carpetas

```
app/
├── page.tsx                                        # Lista de materias
├── not-found.tsx                                    # Página 404
├── globals.css
├── layout.tsx
└── materia/[id]/
    ├── page.tsx                                     # Selección de años
    └── [anio]/
        ├── page.tsx                                 # Selección de secciones
        └── [seccion]/dashboard/
            └── page.tsx                             # Dashboard (server) + DashboardClient

components/
├── MateriaCard.tsx
├── AnioSelector.tsx
├── SeccionSelector.tsx
├── AsistenciaTable.tsx
├── CalendarioEvaluaciones.tsx
├── HistorialNotificaciones.tsx
├── TareaForm.tsx
├── Breadcrumb.tsx
├── DashboardClient.tsx        # Orquestador cliente del dashboard
└── ToasterProvider.tsx

hooks/
├── useAsistencia.ts
├── useEvaluaciones.ts
└── useNotificaciones.ts

store/
└── useAppStore.ts             # Zustand: materia/año/sección activos

data/
└── seed.ts                    # Materias, años, secciones y estudiantes

utils/
├── localStorage.ts
└── formatters.ts
```

## ✅ Estado del proyecto

El proyecto fue validado con `next build` (TypeScript `strict: true`) sin
errores de compilación ni de tipos.
