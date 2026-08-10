"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-h3 font-bold text-ink">
          <span className="inline-flex size-6 items-center justify-center rounded-sm bg-indigo-solid text-body-sm text-white">
            ◆
          </span>
          PlanMyLoans
        </Link>

        {/* Nav links: horizontal from md up. Below that they move into the
            collapsible panel — the theme toggle stays put either way, since
            it's a sibling here rather than nested inside the wrapping link
            group (that nesting was what dropped it to its own row before). */}
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-5 md:flex">
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
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label="Toggle navigation menu"
            className="inline-flex size-9 flex-none items-center justify-center rounded-sm border border-line-2 bg-surface text-ink-2 transition-colors hover:border-indigo hover:text-indigo md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-[18px]">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-nav-menu" className="border-t border-line px-6 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-sm px-2 py-2.5 text-body-sm font-medium transition-colors ${
                    isActive ? "bg-indigo-soft text-indigo" : "text-ink-2 hover:bg-surface-2 hover:text-indigo"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
