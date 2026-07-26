"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const InstitucionContext = createContext<{
  nombre: string;
  logo: string;
  setNombre: (n: string) => void;
  setLogo: (l: string) => void;
}>({ nombre: "Asistencia Plus", logo: "", setNombre: () => {}, setLogo: () => {} });

export function InstitucionProvider({ children }: { children: React.ReactNode }) {
  const [nombre, setNombreState] = useState("Asistencia Plus");
  const [logo, setLogoState] = useState("");

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/configuracion");
      if (res.ok) {
        const data = await res.json();
        setNombreState(data.nombre || "Asistencia Plus");
        setLogoState(data.logo || "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchConfig();
    // Polling cada 10s para detectar cambios del directivo
    const interval = setInterval(fetchConfig, 10000);
    return () => clearInterval(interval);
  }, [fetchConfig]);

  const setNombre = async (n: string) => {
    setNombreState(n);
    localStorage.setItem("institucion", n);
    try {
      await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n }),
      });
    } catch {}
    window.dispatchEvent(new CustomEvent("institucion:change"));
  };

  const setLogo = async (l: string) => {
    setLogoState(l);
    localStorage.setItem("institucionLogo", l);
    try {
      await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: l }),
      });
    } catch {}
    window.dispatchEvent(new CustomEvent("institucion:change"));
  };

  return (
    <InstitucionContext.Provider value={{ nombre, logo, setNombre, setLogo }}>
      {children}
    </InstitucionContext.Provider>
  );
}

export function useInstitucion() {
  return useContext(InstitucionContext);
}
