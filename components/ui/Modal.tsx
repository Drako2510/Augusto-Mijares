"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeInDown"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="glass-card mx-4 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-800 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
