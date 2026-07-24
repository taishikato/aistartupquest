import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/config"

const ROUTES = [
  "/",
  "/sf",
  "/toronto",
  "/ny",
  "/london",
  "/vancouver",
  "/tokyo",
  "/bengaluru",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl ?? ""
  return ROUTES.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }))
}
