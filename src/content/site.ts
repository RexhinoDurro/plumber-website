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
  promise: "A fixed price before we touch a pipe, and we leave the room cleaner than we found it.",
} as const;

export type Testimonial = { quote: string; name: string; place: string; job: string; placeholder: boolean };

/** TODO: replace with real reviews (with the customer's permission). Never publish invented reviews. */
export const testimonials: Testimonial[] = [
  {
    quote: "[Paste a real customer review here — ideally one that mentions a specific job and how it went.]",
    name: "[Customer name]",
    place: "[Area]",
    job: "Emergency leak",
    placeholder: true,
  },
  {
    quote: "[Paste a real customer review here — e.g. about a bathroom refit, price or tidiness.]",
    name: "[Customer name]",
    place: "[Area]",
    job: "Bathroom refit",
    placeholder: true,
  },
  {
    quote: "[Paste a real customer review here — e.g. from a landlord or property manager.]",
    name: "[Customer name]",
    place: "[Area]",
    job: "Boiler service",
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
    q: "Do you clean up afterwards?",
    a: "Always. Dust sheets down before we start, and the room is left as we found it — or cleaner.",
  },
  {
    q: "Do you work for landlords and letting agents?",
    a: "Yes. We can deal with tenants directly, send photos of the finished work and invoice the property owner.",
  },
];
