import type { Metadata } from "next";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstitucionProvider } from "@/components/InstitucionProvider";

export const metadata: Metadata = {
  title: "Sistema de Gestión Escolar - Asistencia Plus",
  description:
    "Plataforma de gestión de asistencia, calendario de evaluaciones y tareas para instituciones educativas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script inline para evitar flash blanco al cargar en dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem("theme");
                  if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-brand-bg text-gray-800 antialiased">
        <InstitucionProvider>
          <ThemeProvider>
            <ToastProvider>
              <ToasterProvider />
              {children}
            </ToastProvider>
          </ThemeProvider>
        </InstitucionProvider>
      </body>
    </html>
  );
}
