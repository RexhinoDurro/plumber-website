/**
 * Two kinds of media:
 * - `work`: photos of OUR OWN jobs (in /public/work). These are the gallery and the home page "Recent work".
 * - everything else (hero video, page photos, video bands): free Pexels stock, used under the Pexels License
 *   (https://www.pexels.com/license/): free for commercial use, editing allowed, no credit required, so none is
 *   shown on the site. The credit fields below are only a record of where each one came from. Never presented as our own jobs. Swap any of them for your own photos whenever you like.
 */
export type Category = "Repairs" | "Bathrooms" | "Kitchens" | "Heating" | "Pipework";

export type Photo = {
  id: string;
  src: string;
  alt: string;
  category: Category;
  title: string;
  credit: string;
  creditUrl: string;
  video?: string; // MP4 — tiles with a video play it in the viewer
  /** CSS object-position: which part of the photo to keep when it's cropped. */
  focus?: string;
};

const photo = (id: number, file: string, w = 1600) =>
  `https://images.pexels.com/photos/${id}/${file}?auto=compress&cs=tinysrgb&w=${w}`;
const still = (id: number, slug: string) =>
  `https://images.pexels.com/videos/${id}/${slug}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200`;

export const hero = {
  // A plumber at work under a kitchen sink (Pexels, free to use).
  video: "https://videos.pexels.com/video-files/7584858/7584858-hd_1920_1080_25fps.mp4",
  poster: still(7584858, "pexels-photo-7584858"),
  credit: "Stepan SK",
  creditUrl: "https://www.pexels.com/video/man-fixing-the-faucet-on-the-kitchen-sink-7584858/",
};

/** Background videos for full-bleed bands (Pexels, free to use). */
export const videos = {
  shower: {
    src: "https://videos.pexels.com/video-files/15887131/15887131-hd_1280_720_30fps.mp4",
    poster: still(15887131, "pexels-photo-15887131"),
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/water-flowing-from-a-shower-head-15887131/",
  },
  gloves: {
    src: "https://videos.pexels.com/video-files/9890453/9890453-hd_1920_1080_30fps.mp4",
    poster: still(9890453, "leak-plumbing-repair-tools-9890453"),
    credit: "Alejandro Torres",
    creditUrl: "https://www.pexels.com/video/plumbing-tools-and-plumber-putting-on-gloves-9890453/",
  },
  tap: {
    src: "https://videos.pexels.com/video-files/6356430/6356430-hd_1280_720_24fps.mp4",
    poster: still(6356430, "pexels-photo-6356430"),
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/water-flowing-from-a-faucet-6356430/",
  },
  drip: {
    src: "https://videos.pexels.com/video-files/9200530/9200530-hd_1920_1080_30fps.mp4",
    poster: still(9200530, "candid-slow-motion-video-slow-mo-slow-motion-slow-motion-water-drop-9200530"),
    credit: "vinod kashyap",
    creditUrl: "https://www.pexels.com/video/water-dropping-from-a-faucet-9200530/",
  },
} as const;

export type BgVideo = { src: string; poster: string; credit: string; creditUrl: string };

export type Clip = { src: string; poster: string; credit: string; creditUrl: string };
const clip = (id: number, file: string, posterSlug: string, credit: string, page: string): Clip => ({
  src: `https://videos.pexels.com/video-files/${id}/${file}`,
  poster: still(id, posterSlug),
  credit,
  creditUrl: `https://www.pexels.com/video/${page}-${id}/`,
});

/**
 * Background videos for the top of each page, picked to match that page's topic (Pexels, free to use).
 * They play muted and looped, and are skipped on data saver, slow connections and "reduce motion".
 */
export const clips = {
  waterTowers: clip(39776403, "16962288_640_360_24fps.mp4", "pexels-photo-39776403", "AP Vibes", "urban-rooftop-view-with-water-towers"),
  nycSkyline: clip(11422401, "11422401-hd_1920_1080_60fps.mp4", "pexels-photo-11422401", "Djordje Vanjek", "skyscrapers-in-new-york"),
  pipeDrip: clip(5571839, "5571839-hd_1280_720_24fps.mp4", "pexels-photo-5571839", "Monsieur Sylvain", "water-dripping-on-welded-metal-pipes"),
  faucetRepair: clip(9890448, "9890448-hd_1280_720_30fps.mp4", "leak-plumbing-repair-tools-9890448", "Alejandro Torres", "close-up-of-plumber-repairing-faucet"),
  dripRepair: clip(9890452, "9890452-hd_1920_1080_30fps.mp4", "leak-plumbing-repair-tools-9890452", "Alejandro Torres", "close-up-of-person-fixing-dripping-faucet"),
  gloves: clip(9890453, "9890453-hd_1920_1080_30fps.mp4", "leak-plumbing-repair-tools-9890453", "Alejandro Torres", "plumbing-tools-and-plumber-putting-on-gloves"),
  sinkLeak: clip(32711364, "13945105_640_360_30fps.mp4", "pexels-photo-32711364", "Zulfugar Karimov", "leakage-problem-in-modern-kitchen-sink"),
  sinkDrain: clip(4064321, "4064321-hd_1920_1080_25fps.mp4", "pexels-photo-4064321", "Rob Cot", "kitchen-sink-cooking-water-flow-basin-metal-bubble"),
  bathroomWater: clip(14495995, "14495995-hd_1920_1080_30fps.mp4", "pexels-photo-14495995", "Curtis Adams", "flowing-water-in-bathroom"),
  kitchenFaucet: clip(6356430, "6356430-hd_1280_720_24fps.mp4", "pexels-photo-6356430", "Curtis Adams", "water-flowing-from-a-faucet"),
  gasStove: clip(8093760, "8093760-hd_1920_1080_25fps.mp4", "blue-fire-fire-gas-gas-stove-8093760", "Etoile", "close-up-video-of-a-gas-stove"),
} as const;

export type ClipName = keyof typeof clips;

/** Stock photos (Pexels) used around the site. Not shown in the gallery. */
export const photos: Photo[] = [
  {
    id: "gas-stove",
    src: still(8093760, "blue-fire-fire-gas-gas-stove-8093760"),
    alt: "Blue flame on a gas stove burner",
    category: "Pipework",
    title: "Gas stove burner",
    credit: "Etoile",
    creditUrl: "https://www.pexels.com/video/close-up-video-of-a-gas-stove-8093760/",
  },
  {
    id: "steel-pipes",
    src: photo(6419128, "pexels-photo-6419128.jpeg"),
    alt: "Plumber's hands fitting a run of steel pipes indoors",
    category: "Pipework",
    title: "New pipe run",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/6419128/",
  },
  {
    id: "faucet-repair",
    src: still(9890448, "leak-plumbing-repair-tools-9890448"),
    alt: "Close-up of a plumber repairing a leaking faucet",
    category: "Repairs",
    title: "Leaking faucet repair",
    credit: "Alejandro Torres",
    creditUrl: "https://www.pexels.com/video/close-up-of-plumber-repairing-faucet-9890448/",
    video: "https://videos.pexels.com/video-files/9890448/9890448-hd_1280_720_30fps.mp4",
  },
  {
    id: "radiator-pipe",
    src: photo(29226620, "pexels-photo-29226620/free-photo-of-professional-plumber-installing-a-radiator-pipe.jpeg"),
    alt: "Plumber connecting a radiator pipe with specialist tools",
    category: "Heating",
    title: "Radiator connection",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/29226620/",
  },
  {
    id: "brass-shower",
    src: still(19228418, "pexels-photo-19228418"),
    alt: "Brass shower head and hand shower on a tiled wall",
    category: "Bathrooms",
    title: "Brass shower fit-out",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/a-shower-head-with-a-brass-finish-and-a-hand-held-shower-head-19228418/",
    video: "https://videos.pexels.com/video-files/19228418/19228418-hd_1280_720_30fps.mp4",
  },
  {
    id: "boiler-adjust",
    src: photo(7859953, "pexels-photo-7859953.jpeg"),
    alt: "Hands adjusting the controls of a boiler system",
    category: "Heating",
    title: "Boiler service",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/7859953/",
  },
  {
    id: "kitchen-sink-leak",
    src: still(32711364, "pexels-photo-32711364"),
    alt: "Water leaking under a modern kitchen sink",
    category: "Kitchens",
    title: "Kitchen sink leak",
    credit: "Zulfugar Karimov",
    creditUrl: "https://www.pexels.com/video/leakage-problem-in-modern-kitchen-sink-32711364/",
    video: "https://videos.pexels.com/video-files/32711364/13945105_640_360_30fps.mp4",
  },
  {
    id: "spanner",
    src: "https://images.pexels.com/photos/16509869/pexels-photo-16509869/free-photo-of-close-up-of-man-using-a-spanner.jpeg?auto=compress&w=1600",
    alt: "Worker tightening a pipe fitting with a spanner",
    category: "Pipework",
    title: "Fittings tightened",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/16509869/",
  },
  {
    id: "bathroom",
    src: still(19228176, "pexels-photo-19228176"),
    alt: "Finished modern bathroom with shower",
    category: "Bathrooms",
    title: "Bathroom refit",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/a-bathroom-at-the-person-19228176/",
    video: "https://videos.pexels.com/video-files/19228176/19228176-hd_1920_1080_30fps.mp4",
  },
  {
    id: "doing-plumbing",
    src: still(7584762, "pexels-photo-7584762"),
    alt: "Plumber working on pipes under a basin",
    category: "Repairs",
    title: "Under-basin repair",
    credit: "Stepan SK",
    creditUrl: "https://www.pexels.com/video/a-person-doing-plumbing-7584762/",
    video: "https://videos.pexels.com/video-files/7584762/7584762-hd_1280_720_25fps.mp4",
  },
  {
    id: "pressure-gauge",
    src: photo(7937300, "pexels-photo-7937300.jpeg"),
    alt: "Pressure gauge on a set of steel heating pipes",
    category: "Heating",
    title: "Pressure check",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/7937300/",
  },
  {
    id: "kitchen-tap",
    src: still(6356430, "pexels-photo-6356430"),
    alt: "Water running from a kitchen faucet",
    category: "Kitchens",
    title: "New kitchen faucet",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/water-flowing-from-a-faucet-6356430/",
    video: "https://videos.pexels.com/video-files/6356430/6356430-hd_1280_720_24fps.mp4",
  },
  {
    id: "gloves-tools",
    src: still(9890453, "leak-plumbing-repair-tools-9890453"),
    alt: "Plumber putting on gloves beside a set of plumbing tools",
    category: "Repairs",
    title: "Ready for the job",
    credit: "Alejandro Torres",
    creditUrl: "https://www.pexels.com/video/plumbing-tools-and-plumber-putting-on-gloves-9890453/",
    video: "https://videos.pexels.com/video-files/9890453/9890453-hd_1920_1080_30fps.mp4",
  },
  {
    id: "shower-flow",
    src: still(15887131, "pexels-photo-15887131"),
    alt: "Water flowing from a rain shower head",
    category: "Bathrooms",
    title: "Shower pressure fixed",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/water-flowing-from-a-shower-head-15887131/",
    video: "https://videos.pexels.com/video-files/15887131/15887131-hd_1280_720_30fps.mp4",
  },
  {
    id: "apartment-fix",
    src: still(7647713, "agent-apartment-biracial-boxes-7647713"),
    alt: "Tradesman fixing a fitting inside an apartment",
    category: "Repairs",
    title: "Rental apartment call-out",
    credit: "Anastasia Shuraeva",
    creditUrl: "https://www.pexels.com/video/a-man-fixing-an-object-inside-the-apartment-7647713/",
    video: "https://videos.pexels.com/video-files/7647713/7647713-hd_1280_720_24fps.mp4",
  },
  {
    id: "wrench-wall",
    src: still(8488162, "antique-architecture-art-black-woman-8488162"),
    alt: "Plumber's wrench hanging on a workshop wall",
    category: "Pipework",
    title: "The workshop",
    credit: "Kindel Media",
    creditUrl: "https://www.pexels.com/video/plumbers-wrench-hanged-on-wall-8488162/",
    video: "https://videos.pexels.com/video-files/8488162/8488162-hd_1920_1080_30fps.mp4",
  },
  {
    id: "dripping-tap",
    src: still(9200530, "candid-slow-motion-video-slow-mo-slow-motion-slow-motion-water-drop-9200530"),
    alt: "Close-up of a dripping faucet",
    category: "Repairs",
    title: "Dripping faucet",
    credit: "vinod kashyap",
    creditUrl: "https://www.pexels.com/video/water-dropping-from-a-faucet-9200530/",
    video: "https://videos.pexels.com/video-files/9200530/9200530-hd_1920_1080_30fps.mp4",
  },
  {
    id: "shower-head",
    src: still(19227389, "pexels-photo-19227389"),
    alt: "Shower head mounted in a bathroom",
    category: "Bathrooms",
    title: "Shower head upgrade",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/a-shower-head-is-shown-in-a-bathroom-19227389/",
    video: "https://videos.pexels.com/video-files/19227389/19227389-hd_1280_720_30fps.mp4",
  },
];

const ours = (
  id: string,
  title: string,
  category: Category,
  alt: string,
  focus?: string,
): Photo => ({ id, src: `/work/${id}.jpg`, title, category, alt, focus, credit: "", creditUrl: "" });

/** Photos of our own jobs: the gallery and the home page "Recent work". */
export const work: Photo[] = [
  ours(
    "bathroom-remodel",
    "Small bathroom remodel",
    "Bathrooms",
    "Finished small bathroom with gray textured tile, an open shower with a matte black rain head and a wall niche, a wall-hung oak vanity, a one-piece toilet and a lit mirror cabinet",
    "50% 55%",
  ),
  ours(
    "kitchen-high-rise",
    "Kitchen sink & drinking-water faucet",
    "Kitchens",
    "Stainless steel double sink with a pull-down faucet and a separate drinking-water faucet in a high-rise kitchen overlooking Manhattan",
    "50% 30%",
  ),
  ours(
    "boiler-install",
    "High-efficiency boiler install",
    "Heating",
    "Wall-hung high-efficiency boiler with PVC venting, insulated heating pipes, circulator pumps, zone valves and an expansion tank in a basement",
    "50% 40%",
  ),
  ours(
    "water-heaters",
    "Building water heater & storage tank",
    "Heating",
    "Commercial gas water heater next to a hot-water storage tank, with an expansion tank and new copper piping in a building's mechanical room",
    "50% 50%",
  ),
  ours(
    "backflow-preventer",
    "Backflow preventer install",
    "Pipework",
    "New brass backflow preventer with test cocks, fitted on the copper water service in a basement",
    "50% 45%",
  ),
  ours(
    "bathroom-rough-in",
    "Bathroom rough-in",
    "Pipework",
    "Bathroom opened to the studs: cast-iron drain stack, new copper supply lines with shut-off valves and a shower valve roughed in",
    "50% 60%",
  ),
  ours(
    "shower-valve",
    "Shower valve replacement",
    "Repairs",
    "New shower mixing valve on copper supply lines, fitted through a small opening in a plaster wall",
    "50% 55%",
  ),
  ours(
    "sump-pumps",
    "Sump pumps with battery backup",
    "Repairs",
    "Main and backup sump pumps in a basement pit with PVC discharge piping and a battery backup system",
    "50% 80%",
  ),
  ours(
    "crawlspace-drain",
    "Crawl space drain line",
    "Pipework",
    "New white PVC drain line run through a crawl space and connected to the existing cast-iron pipe",
    "50% 40%",
  ),
];

/** The "watch a job" video on the home page. */
export const showcase = {
  src: "https://videos.pexels.com/video-files/7584762/7584762-hd_1280_720_25fps.mp4",
  poster: still(7584762, "pexels-photo-7584762"),
  title: "Under-basin repair, start to finish",
  credit: "Stepan SK",
  creditUrl: "https://www.pexels.com/video/a-person-doing-plumbing-7584762/",
};

export const byId = (id: string) => {
  const p = photos.find((x) => x.id === id) ?? work.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown photo ${id}`);
  return p;
};

export const categories: Category[] = ["Repairs", "Bathrooms", "Kitchens", "Heating", "Pipework"];
