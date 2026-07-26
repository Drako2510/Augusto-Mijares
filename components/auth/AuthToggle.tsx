"use client";

interface AuthToggleProps {
  mode: "login" | "register";
  onChange: (mode: "login" | "register") => void;
}

export function AuthToggle({ mode, onChange }: AuthToggleProps) {
  const isRegister = mode === "register";

  return (
    <div className={`toggle-container ${isRegister ? "register" : ""}`}>
      {/* Slider animado */}
      <div className="toggle-slider" />

      {/* Botón Login */}
      <button
        type="button"
        onClick={() => onChange("login")}
        className={`toggle-btn ${!isRegister ? "active" : ""}`}
      >
        🔑 Iniciar Sesión
      </button>

      {/* Botón Register */}
      <button
        type="button"
        onClick={() => onChange("register")}
        className={`toggle-btn ${isRegister ? "active" : ""}`}
      >
        ✨ Registrarse
      </button>
    </div>
  );
}
