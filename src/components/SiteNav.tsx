"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** True once the page has scrolled past a small threshold — used to close the nav's top gap so no page content is ever visible above it. */
function useScrolled(thresholdPx: number) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > thresholdPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdPx]);
  return scrolled;
}

export function SiteNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const scrolled = useScrolled(8);

  return (
    <div className={`sticky z-50 mx-auto w-full max-w-6xl px-6 ${scrolled ? "top-0" : "top-4"}`}>
      <nav className="glass-panel flex items-center justify-between gap-2 rounded-[16px] px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
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
          {!isMobile && (
            <div className="flex items-center gap-7">
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
          )}

          <ThemeToggle />

          <Link
            href="/#planner"
            className="cta-tap whitespace-nowrap rounded-[10px] bg-[linear-gradient(135deg,var(--indigo),var(--jade))] px-3 py-2 font-heading text-[12.5px] font-bold text-white sm:px-[18px] sm:py-2.5 sm:text-[13.5px]"
          >
            Start Planning
          </Link>
        </div>
      </nav>
    </div>
  );
}
