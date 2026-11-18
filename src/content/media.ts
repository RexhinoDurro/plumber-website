/**
 * Photos and video. These are free-to-use Pexels placeholders
 * (https://www.pexels.com/license/) — replace them with photos of your own jobs.
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
};

const photo = (id: number, file: string, w = 1600) =>
  `https://images.pexels.com/photos/${id}/${file}?auto=compress&cs=tinysrgb&w=${w}`;
const still = (id: number, slug: string) =>
  `https://images.pexels.com/videos/${id}/${slug}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200`;

export const hero = {
  video: "https://videos.pexels.com/video-files/9890448/9890448-hd_1280_720_30fps.mp4",
  poster: still(9890448, "leak-plumbing-repair-tools-9890448"),
  credit: "Alejandro Torres",
  creditUrl: "https://www.pexels.com/video/close-up-of-plumber-repairing-faucet-9890448/",
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

export type BgVideo = (typeof videos)[keyof typeof videos];

export const photos: Photo[] = [
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
    alt: "Close-up of a plumber repairing a leaking tap",
    category: "Repairs",
    title: "Leaking tap repair",
    credit: "Alejandro Torres",
    creditUrl: "https://www.pexels.com/video/close-up-of-plumber-repairing-faucet-9890448/",
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
  },
  {
    id: "doing-plumbing",
    src: still(7584762, "pexels-photo-7584762"),
    alt: "Plumber working on pipes under a basin",
    category: "Repairs",
    title: "Under-basin repair",
    credit: "Stepan SK",
    creditUrl: "https://www.pexels.com/video/a-person-doing-plumbing-7584762/",
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
    alt: "Water running from a kitchen tap",
    category: "Kitchens",
    title: "New kitchen tap",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/water-flowing-from-a-faucet-6356430/",
  },
  {
    id: "gloves-tools",
    src: still(9890453, "leak-plumbing-repair-tools-9890453"),
    alt: "Plumber putting on gloves beside a set of plumbing tools",
    category: "Repairs",
    title: "Ready for the job",
    credit: "Alejandro Torres",
    creditUrl: "https://www.pexels.com/video/plumbing-tools-and-plumber-putting-on-gloves-9890453/",
  },
  {
    id: "shower-flow",
    src: still(15887131, "pexels-photo-15887131"),
    alt: "Water flowing from a rain shower head",
    category: "Bathrooms",
    title: "Shower pressure fixed",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/water-flowing-from-a-shower-head-15887131/",
  },
  {
    id: "apartment-fix",
    src: still(7647713, "agent-apartment-biracial-boxes-7647713"),
    alt: "Tradesman fixing a fitting inside an apartment",
    category: "Repairs",
    title: "Rental flat call-out",
    credit: "Anastasia Shuraeva",
    creditUrl: "https://www.pexels.com/video/a-man-fixing-an-object-inside-the-apartment-7647713/",
  },
  {
    id: "wrench-wall",
    src: still(8488162, "antique-architecture-art-black-woman-8488162"),
    alt: "Plumber's wrench hanging on a workshop wall",
    category: "Pipework",
    title: "The workshop",
    credit: "Kindel Media",
    creditUrl: "https://www.pexels.com/video/plumbers-wrench-hanged-on-wall-8488162/",
  },
  {
    id: "dripping-tap",
    src: still(9200530, "candid-slow-motion-video-slow-mo-slow-motion-slow-motion-water-drop-9200530"),
    alt: "Close-up of a dripping tap",
    category: "Repairs",
    title: "Dripping tap",
    credit: "vinod kashyap",
    creditUrl: "https://www.pexels.com/video/water-dropping-from-a-faucet-9200530/",
  },
  {
    id: "shower-head",
    src: still(19227389, "pexels-photo-19227389"),
    alt: "Shower head mounted in a bathroom",
    category: "Bathrooms",
    title: "Shower head upgrade",
    credit: "Curtis Adams",
    creditUrl: "https://www.pexels.com/video/a-shower-head-is-shown-in-a-bathroom-19227389/",
  },
];

export const byId = (id: string) => {
  const p = photos.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown photo ${id}`);
  return p;
};

export const categories: Category[] = ["Repairs", "Bathrooms", "Kitchens", "Heating", "Pipework"];
