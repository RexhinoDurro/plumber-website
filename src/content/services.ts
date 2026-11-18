export type Service = {
  slug: string;
  title: string;
  short: string;
  body: string;
  jobs: string[];
  photo: string; // id from media.ts
};

export const services: Service[] = [
  {
    slug: "emergency",
    title: "Leaks & emergencies",
    short: "Burst pipe, overflowing toilet, water through the ceiling. We pick up and come out.",
    body: "When water is going where it shouldn't, you need someone who answers the phone. We tell you how to stop the water while we're on our way, then find the cause and fix it properly. No temporary patch that fails next week.",
    jobs: ["Burst and leaking pipes", "Overflowing toilets and cisterns", "Leaks through ceilings", "No water or low pressure"],
    photo: "faucet-repair",
  },
  {
    slug: "drains",
    title: "Blocked drains",
    short: "Sinks, showers, toilets and outside drains cleared, with the cause found.",
    body: "We clear the blockage and tell you why it happened, whether that's grease, roots or a badly laid pipe, so it doesn't keep coming back.",
    jobs: ["Kitchen and bathroom sinks", "Toilets and showers", "Outside gullies and drains", "Slow-draining pipes"],
    photo: "doing-plumbing",
  },
  {
    slug: "bathrooms",
    title: "Bathrooms",
    short: "From a new shower valve to a complete refit, planned and finished on time.",
    body: "We plan the pipework before the tiles go on, so nothing has to be ripped out later. You get a written plan, a fixed price and one person to call.",
    jobs: ["Full bathroom refits", "Showers and shower valves", "Toilets, basins and baths", "Wet rooms"],
    photo: "bathroom",
  },
  {
    slug: "kitchens",
    title: "Kitchens",
    short: "Sinks, taps, dishwashers and washing machines connected without leaks.",
    body: "Whether it's a new tap or the plumbing for a whole new kitchen, we fit it neatly and test every joint before we leave.",
    jobs: ["Sinks and taps", "Dishwasher and washing machine connections", "Water filters", "Waste and trap replacement"],
    photo: "kitchen-tap",
  },
  {
    slug: "heating",
    title: "Heating & boilers",
    short: "Cold radiators, boiler faults and annual services, so the heating works when you need it.",
    body: "We service boilers, balance radiators and track down why one room never gets warm. [TODO: list your gas or heating certifications here.]",
    jobs: ["Boiler servicing and repairs", "Radiator installation and moves", "Power flushing", "Thermostats and controls"],
    photo: "radiator-pipe",
  },
  {
    slug: "pipework",
    title: "New pipework",
    short: "Re-piping, moving pipes for renovations, and outside taps.",
    body: "Renovating? We reroute pipes so your plans work, and leave everything accessible and labelled for whoever comes next.",
    jobs: ["Re-piping old houses", "Moving pipes for renovations", "Outside taps", "Stopcock replacement"],
    photo: "steel-pipes",
  },
];
