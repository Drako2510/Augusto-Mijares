interface Props {
  activo: boolean;
  onActivar?: () => void;
}

export function ModoEdicionBadge({ activo, onActivar }: Props) {
  if (activo) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700 animate-bounce-in">
        🔓 Modo Edición Activado
      </span>
    );
  }

  return (
    <button
      onClick={onActivar}
      className="btn-primary text-sm"
    >
      🔑 Ingresar Clave Secreta para Editar
    </button>
  );
}
