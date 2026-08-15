import Link from "next/link";

interface GuideBreadcrumbProps {
  title: string;
}

/** Visible Home > Guides > [Guide Title] trail, matching the BreadcrumbList JSON-LD already emitted per guide page. */
export function GuideBreadcrumb({ title }: GuideBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl px-6 pt-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-body-sm text-ink-3">
        <li>
          <Link href="/" className="font-medium text-ink-2 transition-colors hover:text-indigo hover:underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/guides" className="font-medium text-ink-2 transition-colors hover:text-indigo hover:underline">
            Guides
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="truncate font-medium text-ink">
          {title}
        </li>
      </ol>
    </nav>
  );
}
