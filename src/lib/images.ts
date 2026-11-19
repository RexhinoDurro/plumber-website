import { API_URL } from "./api";

/**
 * Can Next resize this image? Yes for our own photos in /public, dashboard uploads on the backend and the Pexels
 * stock photos (all allowed in next.config.ts). Anything else is shown as-is.
 */
export const canOptimize = (src: string) =>
  src.startsWith("/") || src.startsWith(`${API_URL}/media/`) || src.startsWith("https://images.pexels.com/");
