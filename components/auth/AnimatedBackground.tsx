"use client";

/**
 * Fondo animado con orbes flotantes para la página de auth.
 * Orbes semitransparentes que se mueven orgánicamente detrás del glass card.
 */
export function AnimatedBackground() {
  return (
    <div className="orb-container" aria-hidden="true">
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
    </div>
  );
}
