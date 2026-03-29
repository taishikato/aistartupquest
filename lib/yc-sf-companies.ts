export type DiscoveredCompany = {
  slug: string
  name: string
  website: string
  shortDescription: string
  founded: number
  logoUrl: string
  tags: string[]
}

// Sourced from Y Combinator's AI / San Francisco directory pages on 2026-03-22.
export const YC_SF_SEARCH_COMPANIES: DiscoveredCompany[] = [
  {
    slug: "a0-dev",
    name: "a0.dev",
    website: "https://a0.dev",
    shortDescription: "We make mobile apps using AI.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/eed1f4cfbc94ee7934ad288bea413225964237fe.png",
    tags: ["developer-tools", "generative-ai", "design", "ai"],
  },
  {
    slug: "aircaps",
    name: "AirCaps",
    website: "https://aircaps.com",
    shortDescription: "The AI copilot for in-person conversations.",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/839111803eb4ccce6e6e411847617a96d8d7d880.png",
    tags: [
      "artificial-intelligence",
      "ai",
      "conversational-ai",
      "productivity",
    ],
  },
  {
    slug: "aleph-lab",
    name: "Aleph Lab",
    website: "http://alephlab.ai/",
    shortDescription: "AI language buddy in the games kids love",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/a4f5ece11eecade92cb79477adf78d6a6e699cfa.png",
    tags: ["artificial-intelligence"],
  },
  {
    slug: "anto-biosciences",
    name: "Anto Biosciences",
    website: "https://www.anto.bio/",
    shortDescription: "A Foundation Model for Microbial Communities.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/83f56c369ac0fb5e70438516e774b8603717940a.png",
    tags: ["generative-ai", "genomics", "biotech", "drug-discovery", "ai"],
  },
  {
    slug: "approxima",
    name: "Approxima",
    website: "https://approxima.ai",
    shortDescription: "Your software should build itself.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/e6e6d183a6369dfc8a86aad778e45ad07d16406f.png",
    tags: ["infrastructure", "enterprise-software", "ai"],
  },
  {
    slug: "articulate",
    name: "Articulate",
    website: "https://usearticulate.com",
    shortDescription: "Automatic Construction Drawing Clash Detection",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/b26a35750dbae152a692ea82c2b00bb8f78d4d9b.png",
    tags: ["ai", "construction", "b2b", "workflow-automation", "architecture"],
  },
  {
    slug: "arzana",
    name: "Arzana",
    website: "https://arzana.ai",
    shortDescription: "AI automation for the manufacturing office",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/4785fcf24308f1fcad59fe3eda9fea668524c25f.png",
    tags: [
      "operations",
      "industrial",
      "manufacturing",
      "automation",
      "artificial-intelligence",
    ],
  },
  {
    slug: "geo-ai",
    name: "Bizzy AI",
    website: "https://www.usebizzy.com/",
    shortDescription: "Bizzy works 24/7 so you never miss a lead.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/f1bb9d080fb903ceaca051fee53ae9b28b4bb593.png",
    tags: ["workflow-automation", "marketing", "sales", "ai"],
  },
  {
    slug: "blaxel",
    name: "Blaxel",
    website: "https://blaxel.ai",
    shortDescription: "The perpetual sandbox platform",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/60e390e449209c3c990c56045efeb692cf4ce77a.png",
    tags: ["cloud-computing", "infrastructure", "ai"],
  },
  {
    slug: "boom-ai",
    name: "Boom AI",
    website: "https://useboom.ai",
    shortDescription: "AI growth team for e-commerce brands",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/e240d7b6e048d06c397f1f72707e3cd4fc0ad63d.png",
    tags: ["artificial-intelligence", "smb", "ai", "b2b", "e-commerce"],
  },
  {
    slug: "bubble-lab",
    name: "Bubble Lab",
    website: "https://bubblelab.ai/",
    shortDescription: "The ops super-employee in Slack",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/9fc7f7534f4fb913904f49914952c1daa8086654.png",
    tags: [
      "artificial-intelligence",
      "workflow-automation",
      "operations",
      "enterprise-software",
      "automation",
    ],
  },
  {
    slug: "calltree",
    name: "Calltree",
    website: "https://calltree.ai",
    shortDescription: "Enterprise-grade AI support reps for call centers",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/e2ad0fe64b625227762a6c6a44c1872475df287d.png",
    tags: [
      "artificial-intelligence",
      "customer-service",
      "generative-ai",
      "saas",
      "b2b",
    ],
  },
  {
    slug: "carrot-labs",
    name: "Carrot Labs",
    website: "https://carrotlabs.ai/",
    shortDescription: "Continuous Fine-Tuning for AI Models",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/6c9d56ba5bab1fb6c9a7734a1a8aab7b6fbc48ed.png",
    tags: ["artificial-intelligence", "reinforcement-learning", "automation"],
  },
  {
    slug: "chamber",
    name: "Chamber",
    website: "https://www.usechamber.io",
    shortDescription: "The AIOps Agent for ML Teams",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/a1fc77901b81373bfd2cdb4b4fd70816597bb561.png",
    tags: ["artificial-intelligence", "aiops", "b2b", "ai", "ml"],
  },
  {
    slug: "clara-2",
    name: "Clara",
    website: "http://askclara.com",
    shortDescription: "AI primary care doctor",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/9ab52625ae85ffe0da16a13dee9f82eaa1e7c33f.png",
    tags: ["healthcare", "telemedicine", "telehealth", "ai"],
  },
  {
    slug: "claybird",
    name: "Claybird",
    website: "https://claybird.com/",
    shortDescription: "The full-stack AI ad company",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/9529719c71a2b6a4f16690eb9667a824c2ab4d65.png",
    tags: ["marketing", "video", "advertising", "artificial-intelligence"],
  },
  {
    slug: "clicks",
    name: "Clicks",
    website: "https://goclicks.ai/",
    shortDescription: "AI agents for your back-office operations.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/9ba947944afd3b1dfe85a7f3891e69a0b39e5fe9.png",
    tags: ["artificial-intelligence"],
  },
  {
    slug: "compyle",
    name: "Compyle",
    website: "https://compyle.ai",
    shortDescription: "The coding agent that actually collaborates with you",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/d64e6601db5d659b1726d0d5ea126494391f5f62.png",
    tags: ["ai", "developer-tools", "artificial-intelligence"],
  },
  {
    slug: "cortex-ai",
    name: "Cortex AI",
    website: "https://cortexrobot.ai/",
    shortDescription:
      "Large-scale real-world robot & human data for embodied AI",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/1c9246b8eba5ba12a7373a930ea46cc687dddb98.png",
    tags: ["robotics", "reinforcement-learning", "artificial-intelligence"],
  },
  {
    slug: "cranston-ai",
    name: "Cranston AI",
    website: "https://www.cranstonai.com/",
    shortDescription: "Full Stack AI Accounting Firm",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/88689b5dae77948437304c27aefbb12261dcacb3.png",
    tags: ["b2b", "saas", "ai"],
  },
  {
    slug: "cyberdesk",
    name: "Cyberdesk",
    website: "https://www.cyberdesk.io",
    shortDescription: "Self learning computer use agent for developers",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/b6deea0aa4e96211ac35f75ade0705df19758a8e.png",
    tags: [
      "workflow-automation",
      "developer-tools",
      "artificial-intelligence",
      "enterprise-software",
      "robotic-process-automation",
    ],
  },
  {
    slug: "dedalus-labs",
    name: "Dedalus Labs",
    website: "https://www.dedaluslabs.ai/",
    shortDescription:
      "Connect any model(s) to any tool(s) and ship hosted agents in minutes.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/9448459d24e79ff3a74806f4accea964e7619319.png",
    tags: ["ai", "developer-tools", "devops", "workflow-automation"],
  },
  {
    slug: "denki",
    name: "Denki",
    website: "https://denki.ai",
    shortDescription: "The full-stack AI financial audit firm",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/1543e40091902a20ba3f9f49ea46c17e0b60e86a.png",
    tags: ["ai-assistant", "compliance", "finops", "artificial-intelligence"],
  },
  {
    slug: "didit",
    name: "Didit",
    website: "https://didit.me/",
    shortDescription: "Identity platform for fast human verification.",
    founded: 2023,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/202e6cd94d0ec2c8de835c56ce6b880f99f033d5.png",
    tags: ["identity", "b2b", "saas", "infrastructure", "ai"],
  },
  {
    slug: "digipals",
    name: "Digipals",
    website: "https://www.digipals.app/",
    shortDescription: "The future of Social in the age of AI",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/a100705513555f60b674edacd7874b01e7bef2df.png",
    tags: ["consumer", "social", "social-media", "social-network", "ai"],
  },
  {
    slug: "diligencesquared-inc",
    name: "DiligenceSquared",
    website: "https://diligencesquared.com/",
    shortDescription:
      "AI-powered market due diligence for investment decisions",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/e75ae93d8e056556c69cc8d6215f5c6787ea95eb.png",
    tags: ["artificial-intelligence", "analytics", "market-research"],
  },
  {
    slug: "emergent",
    name: "Emergent",
    website: "https://emergent.sh",
    shortDescription:
      "AI app builder that turns your ideas into monetizable software.",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/86f3eae4a9616e976acbe6b16031d057f3c2fbc8.png",
    tags: ["ai", "consumer", "generative-ai", "no-code"],
  },
  {
    slug: "envariant",
    name: "Envariant",
    website: "https://envariant.ai/",
    shortDescription:
      "Interpretability and reasoning infra for foundation models.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/abf1430afe9764675d165ce0908d003bf6893b19.png",
    tags: ["developer-tools", "b2b", "artificial-intelligence"],
  },
  {
    slug: "exonic",
    name: "Exonic",
    website: "https://exonic.ai",
    shortDescription: "Unsupervised Biological AI",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/144f0914ccf312aeee94512a8dc4a6cf9502f07e.png",
    tags: [
      "drug-discovery",
      "synthetic-biology",
      "biotechnology",
      "machine-learning",
      "artificial-intelligence",
    ],
  },
  {
    slug: "fenrock-ai",
    name: "Fenrock AI",
    website: "https://fenrock.ai/",
    shortDescription: "AI agents for banking back office",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/49628c649d0cbcd7910ecb380ad944b7613d8242.png",
    tags: ["artificial-intelligence", "enterprise", "b2b"],
  },
  {
    slug: "fifth-door",
    name: "Fifth Door",
    website: "https://fifthdoor.com",
    shortDescription: "Create and play games with AI",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/ccb42373fb1495367c087cca6ae092d6da20baba.png",
    tags: ["gaming", "consumer", "ai"],
  },
  {
    slug: "hireglide",
    name: "HireGlide",
    website: "https://www.hireglide.ai/",
    shortDescription: "The AI-native job board",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/f43313bb066e1501a71f08b9bb9435ada83f0e9c.png",
    tags: ["recruiting", "talent-acquisition", "hr-tech", "ai"],
  },
  {
    slug: "hud",
    name: "hud",
    website: "https://www.hud.so",
    shortDescription: "Platform for building RL environments and evals",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/53fffc4904f866d9d44ba9a47862b594f1d45667.png",
    tags: ["reinforcement-learning", "ai"],
  },
  {
    slug: "hyperspell",
    name: "Hyperspell",
    website: "https://hyperspell.com",
    shortDescription: "Memory for AI Agents",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/4149c6afc651c9770fc182e08dde776e24f88554.png",
    tags: [
      "machine-learning",
      "b2b",
      "infrastructure",
      "developer-tools",
      "ai",
    ],
  },
  {
    slug: "brownie",
    name: "IncidentFox",
    website: "https://incidentfox.ai",
    shortDescription:
      "AI SRE agent that triages, coordinates, and fixes production incidents",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/43fb964e8e0ca12dcc1000b4c4c2d6be7ffc203e.png",
    tags: ["artificial-intelligence", "developer-tools", "aiops"],
  },
  {
    slug: "indexable",
    name: "Indexable",
    website: "https://ix.dev",
    shortDescription: "sandbox infrastructure for AI agents",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/a292dff93672ea62c32dbeeb65592ec0f16c79c3.png",
    tags: ["artificial-intelligence"],
  },
  {
    slug: "inspector",
    name: "Inspector",
    website: "https://www.tryinspector.com",
    shortDescription: "AI IDE for front-end development",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/3a74c32ba5c193f4216d063ad72608f841e04786.png",
    tags: [
      "artificial-intelligence",
      "design-tools",
      "design",
      "developer-tools",
    ],
  },
  {
    slug: "jarmin",
    name: "Jarmin",
    website: "https://jarmin.ai/",
    shortDescription: "24/7 Machine Learning Engineer employees",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/a48984c0a7bc281e9b076876c8d571aaf44c799e.png",
    tags: [
      "ai-assistant",
      "enterprise",
      "developer-tools",
      "b2b",
      "artificial-intelligence",
    ],
  },
  {
    slug: "korso",
    name: "Korso",
    website: "https://korsoai.com/",
    shortDescription: "The Intelligence Layer for Manufacturing.",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/41304734421d088c72c82b8e7d148826f4864bc9.png",
    tags: ["manufacturing", "saas", "artificial-intelligence"],
  },
  {
    slug: "lapis",
    name: "Lapis",
    website: "https://www.trylapis.com/",
    shortDescription: "AI that creates on-brand image ads",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/9c3bc6a804835cf4e60592673af66342d45aa417.png",
    tags: ["marketing", "advertising", "artificial-intelligence", "ai", "b2b"],
  },
  {
    slug: "uselemma",
    name: "Lemma",
    website: "https://www.uselemma.ai/",
    shortDescription: "Continuous learning for AI agents",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/c12ccaaa4d43530a4f13abb208362f187f33e86d.png",
    tags: [
      "b2b",
      "developer-tools",
      "artificial-intelligence",
      "ai",
      "infrastructure",
    ],
  },
  {
    slug: "lexi",
    name: "Lexi",
    website: "https://getlexi.io/",
    shortDescription: "AI Associates for Corporate Law",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/eb8c922483150b7ebb7320f8160a0722809b666c.png",
    tags: ["b2b", "legal", "legaltech", "saas", "artificial-intelligence"],
  },
  {
    slug: "logical",
    name: "Logical",
    website: "https://logical.io",
    shortDescription: "A proactive desktop copilot. Clippy, but actually good.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/2fb6ea58cacd2d7637cd441b73c8f2e6da92ae97.png",
    tags: ["ai", "productivity", "ai-assistant", "consumer", "b2b"],
  },
  {
    slug: "logosguard",
    name: "LogosGuard",
    website: "https://logosguard.com/",
    shortDescription:
      "The risk management software for enterprises adopting AI",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/b3e17b292dce9142e728fb1a7ba4705bb06cceff.png",
    tags: ["cybersecurity", "compliance", "security", "b2b", "ai"],
  },
  {
    slug: "lunabill",
    name: "LunaBill",
    website: "https://lunabill.com/",
    shortDescription: "AI Voice callers for healthcare billing teams",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/847fd92cf2043da7d18f115344b4d983d4eccc7c.png",
    tags: [
      "healthcare-it",
      "healthcare",
      "health-tech",
      "generative-ai",
      "artificial-intelligence",
    ],
  },
  {
    slug: "manicule",
    name: "Manicule",
    website: "https://manicule.dev",
    shortDescription: "AI Native Technical Documentation Studio",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/cd583af5fd7e25beb6cf6bd63167daa1273db6c5.png",
    tags: ["developer-tools", "ai", "b2b"],
  },
  {
    slug: "markit",
    name: "MarkIt",
    website: "https://markittrade.com",
    shortDescription:
      "AI Agents for Trade Compliance - Saving Companies from Tariffs",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/7e5614f0ff0430254c23e0743e5e0490fb5f826c.png",
    tags: ["supply-chain", "workflow-automation", "logistics", "ai"],
  },
  {
    slug: "matforge",
    name: "matforge",
    website: "https://matforge.ai/",
    shortDescription: "AI scientists to discover semiconductor materials",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/910cd5b0344664a22b57c59a7d459cabe1095bee.png",
    tags: [
      "ai",
      "advanced-materials",
      "semiconductors",
      "artificial-intelligence",
    ],
  },
  {
    slug: "movedot",
    name: "MOVEdot",
    website: "https://www.movedot.ai/",
    shortDescription: "AI Agents for Hardware Engineering",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/ff366b5cf4ba792d472cf1af716e033566ff24ff.png",
    tags: ["industrial", "automotive", "manufacturing", "hardware", "ai"],
  },
  {
    slug: "usenarrative",
    name: "Narrative",
    website: "http://www.narrative-sports.com",
    shortDescription: "AI-Powered Sports Highlights",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/db1362ab305e5a74bfdc1a509c929ce8348b2df9.png",
    tags: ["sports-tech", "b2b", "ai", "video"],
  },
  {
    slug: "nessie",
    name: "Nessie",
    website: "https://nessielabs.com/",
    shortDescription: "Shareable AI Brains for Everyone",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/400e4be5acfaa12735760bedcf4f0ad136f82137.png",
    tags: ["artificial-intelligence", "ai", "consumer", "search", "chat"],
  },
  {
    slug: "noetic",
    name: "noetic",
    website: "https://getnoetic.ai/",
    shortDescription:
      "AI that gets hardware compliance done in weeks, not months.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/dba387168963852908436d537a074d4e2c1ba833.png",
    tags: ["robotics", "compliance", "hardware", "artificial-intelligence"],
  },
  {
    slug: "norra",
    name: "Norra",
    website: "https://www.norra.io",
    shortDescription: "Automating equipment operations for nursing facilities",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/e02b3e396920957fb568e6c31817205cde3dbd2a.png",
    tags: [
      "health-tech",
      "healthcare",
      "hardware",
      "logistics",
      "artificial-intelligence",
    ],
  },
  {
    slug: "onlook",
    name: "Onlook",
    website: "https://onlook.com/",
    shortDescription: "Cursor for Designers",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/4c023f9010fb3a7f3e550c56a9283c477e6ca096.png",
    tags: [
      "design-tools",
      "developer-tools",
      "design",
      "artificial-intelligence",
    ],
  },
  {
    slug: "ontora",
    name: "Ontora",
    website: "https://ontora.com",
    shortDescription: "We help managers regain control of their organisations",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/72ed399e0fa809955793bc12b596f1f99d1d0570.png",
    tags: ["ai", "feedback", "robotic-process-automation"],
  },
  {
    slug: "pixley-ai",
    name: "Pixley AI",
    website: "https://pixleyai.com",
    shortDescription:
      "The first platform where parents & kids can co-create AI cartoon shows",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/3c23f15ce17b5566bb443e85decbca310887c19c.png",
    tags: ["ai-enhanced-learning", "generative-ai", "artificial-intelligence"],
  },
  {
    slug: "playablai",
    name: "Playabl.ai",
    website: "https://playabl.ai",
    shortDescription: "Prompt-to-play AI game builder for everyone",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/484b887f79a6e0d055be256cbacda5f8badb1317.png",
    tags: ["gaming", "b2b", "artificial-intelligence"],
  },
  {
    slug: "playvision",
    name: "PlayVision",
    website: "https://withplayvision.ai/",
    shortDescription: "AI Moneyball for Sports",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/6f6f00ebc0225a4cbce95222a692d004481c7b1f.png",
    tags: ["computer-vision", "sports-tech", "analytics", "ai"],
  },
  {
    slug: "primer",
    name: "Primer",
    website: "https://www.startprimer.com",
    shortDescription: "AI Product Demos",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/dfb9fdd67e9cec23e3f52f42df7e06dd89de9d57.png",
    tags: ["saas", "sales", "customer-support", "artificial-intelligence"],
  },
  {
    slug: "qomplement",
    name: "qomplement",
    website: "https://qomplement.com/",
    shortDescription: "AI Agents for Document Filling",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/1f74f218c2714dc8c9f24d72389a7bfa22f2b11d.png",
    tags: ["documents", "artificial-intelligence", "b2b"],
  },
  {
    slug: "rivet-design",
    name: "Rivet",
    website: "https://rivet.design/",
    shortDescription: "Visual editor to design in production code",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/27852a72a2c3864e7f9b2c7273ec39951f3e8d68.png",
    tags: ["design", "design-tools", "artificial-intelligence", "ai"],
  },
  {
    slug: "roark",
    name: "Roark",
    website: "https://roark.ai",
    shortDescription: "Test, monitor, and improve your voice agents",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/7eeed88cf20d9f39f503ec2708b6bf85e2e7e652.png",
    tags: ["conversational-ai", "analytics", "ai"],
  },
  {
    slug: "rovr",
    name: "Rovr",
    website: "https://www.withrovr.com/",
    shortDescription: "AI FDE Engine that runs your engineering workflows",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/be661dea8f47a3f8abccf2a96eac3ff45c4977d8.png",
    tags: ["developer-tools", "b2b", "artificial-intelligence"],
  },
  {
    slug: "runtime",
    name: "Runtime",
    website: "https://www.runtm.com/",
    shortDescription:
      "Guardrails and visibility to enable your team to ship with coding…",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/0801c6ba3a19486c65604a4c5feb759ee79e0f10.png",
    tags: ["developer-tools", "artificial-intelligence"],
  },
  {
    slug: "salus",
    name: "Salus",
    website: "https://www.usesalus.ai/",
    shortDescription:
      "Guardrails to validate your agent's actions before they execute",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/ab475a73fae950cedb2c238eb5a23d6a709d5cb2.png",
    tags: ["api", "b2b", "infrastructure", "ai", "developer-tools"],
  },
  {
    slug: "scoop",
    name: "Scoop",
    website: "https://scooplabs.ai",
    shortDescription: "Automating regulatory submissions for life sciences",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/70fc9c8245a9de2b245841faf07e0530dd3f51a1.png",
    tags: [
      "biotech",
      "biotechnology",
      "compliance",
      "b2b",
      "artificial-intelligence",
    ],
  },
  {
    slug: "sellraze",
    name: "SellRaze",
    website: "https://sellraze.com",
    shortDescription: "The fastest way to sell online.",
    founded: 2023,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/0d0c3af40b49318f2b71a98f2764633829b06a75.png",
    tags: ["marketplace", "e-commerce", "consumer", "ai"],
  },
  {
    slug: "semiotic",
    name: "Semiotic",
    website: "http://semiotic.com",
    shortDescription: "Studio-Grade Design at Scale",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/d4bdfd8767934d0004a0927458374ac99619350f.png",
    tags: ["ai", "design"],
  },
  {
    slug: "sourcebot",
    name: "Sourcebot",
    website: "https://www.sourcebot.dev/",
    shortDescription:
      "Helping humans and AI agents understand massive codebases",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/8dc3d95366a9f12c7989780cf364009423a55b54.png",
    tags: [
      "open-source",
      "b2b",
      "devsecops",
      "developer-tools",
      "artificial-intelligence",
    ],
  },
  {
    slug: "standout",
    name: "Standout",
    website: "https://standout.work",
    shortDescription: "The Hollywood agent for startup talent",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/0cae3b4c599e9e6ff92522ffbf541670c1a97669.png",
    tags: ["artificial-intelligence", "consumer", "careers", "recruiting"],
  },
  {
    slug: "testerarmy",
    name: "TesterArmy",
    website: "https://tester.army",
    shortDescription: "AI QA agent that tests code before it ships",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/2140ec31aaa09498a7c4c7a8559cd2f274b9d9e0.png",
    tags: ["ai"],
  },
  {
    slug: "the-context-company",
    name: "The Context Company",
    website: "https://thecontext.company",
    shortDescription: "Monitor AI agents and understand user behavior",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/897cd2d31bc7dc869e170422ebc8e24a66f3e2bc.png",
    tags: [
      "monitoring",
      "analytics",
      "b2b",
      "developer-tools",
      "artificial-intelligence",
    ],
  },
  {
    slug: "thesis",
    name: "Thesis",
    website: "https://thesislabs.ai",
    shortDescription: "An AI lab at your fingertips.",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/834b16b30c5de79bf9dbcd0a4819289bfa937936.png",
    tags: ["artificial-intelligence"],
  },
  {
    slug: "tinfoil",
    name: "Tinfoil",
    website: "https://tinfoil.sh",
    shortDescription:
      "Tinfoil makes your AI workflows secure, verifiable, and private.",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/dc74e71b1f792bb7e067be2feda82c554eaef27a.png",
    tags: [
      "b2b",
      "cybersecurity",
      "privacy",
      "artificial-intelligence",
      "security",
    ],
  },
  {
    slug: "truffle-ai",
    name: "Truffle AI",
    website: "https://www.trytruffle.ai/",
    shortDescription: "AWS for AI Agents",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/17f1a1e21672fa03c69b669feef31d2a59b2c849.png",
    tags: [
      "generative-ai",
      "ai-assistant",
      "developer-tools",
      "infrastructure",
      "artificial-intelligence",
    ],
  },
  {
    slug: "unsiloed-ai",
    name: "Unsiloed AI",
    website: "https://www.unsiloed.ai/",
    shortDescription: "API for parsing multimodal unstructured data",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/f9f85fd135a735334483a66e34f7d25f1c8f535c.png",
    tags: ["apis", "b2b", "infrastructure", "artificial-intelligence"],
  },
  {
    slug: "uplane",
    name: "Uplane",
    website: "https://uplane.com",
    shortDescription: "Replace marketing agencies with AI",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/f28d39fea2309ac2fc4d42b7be088ee964dccf6a.png",
    tags: [
      "artificial-intelligence",
      "saas",
      "b2b",
      "advertising",
      "analytics",
    ],
  },
  {
    slug: "woz",
    name: "Woz",
    website: "https://withwoz.com/",
    shortDescription:
      "AI platform enabling anyone to build and scale software businesses",
    founded: 2024,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/6c0c9ada6111e7b8097807a72d2e056755c4323f.png",
    tags: ["design", "no-code", "saas", "ai", "artificial-intelligence"],
  },
  {
    slug: "zarna",
    name: "Zarna",
    website: "https://www.zarnaai.com/",
    shortDescription: "AI Associates for Private Capital",
    founded: 2025,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/d20374e923bd141960c3c8fd2965f8288e95aa58.png",
    tags: ["investments", "ai"],
  },
  {
    slug: "zolvo",
    name: "Zolvo",
    website: "https://zolvo.com/",
    shortDescription: "AI that automates servicing for commercial lenders",
    founded: 2026,
    logoUrl:
      "https://bookface-images.s3.amazonaws.com/small_logos/13449379aadac83de276a47cb8ee88b50b55c4f8.png",
    tags: ["b2b", "lending", "artificial-intelligence"],
  },
]
