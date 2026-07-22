import type { Metadata } from "next"

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const xProfileUrl = "https://x.com/aistartupquest"

export const pageTitle = "AI Startup Map: Explore AI Native Startups"

export const pageDescription =
  "Explore AI events and AI-native startups across San Francisco, Toronto, New York, London, Vancouver, and Tokyo on an interactive pixel-art quest map."

export const ogImage = {
  url: "/ogp-ai-startup-map.png",
  width: 1367,
  height: 768,
  alt: "AI Startup Quest pixel-art key visual",
} as const

export const sfOgImage = {
  url: "/ogp-sf-ai-startup-map.png",
  width: 1200,
  height: 630,
  alt: "AI Startup Quest pixel-art key visual",
} as const

export function buildPageMetadata({
  title,
  description,
  path,
  image = ogImage,
}: {
  title: string
  description: string
  path: string
  image?: typeof ogImage | typeof sfOgImage
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      siteName: "AI Startup Quest",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  } satisfies Metadata
}
