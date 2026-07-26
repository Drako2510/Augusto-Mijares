"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "0.75rem",
          background: "#111827",
          color: "#fff",
          fontSize: "0.875rem",
        },
        success: {
          iconTheme: {
            primary: "#22C55E",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
