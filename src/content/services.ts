export type Service = {
  slug: string;
  title: string;
  short: string;
  body: string;
  jobs: string[];
  photo: string; // id from media.ts
  video?: string; // id from media.ts with a video
  price: string; // TODO: real typical range, e.g. "$90–$180"
  priceNote: string;
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "emergency",
    title: "Leaks & emergencies",
    short: "Burst pipe, overflowing toilet, water through the ceiling. We pick up and come out.",
    body: "When water is going where it shouldn't, you need someone who answers the phone. We tell you how to stop the water while we're on our way, then find the cause and fix it properly. No temporary patch that fails next week.",
    jobs: ["Burst and leaking pipes", "Overflowing toilets and toilet tanks", "Leaks through ceilings", "No water or low pressure"],
    photo: "faucet-repair",
    price: "[from $—] call-out",
    priceNote: "Most leaks are fixed in one visit; parts extra.",
    faqs: [
      { q: "Do you come out at night and at weekends?", a: "Yes. Our emergency line is answered around the clock. [TODO: confirm your out-of-hours cover and any out-of-hours rate.]" },
      { q: "What should I do before you arrive?", a: "Turn off the water at the main shut-off valve, switch off electrics near the leak, and catch what you can. A photo helps us bring the right parts." },
    ],
    video: "faucet-repair",
  },
  {
    slug: "drains",
    title: "Blocked drains",
    short: "Sinks, showers, toilets and outside drains cleared, with the cause found.",
    body: "We clear the blockage and tell you why it happened, whether that's grease, roots or a badly laid pipe, so it doesn't keep coming back.",
    jobs: ["Kitchen and bathroom sinks", "Toilets and showers", "Outside gullies and drains", "Slow-draining pipes"],
    photo: "doing-plumbing",
    price: "[$— to $—]",
    priceNote: "Depends on access and whether a camera inspection is needed.",
    faqs: [
      { q: "Will you just push the blockage further down?", a: "No. We clear it fully and, where it keeps coming back, inspect the pipe to find the cause." },
      { q: "Can I use drain cleaner first?", a: "Please don't. Chemical cleaners can damage pipes and make the job unsafe to work on." },
    ],
  },
  {
    slug: "bathrooms",
    title: "Bathrooms",
    short: "From a new shower valve to a complete refit, planned and finished on time.",
    body: "We plan the pipework before the tiles go on, so nothing has to be ripped out later. You get a written plan, a fixed price and one person to call.",
    jobs: ["Full bathroom refits", "Showers and shower valves", "Toilets, basins and baths", "Wet rooms"],
    photo: "bathroom",
    price: "[from $—] full refit",
    priceNote: "Fixed price after a free survey. Tiling and fittings quoted separately.",
    faqs: [
      { q: "How long does a bathroom refit take?", a: "It depends on size and layout. You get a written plan with dates before we start. [TODO: add a typical timeframe.]" },
      { q: "Do you handle tiling and electrics too?", a: "We plan the plumbing and coordinate with trusted tilers and electricians, so you have one person to call. [TODO: confirm.]" },
    ],
    video: "brass-shower",
  },
  {
    slug: "kitchens",
    title: "Kitchens",
    short: "Sinks, faucets, dishwashers and washing machines connected without leaks.",
    body: "Whether it's a new faucet or the plumbing for a whole new kitchen, we fit it neatly and test every joint before we leave.",
    jobs: ["Sinks and faucets", "Dishwasher and washing machine connections", "Water filters", "Waste and trap replacement"],
    photo: "kitchen-tap",
    price: "[from $—] per fitting",
    priceNote: "Most connections take under two hours.",
    faqs: [
      { q: "Can you connect my new dishwasher or washing machine?", a: "Yes, including new valves and waste connections where needed. Most connections take under two hours." },
      { q: "Do you supply the faucets and sinks?", a: "We can supply them or fit the ones you've chosen." },
    ],
    video: "kitchen-tap",
  },
  {
    slug: "heating",
    title: "Heating & boilers",
    short: "No heat, banging steam radiators, boiler faults and water heaters, so the building stays warm all winter.",
    body: "Steam and hot-water boilers, radiators that bang or stay cold, and water heaters that can't keep up. In heat season (Oct 1 – May 31) we prioritize buildings with no heat or no hot water. [TODO: list your heating certifications.]",
    jobs: ["Boiler servicing and repairs (steam & hot water)", "Banging or cold radiators", "Water heaters and tankless heaters", "Thermostats and controls"],
    photo: "radiator-pipe",
    price: "[from $—] annual service",
    priceNote: "Repairs priced after diagnosis; parts quoted before fitting.",
    faqs: [
      { q: "How often should a boiler be serviced?", a: "Once a year, ideally before heat season starts on October 1." },
      { q: "Why do my radiators bang?", a: "In steam systems it's usually water trapped in the pipes or a radiator tilted the wrong way. It's fixable, and often cheap." },
      { q: "Why is one radiator always cold?", a: "Usually trapped air, sludge or an unbalanced system. We diagnose it before quoting." },
    ],
  },
  {
    slug: "gas",
    title: "Gas piping & Local Law 152",
    short: "Gas leaks made safe, new gas lines, and the Local Law 152 inspections NYC buildings need every four years.",
    body: "Local Law 152 requires most NYC buildings to have their gas piping inspected by a Licensed Master Plumber every four years. We do the inspection, fix what's needed and file the certification with the DOB. Smell gas right now? Leave the building and call 911 or Con Edison first.",
    jobs: ["Local Law 152 gas piping inspections", "Gas leak repairs and pressure tests", "New gas lines for stoves and dryers", "DOB filings and sign-offs"],
    photo: "steel-pipes",
    price: "[from $—] LL152 inspection",
    priceNote: "Priced by building size and number of meters. Repairs quoted after the inspection.",
    faqs: [
      { q: "Does my building need a Local Law 152 inspection?", a: "Most buildings do, except one- and two-family homes (occupancy group R-3). Your due year depends on your community district." },
      { q: "What if the inspection finds a problem?", a: "We tell you exactly what needs fixing, quote it, and file the certification once it's corrected." },
    ],
  },
  {
    slug: "pipework",
    title: "New pipework",
    short: "Re-piping, moving pipes for renovations, and outdoor spigots.",
    body: "Renovating? We reroute pipes so your plans work, and leave everything accessible and labeled for whoever comes next.",
    jobs: ["Re-piping pre-war buildings", "Moving pipes for renovations", "Outdoor spigots", "Main shut-off valve replacement"],
    photo: "steel-pipes",
    price: "[quoted per job]",
    priceNote: "Priced after a site visit, by run length and access.",
    faqs: [
      { q: "Can you move pipes for a renovation?", a: "Yes. We plan routes with your builder so pipes are accessible and nothing has to be redone later." },
      { q: "Do you replace old lead or galvanized pipes?", a: "Yes. We'll tell you honestly whether replacing is worth it." },
    ],
  },
];

/** Typical price ranges are placeholders: fill them in before going live. Ranges build trust; exact quotes come after a look at the job. */
export const priceFactors = [
  "How easy it is to reach the pipe or fitting",
  "Parts: we quote these before fitting anything",
  "Out-of-hours call-outs (evenings, weekends)",
  "Whether making good (plaster, tiles) is needed afterwards",
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
