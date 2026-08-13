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

const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanMyLoans",
  description: "Plan your home loan against your own capital.",
  other: { "google-adsense-account": "ca-pub-6785721439785755" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${sourceSans3.variable} ${ibmPlexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
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
