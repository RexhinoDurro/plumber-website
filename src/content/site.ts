/**
 * Business details. EVERY value marked TODO is a placeholder —
 * replace it with the real business information before going live.
 */
export const site = {
  name: "Northline Plumbing", // TODO: real business name
  shortName: "Northline",
  tagline: "Plumbing & heating for homes and rentals",
  city: "Your City", // TODO
  phone: "+00 000 000 000", // TODO: real phone number
  phoneHref: "tel:+00000000000", // TODO: same number, digits only
  email: "hello@example.com", // TODO
  address: "Workshop address, Your City", // TODO
  hours: [
    { days: "Mon – Fri", time: "07:30 – 18:00" }, // TODO
    { days: "Saturday", time: "08:00 – 14:00" }, // TODO
    { days: "Emergencies", time: "24 / 7" }, // TODO: confirm you offer this
  ],
  areas: ["City centre", "North district", "Riverside", "Old Town", "East suburbs", "Hillside"], // TODO
  licence: "Licence no. [ADD NUMBER]", // TODO
  insurance: "Public liability insured: [ADD INSURER]", // TODO
  founded: "[YEAR]", // TODO
  // Promise used across the site — confirm the owner stands behind it.
  reviewsUrl: "https://www.google.com/maps", // TODO: your Google Business Profile reviews link
  promise: "A fixed price before we touch a pipe, and we leave the room cleaner than we found it.",
} as const;

export type Testimonial = { quote: string; name: string; place: string; job: string; source: string; placeholder: boolean };

/** TODO: replace with real reviews (with the customer's permission). Never publish invented reviews. */
export const testimonials: Testimonial[] = [
  {
    quote: "[Paste a real customer review here — ideally one that mentions a specific job and how it went.]",
    name: "[Customer name]",
    place: "[Area]",
    job: "Emergency leak",
    source: "Google", // TODO: link to the review
    placeholder: true,
  },
  {
    quote: "[Paste a real customer review here — e.g. about a bathroom refit, price or tidiness.]",
    name: "[Customer name]",
    place: "[Area]",
    job: "Bathroom refit",
    source: "Google",
    placeholder: true,
  },
  {
    quote: "[Paste a real customer review here — e.g. from a landlord or property manager.]",
    name: "[Customer name]",
    place: "[Area]",
    job: "Boiler service",
    source: "Google",
    placeholder: true,
  },
];

export const faqs = [
  {
    q: "Do you give a price before starting?",
    a: "Yes. We look at the job, explain what's wrong and give you a fixed price. If we find something unexpected, we stop and ask before doing any extra work.",
  },
  {
    q: "How fast can you come out for a leak?",
    a: "Call us and we'll give you an honest arrival time on the phone. Until we arrive, turn off the water at the stopcock, usually under the kitchen sink. [TODO: add your typical response time.]",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. [TODO: add licence number and insurer — this answer should show the real details.]",
  },
  {
    q: "How much does a plumber cost?",
    a: "It depends on the job, so we give typical ranges on our Services page and a fixed price once we've seen the problem. You never pay more than the price we agree.",
  },
  {
    q: "Do you clean up afterwards?",
    a: "Always. Dust sheets down before we start, and the room is left as we found it — or cleaner.",
  },
  {
    q: "Do you work for landlords and letting agents?",
    a: "Yes. We can deal with tenants directly, send photos of the finished work and invoice the property owner.",
  },
];

/** Two audiences with different needs (homeowners vs landlords / property managers). */
export const audiences = [
  {
    id: "homeowners",
    title: "For homeowners",
    text: "A leak, a blocked drain or a new bathroom. One person to call, a fixed price, and a clean house when we leave.",
    points: ["Fixed price before work", "Dust sheets and shoe covers", "We test it in front of you"],
    photo: "bathroom",
    cta: "Get a home quote",
  },
  {
    id: "landlords",
    title: "For landlords & property managers",
    text: "We deal with tenants directly, send photos of the finished job and invoice you, not them.",
    points: ["Tenant liaison and access", "Photo report after every job", "One invoice per property"],
    photo: "apartment-fix",
    cta: "Set up a landlord account",
  },
] as const;
