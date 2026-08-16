import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { AmbientBackground } from "@/components/AmbientBackground";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

// display: "optional" on all three (not the default "swap") — Lighthouse's
// layout-shifts audit named IBM Plex Mono (the numeric-figure font) AND
// Source Sans 3 (QuickEstimate's label font) as co-occurring causes of the
// same reflow: fixing only IBM Plex Mono left Source Sans 3 free to still
// swap-and-reflow the same card. "optional" removes the swap for all three
// — the browser commits to one font for the page's lifetime (real font if
// already cached within ~100ms, fallback otherwise) instead of swapping
// mid-session after first paint.
const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  display: "optional",
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "optional",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "optional",
});

const DEFAULT_TITLE = "PlanMyLoans · Home Loan, EMI & SWP Planner";
const DEFAULT_DESCRIPTION =
  "Free interactive planner to model a home loan against your own capital. Split funds across a mutual fund lumpsum, an SWP or bank corpus to fund the EMI, and a down payment. See EMI, payoff time, interest, prepayment savings, and tax impact live.";

export const metadata: Metadata = {
  metadataBase: new URL("https://planmyloans.in"),
  title: "PlanMyLoans",
  description: "Plan your home loan against your own capital.",
  other: { "google-adsense-account": "ca-pub-6785721439785755" },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: "PlanMyLoans",
    url: "/",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PlanMyLoans",
  url: "https://planmyloans.in",
  logo: "https://planmyloans.in/icon.svg",
  founder: {
    "@type": "Person",
    name: "Saksham Tandon",
    url: "https://www.linkedin.com/in/sakshamtandon1205/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${sourceSans3.variable} ${ibmPlexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <MotionConfig reducedMotion="user">
            <AmbientBackground />
            <SiteNav />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            <SiteFooter />
          </MotionConfig>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
