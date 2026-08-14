import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { OG_IMAGE, SITE_NAME } from "@/lib/seo";

const TITLE = "Contact · PlanMyLoans";
const DESCRIPTION = "Questions, feedback, or a bug to report? Reach out directly — real replies, no support tickets.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/contact",
    siteName: SITE_NAME,
    type: "website",
    images: [{ ...OG_IMAGE, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pb-16">
      <section className="pt-9 pb-2">
        <div className="mb-3 text-[12.5px] font-bold uppercase tracking-[.06em] text-accent-text">Contact</div>
        <h1 className="mb-3 font-heading text-[34px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
          Questions, feedback, or a bug to report?
        </h1>
        <p className="max-w-[560px] text-body-lg leading-[1.6] text-ink-2">
          PlanMyLoans is a one-person project. Reach out directly — real replies, no support tickets.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 py-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <ContactForm />

        <div className="flex flex-col gap-3.5">
          <div className="glass-panel p-5">
            <div className="mb-1.5 font-heading text-[13.5px] font-bold text-ink">Email</div>
            <a href="mailto:sakshamtandon1205@gmail.com" className="hover-row text-[14px] font-semibold text-accent-text">
              sakshamtandon1205@gmail.com
            </a>
          </div>
          <div className="glass-panel p-5">
            <div className="mb-1.5 font-heading text-[13.5px] font-bold text-ink">Response time</div>
            <div className="text-[13.5px] leading-[1.5] text-ink-2">Usually within 2-3 days.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
