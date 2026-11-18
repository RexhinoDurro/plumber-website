import { site, faqs } from "@/content/site";

/**
 * Structured data for search engines and AI answers.
 * TODO: set NEXT_PUBLIC_SITE_URL and replace placeholder business details in site.ts before launch;
 * these values must match your Google Business Profile exactly.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function BusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    name: site.name,
    url: siteUrl,
    telephone: site.phone,
    email: site.email,
    image: `${siteUrl}/opengraph-image`,
    address: { "@type": "PostalAddress", streetAddress: site.address, addressLocality: site.city },
    areaServed: site.areas.map((a) => ({ "@type": "Place", name: `${a}, ${site.city}` })),
    openingHoursSpecification: site.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayNames[h.day],
      opens: h.open,
      closes: h.close,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FaqJsonLd({ items = faqs }: { items?: readonly { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function ServiceJsonLd({ name, description, slug }: { name: string; description: string; slug: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name,
    description,
    url: `${siteUrl}/services/${slug}`,
    provider: { "@type": "Plumber", name: site.name, telephone: site.phone },
    areaServed: site.areas.map((a) => ({ "@type": "Place", name: `${a}, ${site.city}` })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
