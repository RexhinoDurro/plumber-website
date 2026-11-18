/** Symptom-first triage: what the homeowner sees → how urgent, what to do now, which service. */
export type Urgency = "Emergency" | "Book soon" | "Plan ahead";

export type Problem = {
  id: string;
  label: string;
  urgency: Urgency;
  firstStep: string;
  causes: string[];
  service: string; // slug in services.ts
};

export const problems: Problem[] = [
  {
    id: "leak",
    label: "Water is leaking now",
    urgency: "Emergency",
    firstStep: "Turn off the stopcock (usually under the kitchen sink, turn clockwise). If water is near electrics, switch them off at the fuse box.",
    causes: ["Burst or split pipe", "Failed joint or fitting", "Overflowing cistern or tank"],
    service: "emergency",
  },
  {
    id: "toilet",
    label: "Toilet blocked or overflowing",
    urgency: "Book soon",
    firstStep: "Stop flushing. Turn the small isolation valve behind the toilet clockwise to stop the cistern refilling.",
    causes: ["Blockage in the pan or soil pipe", "Faulty fill valve", "Blocked outside drain"],
    service: "drains",
  },
  {
    id: "drain",
    label: "Sink or shower draining slowly",
    urgency: "Book soon",
    firstStep: "Avoid chemical drain cleaners; they can damage pipes and make the job unsafe for us. Hot water and a plunger are fine.",
    causes: ["Grease or hair build-up", "Blocked trap", "Badly sloped waste pipe"],
    service: "drains",
  },
  {
    id: "no-heat",
    label: "No heating or hot water",
    urgency: "Book soon",
    firstStep: "Check the boiler pressure gauge (usually 1–1.5 bar) and the thermostat. Note any fault code on the display before you call.",
    causes: ["Low boiler pressure", "Faulty thermostat or controls", "Boiler fault"],
    service: "heating",
  },
  {
    id: "cold-radiator",
    label: "Radiators cold in places",
    urgency: "Plan ahead",
    firstStep: "Bleed the radiator with a radiator key while the heating is off, then re-check the boiler pressure.",
    causes: ["Trapped air", "Sludge in the system", "System needs balancing"],
    service: "heating",
  },
  {
    id: "pressure",
    label: "Low water pressure",
    urgency: "Plan ahead",
    firstStep: "Check whether it's every tap or just one. One tap usually means a blocked aerator or valve; every tap points to the supply.",
    causes: ["Partly closed stopcock", "Limescale in fittings", "Leak on the supply pipe"],
    service: "emergency",
  },
  {
    id: "drip",
    label: "Dripping tap",
    urgency: "Plan ahead",
    firstStep: "Turn the tap firmly off and close its isolation valve if it has one. A drip wastes a lot of water but isn't urgent.",
    causes: ["Worn washer or cartridge", "Damaged valve seat"],
    service: "kitchens",
  },
  {
    id: "renovation",
    label: "Planning a new bathroom or kitchen",
    urgency: "Plan ahead",
    firstStep: "Send us a rough layout or a few photos of the room. We'll plan the pipework before anything is tiled.",
    causes: ["New layout needs pipes moved", "Old pipework worth replacing while walls are open"],
    service: "bathrooms",
  },
];
