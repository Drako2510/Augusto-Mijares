/**
 * Componente de skeleton loading con efecto shimmer.
 * Usar mientras se cargan datos asíncronos.
 */

interface ShimmerProps {
  /** Tipo de placeholder */
  variant?: "text" | "circle" | "rect" | "card";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Shimmer({
  variant = "text",
  width,
  height,
  className = "",
}: ShimmerProps) {
  const baseClasses: Record<string, string> = {
    text: "h-4 rounded w-full",
    circle: "rounded-full",
    rect: "rounded-lg",
    card: "rounded-xl h-24 w-full",
  };

  const defaultSizes: Record<string, { width: string; height: string }> = {
    text: { width: "100%", height: "16px" },
    circle: { width: "48px", height: "48px" },
    rect: { width: "100%", height: "100px" },
    card: { width: "100%", height: "96px" },
  };

  const defaults = defaultSizes[variant];
  const style: React.CSSProperties = {
    width: width ?? defaults.width,
    height: height ?? defaults.height,
  };

  return (
    <div
      className={`shimmer ${baseClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Conjunto de shimmers para simular carga de formulario */
export function FormShimmer({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer variant="text" width="30%" height="14px" />
          <Shimmer variant="rect" height="48px" />
        </div>
      ))}
      <Shimmer variant="rect" height="52px" className="rounded-full" />
    </div>
  );
}
