"use client";

interface Props {
  titulo: string;
  mensaje: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export function ModalConfirmacion({
  titulo,
  mensaje,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
}: Props) {
  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    primary: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{titulo}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">{mensaje}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-100 dark:bg-gray-800"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
