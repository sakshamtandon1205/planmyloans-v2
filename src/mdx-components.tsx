import type { ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";

/**
 * Default typography for every element MDX content produces. Any element
 * that needs a one-off style (e.g. the lead paragraph, or a CTA box built
 * from raw JSX inside a guide) can just pass its own `className` — these
 * wrappers only apply their default when the caller doesn't supply one.
 */
const components: MDXComponents = {
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={className ?? "mb-4 mt-11 font-heading text-h2 font-semibold tracking-tight text-ink"}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className={className ?? "mb-3 mt-8 font-heading text-h3 text-ink"} {...props} />
  ),
  p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className={className ?? "mb-4 text-body leading-relaxed text-ink"} {...props} />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className={className ?? "mb-4 list-disc space-y-2 pl-5 text-body leading-relaxed text-ink"} {...props} />
  ),
  ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className={className ?? "mb-4 list-decimal space-y-2 pl-5 text-body leading-relaxed text-ink"} {...props} />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => <li className={className} {...props} />,
  strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className={className ?? "font-semibold text-ink"} {...props} />
  ),
  em: ({ className, ...props }: ComponentPropsWithoutRef<"em">) => <em className={className} {...props} />,
  a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a className={className ?? "font-medium text-indigo underline-offset-2 hover:underline"} {...props} />
  ),
};

export function useMDXComponents(existingComponents: MDXComponents): MDXComponents {
  return { ...existingComponents, ...components };
}
