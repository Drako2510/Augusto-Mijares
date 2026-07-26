"use client";

import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { useSession } from "@/hooks/useSession";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROL_HOME: Record<string, string> = {
  profesor: "/profesor",
  representante: "/representante",
  directivo: "/directivo",
};

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { user } = useSession();
  const homeHref = user?.rol ? ROL_HOME[user.rol] ?? "/" : "/";

  return (
    <nav
      aria-label="breadcrumb"
      className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6"
    >
      <Link
        href={homeHref}
        className="flex items-center gap-1 hover:text-brand-blue transition-colors"
      >
        <FiHome className="h-4 w-4" />
        <span>Inicio</span>
      </Link>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          <FiChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-brand-blue transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
