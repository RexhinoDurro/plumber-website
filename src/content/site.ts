/**
 * Business details. EVERY value marked TODO is a placeholder —
 * replace it with the real business information before going live.
 */
export const site = {
  name: "New York City Emergency Plumbing",
  shortName: "NYC Emergency Plumbing",
  tagline: "Plumbing & heating for homes and rentals",
  city: "New York City", // TODO: your main service area
  phone: "(212) 555-0142", // TODO: real phone number (555-01xx is a fictional placeholder)
  phoneHref: "tel:+12125550142", // TODO: same number, digits only
  // Texting is how many New Yorkers prefer to reach a business. TODO: a number that receives texts.
  smsHref: "sms:+12125550142",
  email: "hello@example.com", // TODO
  address: "[Street address], Queens, NY [ZIP]", // TODO
  timezone: "America/New_York",
  // Opening hours used for the live "Open now" status. Day 0 = Sunday. TODO: match your real hours.
  openingHours: [
    { day: 1, open: "07:30", close: "18:00" },
    { day: 2, open: "07:30", close: "18:00" },
    { day: 3, open: "07:30", close: "18:00" },
    { day: 4, open: "07:30", close: "18:00" },
    { day: 5, open: "07:30", close: "18:00" },
    { day: 6, open: "08:00", close: "14:00" },
  ],
  hours: [
    { days: "Mon – Fri", time: "7:30 AM – 6 PM" }, // TODO
    { days: "Saturday", time: "8 AM – 2 PM" }, // TODO
    { days: "Emergencies", time: "24 / 7" }, // TODO: confirm you offer this
  ],
  // The five boroughs. TODO: remove any you don't cover, or add nearby areas (e.g. "Long Island", "Westchester").
  areas: ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"],
  licence: "NYC Licensed Master Plumber #[LMP NUMBER]", // TODO: your DOB license number
  insurance: "General liability & workers' comp: [ADD INSURER]", // TODO
  founded: "[YEAR]", // TODO
  // Promise used across the site — confirm the owner stands behind it.
  reviewsUrl: "https://www.google.com/maps", // TODO: your Google Business Profile reviews link
  // TODO: your real Google rating, e.g. { value: 4.9, count: 127 }. Stars only show once this is filled in.
  rating: null as { value: number; count: number } | null,
  emergencyArrival: "[60] minutes", // TODO: your honest typical emergency arrival time
  // Shown on the map (Google Maps search). TODO: your town or service-area center.
  mapQuery: "New York, NY",
  // Official license lookup, so customers can check the license themselves (trust signal NYC buyers use).
  licenseLookupUrl: "https://a810-bisweb.nyc.gov/bisweb/LicenseTypeServlet?vlfirst=Y",
  yelpUrl: "https://www.yelp.com", // TODO: your Yelp page (Yelp is widely used in NYC)
  // TODO: only list languages someone on your team really speaks. Shown in the top bar and the chat when more than one.
  languages: ["English"] as string[],
  // TODO: how customers can pay.
  paymentMethods: ["Credit & debit cards", "Apple Pay / Google Pay", "Zelle", "Check"],
  promise: "A fixed price before we touch a pipe, and we leave the room cleaner than we found it.",
};

export type Testimonial = {
  quote: string;
  name: string;
  place: string;
  job: string;
  source: string;
  sourceUrl?: string;
  placeholder: boolean;
};

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
    a: "Call or text us and we'll give you an honest arrival time. Until we arrive, close the main shut-off valve (by the water meter or under the kitchen sink). In an apartment, call your super too: the leak may be coming from above.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes. Our work is done under an NYC Licensed Master Plumber [#LMP NUMBER], the only license that can pull plumbing permits in the five boroughs. You can check it on the Department of Buildings license lookup. [TODO: add the real number and insurer.]",
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
    q: "Can you send a certificate of insurance to my building?",
    a: "Yes, usually the same day. Tell us the management company and we'll send a COI naming the building, managing agent and you as additional insured, before we arrive.",
  },
  {
    q: "Do you work in co-ops and condos?",
    a: "All the time. We follow your building's alteration rules and work hours (usually weekdays 9 to 5 for planned work), protect elevators and hallways, and let the super inspect before walls are closed.",
  },
  {
    q: "Do you work for landlords and property managers?",
    a: "Yes. We deal with tenants directly, send photos of the finished work and invoice the owner. In heat season we prioritize no-heat and no-hot-water calls.",
  },
  {
    q: "How can I pay?",
    a: "Card, Apple Pay or Google Pay, Zelle or check, after the work is tested. [TODO: confirm your payment methods.]",
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
    text: "COI sent to your building before we arrive, tenants handled directly, photos of the finished job and one invoice to you.",
    points: ["COI to management, same day", "No-heat / no-hot-water priority", "Photo report after every job"],
    photo: "apartment-fix",
    cta: "Set up a landlord account",
  },
] as const;

/** Guarantees shown on the home page. TODO: confirm each one; only promise what you honour. */
export const guarantees = [
  { title: "[12]-month workmanship guarantee", text: "If our work fails within the guarantee period, we come back and fix it free of charge." },
  { title: "The price we agree is the price you pay", text: "No hidden extras. If the job changes, we stop and agree the new price with you first." },
  { title: "Clean-up promise", text: "Dust sheets down, old parts removed, the room left as we found it. Or we come back." },
];
/** TODO: add your trade association memberships / certifications (names only until you have their logo files). */
export const accreditations = ["NYC DOB Licensed Master Plumber [#]", "[PHCC or trade association]", "[Con Edison operator-qualified (gas)]", "[Insurance provider]"];

/** "What to expect from us" vs. what too often happens. Only keep rows you can honestly stand behind. */
export const comparison = [
  { topic: "Price", us: "One fixed price, agreed before any work", them: "An hourly rate and a surprise at the end" },
  { topic: "Arrival", us: "A real arrival time, and a text when we set off", them: "\u201cSometime between 8 and 6\u201d" },
  { topic: "Your home", us: "Dust sheets, shoe covers, old parts taken away", them: "You clean up after them" },
  { topic: "Guarantee", us: "Written on the invoice", them: "A verbal promise" },
  { topic: "Paying", us: "After it's tested in front of you", them: "A deposit before anyone turns up" },
  { topic: "Reaching us", us: "Call, or message us here with photos", them: "Voicemail" },
];
