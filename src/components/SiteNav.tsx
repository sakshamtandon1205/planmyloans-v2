"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-7 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-h3 font-bold text-ink">
          <span className="inline-flex size-6 items-center justify-center rounded-sm bg-indigo text-body-sm text-white">
            ◆
          </span>
          PlanMyLoans
        </Link>

        <div className="ml-auto flex flex-wrap items-center gap-5">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-0.5 text-body-sm font-medium transition-colors ${
                  isActive ? "border-indigo text-indigo" : "border-transparent text-ink-2 hover:text-indigo"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
