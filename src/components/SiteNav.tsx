"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();
  // Nav links live inside a mobile menu instead of just vanishing — a
  // hidden-with-no-alternative nav was the actual bug (there was previously
  // no way to reach Guides/About/Contact on a phone at all). Closed
  // explicitly on link click/toggle rather than via an effect watching
  // pathname/isMobile — simpler and avoids a synchronous setState-in-effect.
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto mt-4 w-full max-w-6xl px-6">
      <nav className="glass-panel rounded-[16px] px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-heading text-[15.5px] font-extrabold tracking-[-0.01em] text-ink sm:gap-2.5 sm:text-[18px]"
          >
            <span className="flex size-7 flex-none items-center justify-center rounded-[9px] bg-[linear-gradient(135deg,var(--indigo),var(--jade))] sm:size-8">
              <span className="size-2.5 rotate-45 rounded-[3px] bg-white sm:size-3" />
            </span>
            <span className="truncate">PlanMyLoans</span>
          </Link>

          <div className="flex flex-none items-center gap-2.5 sm:gap-5">
            {/* Both variants always render; only CSS visibility toggles at
                the min-[860px] breakpoint, so SSR and CSR paint identical
                DOM — see ChartSkeletons.tsx for the same convention. */}
            <div className="hidden items-center gap-7 min-[860px]:flex">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[14.5px] font-semibold transition-colors ${
                      isActive ? "text-ink" : "text-ink-3 hover:text-ink"
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
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="cta-tap hover-icon-btn flex size-9 flex-none items-center justify-center rounded-[9px] border border-line-2 bg-chip text-ink min-[860px]:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="size-4.5">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mt-3 flex flex-col gap-1 border-t border-line-2 pt-3 min-[860px]:hidden">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`cta-tap hover-row rounded-[9px] px-3 py-2.5 text-[14.5px] font-semibold ${
                    isActive ? "bg-chip text-ink" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
}
