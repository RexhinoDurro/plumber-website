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
    id: "gas",
    label: "I smell gas",
    urgency: "Emergency",
    firstStep:
      "Don't touch light switches, flames or appliances. Leave the building first, then call 911 or your gas utility from outside (Con Edison 1-800-75-CONED, National Grid 718-643-4050). Call us once you're safe.",
    causes: ["Leaking gas line or fitting", "Stove or dryer connection", "Failing appliance valve"],
    service: "gas",
  },
  {
    id: "from-above",
    label: "Water coming through the ceiling",
    urgency: "Emergency",
    firstStep:
      "It's usually the apartment above. Call your super or building management right away, keep water away from light fixtures, and take photos for insurance. If it's your own pipe, close your shut-off valve.",
    causes: ["Leak in the apartment above", "Riser or branch pipe leak", "Overflowing tub or failed shower pan"],
    service: "emergency",
  },
  {
    id: "no-heat",
    label: "No heat or no hot water",
    urgency: "Emergency",
    firstStep:
      "Check the boiler or water heater has power and the pilot is lit. Landlords must provide heat from Oct 1 to May 31 and 120°F hot water all year, so tenants should tell the landlord or super first.",
    causes: ["Boiler lockout or low water cutoff", "Failed water heater or thermostat", "Air in the system"],
    service: "heating",
  },
  {
    id: "radiator",
    label: "Radiators banging or cold",
    urgency: "Book soon",
    firstStep: "Steam radiators bang when water is trapped. Make sure the valve is fully open or fully closed, never halfway.",
    causes: ["Radiator tilted the wrong way", "Stuck air vent", "Steam pipe pitch problems"],
    service: "heating",
  },
  {
    id: "leak",
    label: "Water is leaking now",
    urgency: "Emergency",
    firstStep: "Close the main water shut-off valve (usually by the water meter or under the kitchen sink; turn it clockwise). If water is near electrics, switch them off at the breaker panel.",
    causes: ["Burst or split pipe", "Failed joint or fitting", "Overflowing toilet tank or tank"],
    service: "emergency",
  },
  {
    id: "toilet",
    label: "Toilet blocked or overflowing",
    urgency: "Book soon",
    firstStep: "Stop flushing. Turn the small isolation valve behind the toilet clockwise to stop the toilet tank refilling.",
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
    id: "pressure",
    label: "Low water pressure",
    urgency: "Plan ahead",
    firstStep: "Check whether it's every faucet or just one. One faucet usually means a blocked aerator or valve; every faucet points to the supply.",
    causes: ["Partly closed main shut-off valve", "Limescale in fittings", "Leak on the supply pipe"],
    service: "emergency",
  },
  {
    id: "drip",
    label: "Dripping faucet",
    urgency: "Plan ahead",
    firstStep: "Turn the faucet firmly off and close its isolation valve if it has one. A drip wastes a lot of water but isn't urgent.",
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
