import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · PlanMyLoans",
  description:
    "PlanMyLoans privacy policy: what data this site collects, how cookies and advertising work here, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-3 text-label uppercase text-indigo">Legal</div>
          <h1 className="mb-3 font-heading text-h1 font-semibold text-ink">Privacy Policy</h1>
          <p className="max-w-xl text-body text-ink-2">
            Plain-language version: this site doesn&apos;t ask you to sign up, doesn&apos;t store your financial
            inputs anywhere, and the only data collected is the standard analytics/advertising data most websites
            use. Details below.
          </p>
          <div className="mt-4 font-mono text-mono-sm text-ink-3">Last updated: 21 July 2026</div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-11">
        <p className="mb-4 text-body leading-relaxed text-ink">
          This Privacy Policy explains how PlanMyLoans (&quot;we&quot;, &quot;us&quot;, &quot;the site&quot;,
          &quot;planmyloans.in&quot;) handles information when you visit or use this website. This policy is
          written to comply with applicable data protection principles, including India&apos;s Digital Personal
          Data Protection Act, 2023, and (for visitors in the EU/EEA) the General Data Protection Regulation
          (GDPR).
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">1. What this site is</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          PlanMyLoans is a free, independently run financial planning tool. It is operated by an individual, not a
          company, and is provided as-is for informational and educational purposes.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">2. Data you enter into the calculator</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          The home loan and SWP planner on this site runs <strong className="font-semibold text-ink">entirely in your browser</strong>. Every
          number you type or slide (property price, loan amount, income tax rate, and so on) is processed locally
          on your device using JavaScript. None of these figures are transmitted to us, stored on any server we
          operate, or logged anywhere. When you close the tab, that data is gone. We have no way of ever seeing
          what you entered.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">3. Cookies and similar technologies</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          This site uses two categories of tracking, with different privacy characteristics:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-body leading-relaxed text-ink">
          <li>
            <strong className="font-semibold text-ink">Analytics</strong>: we use Vercel Web Analytics and Vercel
            Speed Insights to understand how many people visit, which pages are useful, and how the site performs.
            Both are cookie-less by design: visitors are identified by a temporary hash derived from the request
            that is discarded after 24 hours, not a persistent cookie or any personal identifier. The data
            collected (page views, coarse geolocation such as country or region, device and browser type, and page
            performance timings) is aggregated and cannot identify you personally.
          </li>
          <li>
            <strong className="font-semibold text-ink">Advertising</strong>: unlike the analytics above, this site
            may display ads served
            through Google AdSense. Google and its partners may use cookies to serve ads based on your prior
            visits to this or other websites. You can learn more about how Google uses data in this context, and
            opt out of personalised advertising, at{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo hover:underline"
            >
              google.com/settings/ads
            </a>{" "}
            and{" "}
            <a
              href="https://www.aboutads.info/choices"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo hover:underline"
            >
              aboutads.info/choices
            </a>
            .
          </li>
        </ul>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">4. Third-party services</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          This site loads a small number of third-party resources to function:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-body leading-relaxed text-ink">
          <li>
            <strong className="font-semibold text-ink">Vercel Web Analytics &amp; Speed Insights</strong>: used for
            the cookie-less, aggregated analytics described in section 3 above.
          </li>
          <li>
            <strong className="font-semibold text-ink">Google AdSense</strong> (once approved): used to display
            advertising and may set cookies as described above.
          </li>
        </ul>
        <p className="mb-4 text-body leading-relaxed text-ink">
          Each of these third parties operates under its own privacy policy, which we encourage you to review if
          you have concerns about a specific service.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">5. What we don&apos;t do</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-body leading-relaxed text-ink">
          <li>We do not require account creation, sign-up, or login.</li>
          <li>We do not sell personal data to anyone.</li>
          <li>We do not store the financial figures you enter into the calculator.</li>
          <li>We do not share information with third parties beyond the analytics/advertising services described above.</li>
        </ul>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">6. Your rights</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          Depending on your location, you may have rights to access, correct, or request deletion of personal data
          collected about you, and to opt out of personalised advertising. Since this site does not maintain user
          accounts or store personal financial inputs, most of these requests would relate only to analytics or
          advertising cookies, which you can manage through your browser settings or the opt-out links above.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">7. Children&apos;s privacy</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          This site is not directed at children under 13, and we do not knowingly collect personal information
          from children.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">8. Changes to this policy</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          This policy may be updated from time to time, for example as advertising or analytics services are
          added. The &quot;Last updated&quot; date at the top of this page will reflect the most recent revision.
        </p>

        <h2 className="mb-4 mt-11 font-heading text-h2 font-semibold text-ink">9. Contact</h2>
        <p className="mb-4 text-body leading-relaxed text-ink">
          Questions about this policy or how this site handles data can be sent to{" "}
          <a
            href="mailto:sakshamtandon1205@gmail.com"
            className="font-medium text-indigo hover:underline"
          >
            sakshamtandon1205@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
