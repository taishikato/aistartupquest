export const COMPANY_CATEGORIES = [
  "Core Labs",
  "Consumer AI",
  "Devtools",
  "Infra",
  "Agents",
  "Vertical AI",
] as const

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number]

/**
 * Distinct, saturated hues for map + UI so categories read clearly against
 * green/tan terrain and blue water (avoid muted earth tones that blend in).
 */
export const CATEGORY_COLORS: Record<CompanyCategory, string> = {
  "Core Labs": "#d32f2f",
  "Consumer AI": "#00897b",
  Devtools: "#fbc02d",
  Infra: "#7b1fa2",
  Agents: "#1565c0",
  "Vertical AI": "#e65100",
}

/** Text on filled category pills in the dark sidebar (high contrast). */
export function categoryPillForeground(
  category: CompanyCategory
): "#ffffff" | "#1a1a2e" {
  return category === "Devtools" ? "#1a1a2e" : "#ffffff"
}

export type Company = {
  slug: string
  name: string
  website: string
  shortDescription: string
  whyItMatters: string
  category: CompanyCategory
  locationLabel: string
  coordinates: [number, number]
  founded: number
  logoUrl?: string
  /** When true, the card is omitted from the sidebar until the user searches. */
  hideFromSidebar?: boolean
  /** Map marker style — "boss" uses a larger, high-threat sprite. */
  mapSprite?: "default" | "boss"
  sourceUrl: string
  sourceLabel: string
}

/** Slug for the YC HQ landmark (not an SF startup; shown as a map boss). */
export const YC_BOSS_SLUG = "y-combinator" as const

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
  if (company.logoUrl) {
    return company.logoUrl
  }

  const domain = getCompanyDomain(company)

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

// Only companies with a public, source-backed SF office location are included below.
// The broader YC discovery list remains out of the map until exact location sources are added.
export const COMPANIES: Company[] = [
  {
    slug: "openai",
    name: "OpenAI",
    website: "https://openai.com",
    shortDescription:
      "Frontier AI lab behind ChatGPT and a huge share of the current AI wave.",
    whyItMatters: "The obvious anchor on any map of modern SF AI.",
    category: "Core Labs",
    locationLabel: "1455 3rd St, San Francisco",
    coordinates: [-122.3887896, 37.7700459],
    founded: 2015,
    sourceUrl:
      "https://cdn.openai.com/pdf/8e938d69-0b67-4994-b9ff-683733ed587e/openai-letter-minister-solomon.pdf",
    sourceLabel: "OpenAI letterhead",
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    website: "https://www.anthropic.com",
    shortDescription:
      "Claude-maker focused on frontier models, safety, and serious product adoption.",
    whyItMatters: "If OpenAI is one pole of SF AI, Anthropic is the other.",
    category: "Core Labs",
    locationLabel: "500 Howard St, San Francisco",
    coordinates: [-122.3967349, 37.7884892],
    founded: 2021,
    sourceUrl: "https://www.bizprofile.net/ca/san-francisco/anthropic-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    website: "https://www.perplexity.ai",
    shortDescription:
      "Answer engine with a strong consumer feel and nonstop mindshare.",
    whyItMatters:
      "One of the clearest consumer-facing AI stories to come out of SF.",
    category: "Consumer AI",
    locationLabel: "115 Sansome St, San Francisco",
    coordinates: [-122.4010654, 37.7914533],
    founded: 2022,
    sourceUrl: "https://craft.co/perplexity-ai/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "scale-ai",
    name: "Scale AI",
    website: "https://scale.com",
    shortDescription:
      "Data, evaluation, and enterprise infrastructure for training and deploying AI.",
    whyItMatters: "Too central to the SF AI ecosystem to leave off the map.",
    category: "Infra",
    locationLabel: "650 Townsend St, San Francisco",
    coordinates: [-122.4036566, 37.7709567],
    founded: 2016,
    sourceUrl: "https://craft.co/scale-ai/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "baseten",
    name: "Baseten",
    website: "https://www.baseten.com",
    shortDescription:
      "Inference platform for shipping AI products fast with production-ready performance.",
    whyItMatters:
      "A strong infra name with builder credibility and a sharp product story.",
    category: "Infra",
    locationLabel: "575 Sutter St, San Francisco",
    coordinates: [-122.4097317, 37.7888158],
    founded: 2019,
    sourceUrl: "https://craft.co/baseten/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "fin",
    name: "Fin",
    website: "https://fin.ai",
    shortDescription:
      "Fin is an AI Agent system for customer service: a fully configurable AI-powered customer agent that resolves complex support, success, and sales queries.",
    whyItMatters:
      "Fin's mission is to make perfect customer experiences the new standard, by using AI to deliver unbelievably brilliant customer service every single time.",
    category: "Vertical AI",
    locationLabel: "55 Second St, San Francisco",
    coordinates: [-122.40029289081181, 37.78882824961475],
    founded: 2011,
    sourceUrl:
      "https://www.intercom.com/about",
    sourceLabel: "Intercom about page",
  },
  {
    slug: "harvey",
    name: "Harvey",
    website: "https://www.harvey.ai",
    shortDescription:
      "Legal AI company building one of the clearest vertical AI success stories.",
    whyItMatters:
      "Shows how much of SF AI is about real workflows, not just foundation models.",
    category: "Vertical AI",
    locationLabel: "575 Market St, San Francisco",
    coordinates: [-122.4003752, 37.7895414],
    founded: 2022,
    sourceUrl: "https://craft.co/harvey-ai/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "xai",
    name: "xAI",
    website: "https://x.ai",
    shortDescription:
      "Elon Musk's AI lab building Grok, focused on reasoning and truth-seeking.",
    whyItMatters:
      "A major frontier lab operating from the Pioneer Building, OpenAI's former SF headquarters.",
    category: "Core Labs",
    locationLabel: "3180 18th St, San Francisco",
    coordinates: [-122.4146, 37.7622],
    founded: 2023,
    sourceUrl:
      "https://traded.co/deals/california/office/lease/3180-18th-street/",
    sourceLabel: "Traded.co lease record",
  },
  {
    slug: "sierra",
    name: "Sierra",
    website: "https://sierra.ai",
    shortDescription:
      "AI agents for enterprise customer experience, co-founded by Bret Taylor and Clay Bavor.",
    whyItMatters:
      "One of the fastest-growing AI agent companies, with the largest office expansion in SF.",
    category: "Agents",
    locationLabel: "235 Second St, San Francisco",
    coordinates: [-122.3972, 37.786],
    founded: 2023,
    sourceUrl:
      "https://traded.co/deals/california/office/lease/235-second-street/",
    sourceLabel: "Traded.co lease record",
  },
  {
    slug: "thinking-machines",
    name: "Thinking Machines Lab",
    website: "https://thinkingmachines.ai",
    shortDescription:
      "AI research lab co-founded by former OpenAI CTO Mira Murati, building frontier AI models.",
    whyItMatters:
      "The fastest-rising AI lab in SF, founded by one of the most prominent figures in modern AI.",
    category: "Core Labs",
    locationLabel: "2300 Harrison St, San Francisco",
    coordinates: [-122.4127, 37.7606],
    founded: 2025,
    sourceUrl:
      "https://traded.co/deals/california/office/lease/2300-harrison-street/",
    sourceLabel: "Traded.co lease record",
  },
  {
    slug: "together-ai",
    name: "Together AI",
    website: "https://www.together.ai",
    shortDescription:
      "Cloud platform for running and fine-tuning open-source AI models at scale.",
    whyItMatters:
      "Key infrastructure provider for the open-source AI model ecosystem.",
    category: "Infra",
    locationLabel: "251 Rhode Island St, San Francisco",
    coordinates: [-122.4027, 37.7667],
    founded: 2022,
    sourceUrl: "https://www.together.ai/terms-of-service",
    sourceLabel: "Together AI Terms of Service",
  },
  {
    slug: "cursor",
    name: "Cursor",
    website: "https://cursor.com",
    shortDescription:
      "AI-powered code editor built on VS Code with deep LLM integration for code generation.",
    whyItMatters:
      "The dominant AI code editor, one of the fastest-growing developer tools ever built.",
    category: "Devtools",
    locationLabel: "33 New Montgomery St, San Francisco",
    coordinates: [-122.4013, 37.7886],
    founded: 2022,
    sourceUrl: "https://www.cbinsights.com/company/anysphere",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "delphi",
    name: "Delphi",
    website: "https://www.delphi.ai",
    shortDescription:
      "Builds conversational digital twins for experts and creators—on-brand, always-on stand-ins that answer fans and clients in their voice.",
    whyItMatters:
      "A flagship take on personal digital twins: scaling one person’s expertise without losing tone or presence.",
    category: "Consumer AI",
    locationLabel: "850 Montgomery St, Suite 350, San Francisco",
    coordinates: [-122.4035081, 37.7969892],
    founded: 2022,
    sourceUrl: "https://www.delphi.ai/terms-of-use",
    sourceLabel: "Delphi Terms of Use",
  },
  {
    slug: "cognition",
    name: "Cognition",
    website: "https://cognition.ai",
    shortDescription:
      "Creator of Devin, an autonomous AI software engineer for end-to-end coding tasks.",
    whyItMatters:
      "Pioneered the autonomous AI coding agent category with Devin.",
    category: "Agents",
    locationLabel: "1875 Mission St, San Francisco",
    coordinates: [-122.4198, 37.7671],
    founded: 2023,
    sourceUrl: "https://www.bizprofile.net/ca/san-francisco/cognition-ai-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "physical-intelligence",
    name: "Physical Intelligence",
    website: "https://physicalintelligence.company",
    shortDescription:
      "AI research lab building general-purpose foundation models for robotics.",
    whyItMatters:
      "Leading the physical AI frontier with foundation models that teach robots real-world tasks.",
    category: "Core Labs",
    locationLabel: "396 Treat Ave, San Francisco",
    coordinates: [-122.4136, 37.7639],
    founded: 2024,
    sourceUrl:
      "https://www.bizprofile.net/ca/san-francisco/physical-intelligence-pi-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "cohere",
    name: "Cohere",
    website: "https://cohere.com",
    shortDescription:
      "Enterprise AI platform building large language models for business applications.",
    whyItMatters:
      "Major LLM provider with a significant SF presence alongside its Toronto headquarters.",
    category: "Core Labs",
    locationLabel: "755 Sansome St, San Francisco",
    coordinates: [-122.402, 37.7972],
    founded: 2019,
    sourceUrl:
      "https://bandana.com/companies/e362a6da-588c-42f7-bd1a-538c52757bb7/locations/418a9ab4-a428-4a8b-94b6-2d78bbbcaf0f",
    sourceLabel: "Bandana company directory",
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    website: "https://elevenlabs.io",
    shortDescription:
      "AI voice technology platform for realistic speech synthesis and voice cloning.",
    whyItMatters:
      "The leading voice AI platform, powering speech synthesis for thousands of applications.",
    category: "Infra",
    locationLabel: "303 2nd St, San Francisco",
    coordinates: [-122.3958, 37.7849],
    founded: 2022,
    sourceUrl: "https://websets.exa.ai/websets/directory/elevenlabs-offices",
    sourceLabel: "Exa directory listing",
  },
  {
    slug: "writer",
    name: "Writer",
    website: "https://writer.com",
    shortDescription:
      "Enterprise AI platform for building and deploying AI agents grounded in company data.",
    whyItMatters:
      "One of few enterprise AI companies building its own foundation models.",
    category: "Vertical AI",
    locationLabel: "111 Maiden Lane, San Francisco",
    coordinates: [-122.4062, 37.788],
    founded: 2020,
    sourceUrl: "https://www.cbinsights.com/company/qordoba",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "11x",
    name: "11x",
    website: "https://www.11x.ai",
    shortDescription:
      "AI digital workers that automate sales development and go-to-market tasks.",
    whyItMatters:
      "Leading the AI digital worker category with backing from Benchmark and a16z.",
    category: "Agents",
    locationLabel: "677 Harrison St, San Francisco",
    coordinates: [-122.3969, 37.7829],
    founded: 2022,
    sourceUrl: "https://www.bizprofile.net/ca/san-francisco/11x-ai-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "abnormal",
    name: "Abnormal Security",
    website: "https://abnormal.ai",
    shortDescription:
      "AI-powered email security platform that detects and prevents business email compromise.",
    whyItMatters:
      "Major AI cybersecurity company using behavioral AI to protect enterprise email.",
    category: "Vertical AI",
    locationLabel: "185 Clara St, San Francisco",
    coordinates: [-122.4017, 37.7799],
    founded: 2018,
    sourceUrl: "https://opengovus.com/sam-entity/C1MPKNUNE761",
    sourceLabel: "SAM.gov entity registration",
  },
  {
    slug: "imbue",
    name: "Imbue",
    website: "https://imbue.com",
    shortDescription:
      "AI research lab building agents that can reason and code, formerly Generally Intelligent.",
    whyItMatters:
      "Billion-dollar AI research lab focused on building agents with robust reasoning.",
    category: "Core Labs",
    locationLabel: "2261 Market St, San Francisco",
    coordinates: [-122.4322, 37.7647],
    founded: 2021,
    sourceUrl: "https://files.nitrd.gov/90-fr-9088/Imbue-AI-RFI-2025.pdf",
    sourceLabel: "OSTP public filing",
  },
  {
    slug: "llamaindex",
    name: "LlamaIndex",
    website: "https://www.llamaindex.ai",
    shortDescription:
      "Open-source data framework for connecting custom data sources with LLMs.",
    whyItMatters:
      "The leading RAG framework, core infrastructure for thousands of AI applications.",
    category: "Devtools",
    locationLabel: "325 5th St, San Francisco",
    coordinates: [-122.4031, 37.7801],
    founded: 2022,
    sourceUrl: "https://www.builtinsf.com/company/llamaindex",
    sourceLabel: "Built In SF company profile",
  },
  {
    slug: "langchain",
    name: "LangChain",
    website: "https://www.langchain.com",
    shortDescription:
      "Open-source framework and platform for building LLM-powered applications.",
    whyItMatters:
      "De facto standard framework for LLM application development.",
    category: "Devtools",
    locationLabel: "42 Decatur St, San Francisco",
    coordinates: [-122.4063, 37.7726],
    founded: 2023,
    sourceUrl: "https://www.bizprofile.net/ca/san-francisco/langchain-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "wandb",
    name: "Weights & Biases",
    website: "https://wandb.ai",
    shortDescription:
      "ML developer platform for experiment tracking, model management, and dataset versioning.",
    whyItMatters: "Ubiquitous MLOps tool used by OpenAI, NVIDIA, and Meta.",
    category: "Infra",
    locationLabel: "400 Alabama St, San Francisco",
    coordinates: [-122.4124, 37.7641],
    founded: 2017,
    sourceUrl:
      "https://www.bizprofile.net/ca/san-francisco/weights-and-biases-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "descript",
    name: "Descript",
    website: "https://www.descript.com",
    shortDescription:
      "AI-powered video and podcast editor enabling text-based media editing.",
    whyItMatters:
      "Pioneered AI-native media editing with text-based video and audio workflows.",
    category: "Consumer AI",
    locationLabel: "375 Alabama St, San Francisco",
    coordinates: [-122.4123, 37.7645],
    founded: 2017,
    sourceUrl: "https://www.descript.com/terms",
    sourceLabel: "Descript Terms of Service",
  },
  {
    slug: "lightfield",
    name: "Lightfield",
    website: "https://lightfield.app",
    shortDescription:
      "AI-native CRM built by the team behind Tome, the AI presentation tool.",
    whyItMatters:
      "Notable SF pivot from a viral AI presentation tool to AI-native enterprise CRM.",
    category: "Vertical AI",
    locationLabel: "600 Townsend St, San Francisco",
    coordinates: [-122.4018, 37.7718],
    founded: 2020,
    sourceUrl: "https://www.cbinsights.com/company/tome-1",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "browserbase",
    name: "Browserbase",
    website: "https://www.browserbase.com",
    shortDescription:
      "Cloud platform providing headless browser infrastructure for AI agents.",
    whyItMatters:
      "Critical web-browsing infrastructure powering the AI agent ecosystem.",
    category: "Infra",
    locationLabel: "166 Geary St, San Francisco",
    coordinates: [-122.406, 37.7877],
    founded: 2024,
    sourceUrl: "https://www.bizprofile.net/ca/san-francisco/browserbase-inc",
    sourceLabel: "California business filing via BizProfile",
  },
  {
    slug: "labelbox",
    name: "Labelbox",
    website: "https://labelbox.com",
    shortDescription:
      "AI data platform for training data labeling, curation, and model evaluation.",
    whyItMatters:
      "Essential data infrastructure for enterprise AI model training and evaluation.",
    category: "Infra",
    locationLabel: "510 Treat Ave, San Francisco",
    coordinates: [-122.4145, 37.762],
    founded: 2018,
    sourceUrl: "https://www.zoominfo.com/c/labelbox-inc/452502399",
    sourceLabel: "ZoomInfo company listing",
  },
  {
    slug: "forethought",
    name: "Forethought",
    website: "https://forethought.ai",
    shortDescription:
      "AI agents platform automating customer support ticket resolution for enterprises.",
    whyItMatters: "Early mover in AI-powered customer support automation.",
    category: "Agents",
    locationLabel: "345 California St, San Francisco",
    coordinates: [-122.4005, 37.7931],
    founded: 2017,
    sourceUrl: "https://www.cbinsights.com/company/forethought-technologies",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "sourcegraph",
    name: "Sourcegraph",
    website: "https://sourcegraph.com",
    shortDescription:
      "Code intelligence platform with AI-powered search and the Amp coding agent.",
    whyItMatters:
      "Established code search platform that built a competitive AI coding agent.",
    category: "Devtools",
    locationLabel: "400 Montgomery St, San Francisco",
    coordinates: [-122.4027, 37.7929],
    founded: 2013,
    sourceUrl:
      "https://github.com/sourcegraph/handbook/blob/main/content/company-info-and-process/about-sourcegraph/general-office-info.md",
    sourceLabel: "Sourcegraph public handbook",
  },
  {
    slug: "wispr",
    name: "Wispr Flow",
    website: "https://wisprflow.ai",
    shortDescription:
      "AI voice dictation app that adapts to each user's writing style.",
    whyItMatters:
      "Fast-growing voice AI product replacing traditional text input with dictation.",
    category: "Consumer AI",
    locationLabel: "444 Townsend St, San Francisco",
    coordinates: [-122.3983, 37.7746],
    founded: 2021,
    sourceUrl: "https://www.cbinsights.com/company/wispr",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "bland",
    name: "Bland AI",
    website: "https://www.bland.ai",
    shortDescription:
      "Enterprise platform for AI phone agents handling sales, support, and scheduling.",
    whyItMatters:
      "Automating enterprise phone communications with AI-powered voice agents.",
    category: "Agents",
    locationLabel: "292 Ivy St, San Francisco",
    coordinates: [-122.4229, 37.7774],
    founded: 2023,
    sourceUrl: "https://craft.co/bland-ai/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "databricks",
    name: "Databricks",
    website: "https://www.databricks.com",
    shortDescription:
      "Unified data and AI platform combining data warehousing, engineering, and ML at scale.",
    whyItMatters:
      "The anchor of SF's data-AI infrastructure, building foundation models and powering enterprise AI.",
    category: "Infra",
    locationLabel: "160 Spear St, San Francisco",
    coordinates: [-122.3936, 37.7912],
    founded: 2013,
    sourceUrl: "https://www.databricks.com/company/contact/office-locations",
    sourceLabel: "Databricks official office locations",
  },
  {
    slug: "glean",
    name: "Glean",
    website: "https://www.glean.com",
    shortDescription:
      "AI-powered enterprise search platform connecting all company data for instant answers.",
    whyItMatters:
      "One of the fastest-growing enterprise AI companies, valued at $7.2B.",
    category: "Vertical AI",
    locationLabel: "255 California St, San Francisco",
    coordinates: [-122.3997, 37.7932],
    founded: 2019,
    sourceUrl: "https://salestools.io/en/report/glean-headquarters",
    sourceLabel: "Salestools headquarters listing",
  },
  {
    slug: "mercor",
    name: "Mercor",
    website: "https://www.mercor.com",
    shortDescription:
      "AI-powered hiring platform that matches talent to jobs using AI interviews and evaluation.",
    whyItMatters:
      "Redefining hiring with AI-driven talent evaluation from 181 Fremont.",
    category: "Vertical AI",
    locationLabel: "181 Fremont St, San Francisco",
    coordinates: [-122.3953, 37.7901],
    founded: 2023,
    sourceUrl: "https://www.builtinsf.com/company/mercor",
    sourceLabel: "Built In SF company profile",
  },
  {
    slug: "luma",
    name: "Luma AI",
    website: "https://lumalabs.ai",
    shortDescription:
      "AI platform for 3D and video generation, creators of Dream Machine.",
    whyItMatters:
      "Pushing the frontier of AI-generated visual content with Dream Machine.",
    category: "Consumer AI",
    locationLabel: "457 Bryant St, San Francisco",
    coordinates: [-122.3969, 37.7823],
    founded: 2021,
    sourceUrl: "https://talent.amplifypartners.com/jobs/luma-ai",
    sourceLabel: "Amplify Partners job listing",
  },
  {
    slug: "magic",
    name: "Magic",
    website: "https://magic.dev",
    shortDescription:
      "AI coding company building frontier models with long context for software development.",
    whyItMatters:
      "Building AI that can reason across entire codebases with massive context windows.",
    category: "Devtools",
    locationLabel: "580 California St, San Francisco",
    coordinates: [-122.4044, 37.7926],
    founded: 2022,
    sourceUrl: "https://exa.ai/websets/directory/magic-ai-offices",
    sourceLabel: "Exa directory listing",
  },
  {
    slug: "hebbia",
    name: "Hebbia",
    website: "https://www.hebbia.com",
    shortDescription:
      "AI platform for knowledge work that reasons across millions of documents for finance and law.",
    whyItMatters:
      "Enterprise AI that automates deep document analysis for the world's largest institutions.",
    category: "Vertical AI",
    locationLabel: "575 Market St, San Francisco",
    coordinates: [-122.4005, 37.7893],
    founded: 2020,
    sourceUrl:
      "https://www.hebbia.com/newsroom/hebbia-opens-doors-in-san-francisco-and-welcomes-new-cto",
    sourceLabel: "Hebbia newsroom",
  },
  {
    slug: "replicate",
    name: "Replicate",
    website: "https://replicate.com",
    shortDescription:
      "Cloud API for running open-source ML models with simple deployment.",
    whyItMatters:
      "Key infrastructure making open-source AI models accessible to any developer.",
    category: "Infra",
    locationLabel: "2261 Market St, San Francisco",
    coordinates: [-122.4318, 37.765],
    founded: 2019,
    sourceUrl: "https://replicate.com/privacy",
    sourceLabel: "Replicate privacy policy",
  },
  {
    slug: "modal",
    name: "Modal",
    website: "https://modal.com",
    shortDescription:
      "Serverless cloud platform for running AI and data workloads on GPUs.",
    whyItMatters:
      "Fast-growing compute infrastructure for AI teams who need scalable GPU access.",
    category: "Infra",
    locationLabel: "156 2nd St, San Francisco",
    coordinates: [-122.3975, 37.7871],
    founded: 2021,
    sourceUrl: "https://www.cbinsights.com/company/modal-1",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "chroma",
    name: "Chroma",
    website: "https://www.trychroma.com",
    shortDescription:
      "Open-source vector database for building AI applications with embeddings.",
    whyItMatters:
      "The leading open-source embedding database powering AI search and RAG pipelines.",
    category: "Infra",
    locationLabel: "2261 Market St, San Francisco",
    coordinates: [-122.432, 37.7644],
    founded: 2022,
    sourceUrl: "https://opengovus.com/san-francisco-business/1304237-05-221",
    sourceLabel: "SF business filing via OpenGovUS",
  },
  {
    slug: "jasper",
    name: "Jasper",
    website: "https://www.jasper.ai",
    shortDescription:
      "AI content generation platform for marketing teams and enterprises.",
    whyItMatters:
      "One of the earliest breakout AI content tools with strong enterprise adoption.",
    category: "Consumer AI",
    locationLabel: "575 Market St, San Francisco",
    coordinates: [-122.4001, 37.7897],
    founded: 2021,
    sourceUrl: "https://www.jasper.ai/legal/terms",
    sourceLabel: "Jasper Terms of Service",
  },
  {
    slug: "cresta",
    name: "Cresta",
    website: "https://cresta.com",
    shortDescription:
      "Real-time AI platform for contact centers providing agent assist and coaching.",
    whyItMatters:
      "Founded by Sebastian Thrun, applying real-time AI to transform customer service.",
    category: "Agents",
    locationLabel: "235 Pine St, San Francisco",
    coordinates: [-122.3998, 37.7922],
    founded: 2017,
    sourceUrl: "https://salestools.io/en/report/cresta-headquarters",
    sourceLabel: "Salestools headquarters listing",
  },
  {
    slug: "primer",
    name: "Primer",
    website: "https://primer.ai",
    shortDescription:
      "AI platform automating intelligence analysis and report generation for defense and security.",
    whyItMatters:
      "Pioneer in applying NLP to national security and intelligence workflows.",
    category: "Vertical AI",
    locationLabel: "244 Jackson St, San Francisco",
    coordinates: [-122.3999, 37.7969],
    founded: 2015,
    sourceUrl: "https://craft.co/primer-ai/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "abridge",
    name: "Abridge",
    website: "https://www.abridge.com",
    shortDescription:
      "Generative AI platform for clinical documentation used by 150+ health systems.",
    whyItMatters:
      "Leading AI healthcare company with one of SF's largest recent office leases.",
    category: "Vertical AI",
    locationLabel: "208 Utah St, San Francisco",
    coordinates: [-122.4043, 37.7632],
    founded: 2018,
    sourceUrl:
      "https://sfstandard.com/2025/10/07/abridge-ai-san-francisco-office-leasing/",
    sourceLabel: "SF Standard office lease report",
  },
  {
    slug: "distyl",
    name: "Distyl AI",
    website: "https://distyl.ai",
    shortDescription:
      "Enterprise AI orchestration platform rebuilding business processes with autonomous agents.",
    whyItMatters:
      "Building AI-native enterprise automation for telecom, healthcare, and manufacturing.",
    category: "Agents",
    locationLabel: "55 Hawthorne St, San Francisco",
    coordinates: [-122.3985, 37.7862],
    founded: 2022,
    sourceUrl: "https://www.builtinsf.com/company/distyl-ai",
    sourceLabel: "Built In SF company profile",
  },
  {
    slug: "nightfall",
    name: "Nightfall AI",
    website: "https://www.nightfall.ai",
    shortDescription:
      "AI-native data loss prevention platform protecting sensitive data across cloud apps.",
    whyItMatters:
      "First DLP platform built on generative AI for the enterprise cloud era.",
    category: "Vertical AI",
    locationLabel: "425 California St, San Francisco",
    coordinates: [-122.4018, 37.7929],
    founded: 2019,
    sourceUrl: "https://www.cbinsights.com/company/nightfall-ai",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "adept",
    name: "Adept AI",
    website: "https://www.adept.ai",
    shortDescription:
      "AI research lab building agents that take actions in software for users.",
    whyItMatters:
      "Notable AI agent company with a novel approach to human-computer interaction.",
    category: "Agents",
    locationLabel: "350 Rhode Island St, San Francisco",
    coordinates: [-122.4031, 37.766],
    founded: 2022,
    sourceUrl:
      "https://therealdeal.com/san-francisco/2023/08/10/adept-ai-labs-to-lease-35k-sf-in-san-franciscos-area-ai/",
    sourceLabel: "The Real Deal lease record",
  },
  {
    slug: "deepgram",
    name: "Deepgram",
    website: "https://deepgram.com",
    shortDescription:
      "Speech AI platform providing fast, accurate transcription and speech understanding APIs.",
    whyItMatters:
      "Major speech AI infrastructure powering real-time voice applications at scale.",
    category: "Infra",
    locationLabel: "548 Market St, San Francisco",
    coordinates: [-122.3998, 37.7899],
    founded: 2015,
    sourceUrl: "https://craft.co/deepgram/locations",
    sourceLabel: "Craft locations page",
  },
  {
    slug: "woebot",
    name: "Woebot Health",
    website: "https://woebothealth.com",
    shortDescription:
      "AI-powered mental health platform delivering evidence-based therapy at scale.",
    whyItMatters:
      "Pioneering AI-delivered mental health support backed by clinical research.",
    category: "Vertical AI",
    locationLabel: "650 5th St, San Francisco",
    coordinates: [-122.3972, 37.7759],
    founded: 2017,
    sourceUrl:
      "https://www.bbb.org/us/ca/san-francisco/profile/lab/woebot-labs-inc-1116-889119",
    sourceLabel: "Better Business Bureau listing",
  },
  {
    slug: "rad-ai",
    name: "Rad AI",
    website: "https://www.radai.com",
    shortDescription:
      "Generative AI models trained specifically for radiology to automate clinical reporting.",
    whyItMatters:
      "Leading AI company reducing radiologist burnout with purpose-built healthcare AI.",
    category: "Vertical AI",
    locationLabel: "548 Market St, San Francisco",
    coordinates: [-122.4003, 37.7903],
    founded: 2018,
    sourceUrl: "https://www.cbinsights.com/company/rad-ai",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: "assemblyai",
    name: "AssemblyAI",
    website: "https://www.assemblyai.com",
    shortDescription:
      "AI platform for speech recognition, speaker detection, and audio intelligence APIs.",
    whyItMatters:
      "Major speech AI provider offering developer-friendly transcription and audio understanding.",
    category: "Infra",
    locationLabel: "320 Judah St, San Francisco",
    coordinates: [-122.4606, 37.7612],
    founded: 2017,
    sourceUrl: "https://www.cbinsights.com/company/assemblyai",
    sourceLabel: "CB Insights company profile",
  },
  {
    slug: YC_BOSS_SLUG,
    name: "Y Combinator",
    website: "https://www.ycombinator.com",
    shortDescription:
      "The accelerator that shaped modern startup culture — the final boss of the Bay Area map.",
    whyItMatters:
      "Not a player on the SF board, but the institution behind many of them: a deliberate boss marker south of the city.",
    category: "Infra",
    locationLabel: "335 Pioneer Way, Mountain View",
    coordinates: [-122.0668804, 37.3862565],
    founded: 2005,
    logoUrl: "https://www.google.com/s2/favicons?domain=ycombinator.com&sz=128",
    hideFromSidebar: true,
    mapSprite: "boss",
    sourceUrl:
      "https://www.openstreetmap.org/search?query=335%20Pioneer%20Way%20Mountain%20View%20CA",
    sourceLabel: "OpenStreetMap / Nominatim geocode",
  },
]
