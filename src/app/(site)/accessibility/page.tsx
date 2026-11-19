import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: `How we make the ${site.name} website usable for everyone, and how to tell us if something gets in your way.`,
};

export default function AccessibilityPage() {
  return (
    <section className="section">
      <div className="wrap grid max-w-[68ch] gap-6">
        <p className="label">Accessibility statement</p>
        <h1>Everyone should be able to book a plumber here.</h1>
        <p>
          We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. The site works with a keyboard alone, with screen
          readers (VoiceOver, TalkBack, NVDA), with text zoomed to 200%, and with motion and video turned off when your device asks for less
          motion or is saving data.
        </p>
        <h2 className="text-2xl">What we do</h2>
        <ul className="grid list-disc gap-2 pl-5">
          <li>Text and buttons meet AA contrast, and every form field has a visible label and a clear error message.</li>
          <li>Every photo that carries meaning has a description; decorative video is hidden from screen readers.</li>
          <li>The phone number, text link and chat are on every page, so you can reach us the way that works for you.</li>
          <li>We test new pages with automated checks (axe) and by hand with a keyboard and a screen reader.</li>
        </ul>
        <h2 className="text-2xl">If something gets in your way</h2>
        <p>
          Tell us and we&apos;ll fix it, and help you in the meantime by phone, text or email. Call{" "}
          <a href={site.phoneHref}>{site.phone}</a>, text <a href={site.smsHref}>{site.phone}</a> or email{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>. We reply within two business days.
        </p>
        <p className="text-[0.95rem] text-muted">Last reviewed November 2026.</p>
      </div>
    </section>
  );
}
