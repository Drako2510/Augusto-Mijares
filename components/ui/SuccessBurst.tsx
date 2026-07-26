"use client";

import { useEffect, useState } from "react";

interface SuccessBurstProps {
  /** Duración visible en ms antes de llamar a onDone. Default: 1200 */
  duration?: number;
  /** Callback al terminar la animación */
  onDone?: () => void;
}

/**
 * Overlay de confirmación: anillo expansivo + checkmark SVG animado + confeti.
 * Se muestra por `duration` ms y luego llama a `onDone`.
 */
export function SuccessBurst({ duration = 1200, onDone }: SuccessBurstProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  if (!visible) return null;

  return (
    <div className="success-burst-overlay">
      {/* Anillo expansivo */}
      <div className="success-burst-ring" />

      {/* Checkmark SVG */}
      <svg
        className="success-checkmark"
        viewBox="0 0 52 52"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="circle" cx="26" cy="26" r="25" />
        <path className="tick" d="M14 27 l7 7 l16-16" />
      </svg>

      {/* Confeti */}
      <div className="confetti-piece" />
      <div className="confetti-piece" />
      <div className="confetti-piece" />
      <div className="confetti-piece" />
      <div className="confetti-piece" />
      <div className="confetti-piece" />
    </div>
  );
}
