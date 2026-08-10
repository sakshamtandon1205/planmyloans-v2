import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-8 px-6">
        <div>
          <h4 className="mb-3 font-heading text-body-sm font-semibold text-ink">PlanMyLoans</h4>
          <Link href="/" className="mb-2 block text-body-sm text-ink-2 hover:text-indigo">
            Calculator
          </Link>
          <Link href="/guides" className="mb-2 block text-body-sm text-ink-2 hover:text-indigo">
            Guides
          </Link>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-body-sm font-semibold text-ink">Site</h4>
          <Link href="/about" className="mb-2 block text-body-sm text-ink-2 hover:text-indigo">
            About
          </Link>
          <Link href="/contact" className="mb-2 block text-body-sm text-ink-2 hover:text-indigo">
            Contact
          </Link>
          <Link href="/privacy" className="mb-2 block text-body-sm text-ink-2 hover:text-indigo">
            Privacy Policy
          </Link>
        </div>
        <div>
          <h4 className="mb-3 font-heading text-body-sm font-semibold text-ink">Get in touch</h4>
          <a href="mailto:sakshamtandon1205@gmail.com" className="block text-body-sm text-ink-2 hover:text-indigo">
            sakshamtandon1205@gmail.com
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <p className="mt-7 text-caption leading-relaxed text-ink-3">
          PlanMyLoans is an independent, free tool. It is illustrative only and does not constitute financial, tax,
          or legal advice. © 2026 PlanMyLoans.
        </p>
      </div>
    </footer>
  );
}
