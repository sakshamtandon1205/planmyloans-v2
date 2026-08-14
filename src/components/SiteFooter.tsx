export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 py-8 max-[859px]:pb-24">
        <p className="max-w-xl text-caption leading-relaxed text-ink-4">
          PlanMyLoans is an independent, free tool. Illustrative only — not financial, tax, or legal advice. © 2026
          PlanMyLoans.
        </p>
        <a href="mailto:sakshamtandon1205@gmail.com" className="hover-row text-body-sm font-semibold text-accent-text">
          sakshamtandon1205@gmail.com
        </a>
      </div>
    </footer>
  );
}
