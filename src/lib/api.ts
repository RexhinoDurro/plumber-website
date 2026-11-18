/** Where the Django backend lives. Set NEXT_PUBLIC_API_URL in production. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const WS_URL = API_URL.replace(/^http/, "ws");

export type ApiMedia = {
  id: number;
  title: string;
  alt: string;
  category: "Repairs" | "Bathrooms" | "Kitchens" | "Heating" | "Pipework";
  kind: "image" | "video";
  src: string;
  video: string | null;
  credit: string;
  creditUrl: string;
  featured: boolean;
};

export type ApiReview = {
  id: number;
  name: string;
  place: string;
  job: string;
  quote: string;
  rating: number;
  source: string;
  source_url: string;
};
