export const COMPANY_CATEGORIES = [
  "Core Labs",
  "Consumer AI",
  "Devtools",
  "Infra",
  "Agents",
  "Vertical AI",
] as const

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number]

export const FEATURED_TIERS = ["core", "hot", "scene"] as const

export type FeaturedTier = (typeof FEATURED_TIERS)[number]

export type Company = {
  slug: string
  name: string
  website: string
  shortDescription: string
  whyItMatters: string
  category: CompanyCategory
  neighborhood: string
  coordinates: [number, number]
  founded: number
  featuredTier: FeaturedTier
}

export function getCompanyMonogram(company: Company) {
  if (company.name === "11x") {
    return "11"
  }

  const parts = company.name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return company.name.slice(0, 2).toUpperCase()
}

export function getCompanyDomain(company: Company) {
  return new URL(company.website).hostname
}

export function getCompanyLogoUrl(company: Company) {
  const domain = getCompanyDomain(company)

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

// Curated, not exhaustive: these companies are chosen to make the current
// San Francisco AI scene legible and enjoyable to browse in a map format.
export const COMPANIES: Company[] = [
  {
    slug: "openai",
    name: "OpenAI",
    website: "https://openai.com",
    shortDescription: "Frontier AI lab behind ChatGPT and a huge share of the current AI wave.",
    whyItMatters: "The obvious anchor on any map of modern SF AI.",
    category: "Core Labs",
    neighborhood: "Mission Bay",
    coordinates: [-122.3968, 37.7897],
    founded: 2015,
    featuredTier: "core",
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    website: "https://www.anthropic.com",
    shortDescription: "Claude-maker focused on frontier models, safety, and serious product adoption.",
    whyItMatters: "If OpenAI is one pole of SF AI, Anthropic is the other.",
    category: "Core Labs",
    neighborhood: "Financial District",
    coordinates: [-122.4007, 37.7895],
    founded: 2021,
    featuredTier: "core",
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    website: "https://www.perplexity.ai",
    shortDescription: "Answer engine with a strong consumer feel and nonstop mindshare.",
    whyItMatters: "One of the clearest consumer-facing AI stories to come out of SF.",
    category: "Consumer AI",
    neighborhood: "Financial District",
    coordinates: [-122.4019, 37.7921],
    founded: 2022,
    featuredTier: "core",
  },
  {
    slug: "cursor",
    name: "Cursor",
    website: "https://cursor.com",
    shortDescription: "AI coding tool that helped define the vibe of the current builder scene.",
    whyItMatters: "Probably the most culturally visible devtool in the current wave.",
    category: "Devtools",
    neighborhood: "SoMa",
    coordinates: [-122.4089, 37.7825],
    founded: 2022,
    featuredTier: "core",
  },
  {
    slug: "scale-ai",
    name: "Scale AI",
    website: "https://scale.com",
    shortDescription: "Data, evaluation, and enterprise infrastructure for training and deploying AI.",
    whyItMatters: "Too central to the SF AI ecosystem to leave off the map.",
    category: "Infra",
    neighborhood: "Dogpatch",
    coordinates: [-122.3871, 37.7823],
    founded: 2016,
    featuredTier: "core",
  },
  {
    slug: "baseten",
    name: "Baseten",
    website: "https://www.baseten.com",
    shortDescription: "Inference platform for shipping AI products fast with production-ready performance.",
    whyItMatters: "A strong infra name with builder credibility and a sharp product story.",
    category: "Infra",
    neighborhood: "SoMa",
    coordinates: [-122.4056, 37.7817],
    founded: 2019,
    featuredTier: "core",
  },
  {
    slug: "harvey",
    name: "Harvey",
    website: "https://www.harvey.ai",
    shortDescription: "Legal AI company building one of the clearest vertical AI success stories.",
    whyItMatters: "Shows how much of SF AI is about real workflows, not just foundation models.",
    category: "Vertical AI",
    neighborhood: "Jackson Square",
    coordinates: [-122.4011, 37.7964],
    founded: 2022,
    featuredTier: "hot",
  },
  {
    slug: "decagon",
    name: "Decagon",
    website: "https://decagon.ai",
    shortDescription: "AI agents for customer experience and support teams at enterprise scale.",
    whyItMatters: "A very current example of the AI agent wave turning into product reality.",
    category: "Agents",
    neighborhood: "SoMa",
    coordinates: [-122.4029, 37.7856],
    founded: 2023,
    featuredTier: "hot",
  },
  {
    slug: "langfuse",
    name: "Langfuse",
    website: "https://langfuse.com",
    shortDescription: "Open-source LLM engineering and observability platform for teams shipping AI features.",
    whyItMatters: "Represents the practical tooling layer behind modern AI apps.",
    category: "Devtools",
    neighborhood: "SoMa",
    coordinates: [-122.4002, 37.7847],
    founded: 2022,
    featuredTier: "hot",
  },
  {
    slug: "replit",
    name: "Replit",
    website: "https://replit.com",
    shortDescription: "Cloud coding environment leaning hard into AI-assisted software creation.",
    whyItMatters: "A familiar builder product that bridges mainstream and frontier developer audiences.",
    category: "Devtools",
    neighborhood: "North Beach",
    coordinates: [-122.4033, 37.7999],
    founded: 2016,
    featuredTier: "scene",
  },
  {
    slug: "notion",
    name: "Notion",
    website: "https://www.notion.so",
    shortDescription: "Workspace product with an AI layer that shapes how many people work every day.",
    whyItMatters: "Not a tiny startup, but too influential in SF AI product culture to ignore.",
    category: "Vertical AI",
    neighborhood: "Mission District",
    coordinates: [-122.4064, 37.7597],
    founded: 2013,
    featuredTier: "scene",
  },
  {
    slug: "11x",
    name: "11x",
    website: "https://11x.ai",
    shortDescription: "AI digital workers aimed at automating revenue and go-to-market operations.",
    whyItMatters: "One of the companies people point to when they talk about the agent economy.",
    category: "Agents",
    neighborhood: "SoMa",
    coordinates: [-122.4078, 37.784],
    founded: 2022,
    featuredTier: "hot",
  },
  {
    slug: "pika",
    name: "Pika",
    website: "https://pika.art",
    shortDescription: "Idea-to-video product making generative media feel playful and immediate.",
    whyItMatters: "A friendlier, creator-facing side of the SF AI scene.",
    category: "Consumer AI",
    neighborhood: "Mission District",
    coordinates: [-122.4191, 37.7593],
    founded: 2023,
    featuredTier: "hot",
  },
  {
    slug: "hedra",
    name: "Hedra",
    website: "https://www.hedra.com",
    shortDescription: "Generative media platform focused on expressive AI characters and video creation.",
    whyItMatters: "Captures the current energy around multimodal creative tools.",
    category: "Consumer AI",
    neighborhood: "Hayes Valley",
    coordinates: [-122.4244, 37.7767],
    founded: 2023,
    featuredTier: "hot",
  },
  {
    slug: "cartesia",
    name: "Cartesia",
    website: "https://cartesia.ai",
    shortDescription: "Real-time multimodal intelligence for on-device and voice-heavy experiences.",
    whyItMatters: "A strong signal that voice and low-latency AI are part of the SF stack.",
    category: "Infra",
    neighborhood: "SoMa",
    coordinates: [-122.4106, 37.7812],
    founded: 2023,
    featuredTier: "hot",
  },
  {
    slug: "adept",
    name: "Adept",
    website: "https://www.adept.ai",
    shortDescription: "Applied research company working on AI systems that take actions in software.",
    whyItMatters: "Still one of the clearest references for action-oriented AI assistants.",
    category: "Agents",
    neighborhood: "Presidio",
    coordinates: [-122.4564, 37.7972],
    founded: 2022,
    featuredTier: "scene",
  },
  {
    slug: "greptile",
    name: "Greptile",
    website: "https://www.greptile.com",
    shortDescription: "AI code reviewer built for teams that want a second set of machine eyes on PRs.",
    whyItMatters: "A very online developer-tool company with strong current-scene relevance.",
    category: "Devtools",
    neighborhood: "Civic Center",
    coordinates: [-122.4162, 37.7811],
    founded: 2023,
    featuredTier: "hot",
  },
  {
    slug: "anyscale",
    name: "Anyscale",
    website: "https://www.anyscale.com",
    shortDescription: "Ray-driven infrastructure company helping teams build and scale AI systems.",
    whyItMatters: "A key bridge between the research stack and practical model deployment.",
    category: "Infra",
    neighborhood: "Union Square",
    coordinates: [-122.4074, 37.7881],
    founded: 2019,
    featuredTier: "scene",
  },
  {
    slug: "unlearn",
    name: "Unlearn",
    website: "https://www.unlearn.ai",
    shortDescription: "AI for clinical trial design, simulation, and drug development workflows.",
    whyItMatters: "Represents the serious, domain-heavy side of SF AI innovation.",
    category: "Vertical AI",
    neighborhood: "Mission Bay",
    coordinates: [-122.3905, 37.7676],
    founded: 2017,
    featuredTier: "scene",
  },
  {
    slug: "sierra",
    name: "Sierra",
    website: "https://sierra.ai",
    shortDescription: "Conversational AI platform designed around customer-facing brand experiences.",
    whyItMatters: "A strong proof point that AI assistants are becoming a mainstream product layer.",
    category: "Agents",
    neighborhood: "South Beach",
    coordinates: [-122.3908, 37.7806],
    founded: 2023,
    featuredTier: "scene",
  },
]
