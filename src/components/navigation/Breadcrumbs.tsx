"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  userRole?: string;
}

export function Breadcrumbs({ items, userRole }: BreadcrumbsProps) {
  const rootHref = userRole === "ATHLETE" ? "/athletes" : "/dashboard";
  const rootLabel = userRole === "ATHLETE" ? "My Portal" : "Dashboard";

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-xs text-slate-400 font-medium py-1 overflow-x-auto whitespace-nowrap"
    >
      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        <li className="flex items-center">
          <Link
            href={rootHref}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={`Return to ${rootLabel}`}
          >
            <Home className="h-3.5 w-3.5 text-slate-500" />
            <span className="sr-only sm:not-sr-only">{rootLabel}</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  className="font-bold text-white max-w-[200px] truncate sm:max-w-none"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-400 hover:text-emerald-400 transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 max-w-[160px] truncate sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
