export type ResourceTier = 'compulsory' | 'recommended' | 'encouraged';

export type Resource = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  tier: ResourceTier;
};

export const TIER_META: Record<
  ResourceTier,
  { label: string; blurb: string; order: number }
> = {
  compulsory: {
    label: 'Compulsory',
    blurb: 'You must build with these. Submissions that skip them get marked down.',
    order: 0,
  },
  recommended: {
    label: 'Recommended',
    blurb: 'The fastest path to a working AI demo. Use these unless you have a reason not to.',
    order: 1,
  },
  encouraged: {
    label: 'Encouraged',
    blurb: 'Pick these up if you need them. Not required, but they’ll save you time.',
    order: 2,
  },
};

export const RESOURCES: Resource[] = [
  {
    name: 'Antigravity',
    tagline: 'Agentic IDE from Google',
    description:
      'Google’s agent-first development environment. Hand it a task and it plans, edits, and runs code across files for you. Required for this hackathon.',
    url: 'https://antigravity.google',
    tier: 'compulsory',
  },
  {
    name: 'Google AI Studio',
    tagline: 'Free Gemini API key in 30 seconds',
    description:
      'The fastest way to get a Gemini API key, prototype prompts, and try multimodal inputs before wiring anything into code.',
    url: 'https://aistudio.google.com/',
    tier: 'recommended',
  },
  {
    name: 'Gemini API',
    tagline: 'The model you’ll most likely build on',
    description:
      'Multimodal: text, image, audio, and video understanding. Native structured output. Generous free tier through AI Studio.',
    url: 'https://ai.google.dev/gemini-api/docs',
    tier: 'recommended',
  },
  {
    name: 'Gemini CLI',
    tagline: 'Open-source agent in your terminal',
    description:
      'Google’s open-source AI agent for the command line. Free tier with a huge context window, file edits, web search, and tool use.',
    url: 'https://github.com/google-gemini/gemini-cli',
    tier: 'recommended',
  },
  {
    name: 'Stitch',
    tagline: 'Generate UI designs from a prompt',
    description:
      'Google Labs’ AI design tool. Describe a screen in natural language and get editable mocks plus the code to ship them. Great for nailing the look before you wire anything up.',
    url: 'https://stitch.withgoogle.com/',
    tier: 'recommended',
  },
  {
    name: 'Gemini for Developers (docs)',
    tagline: 'Cookbooks, quickstarts, and SDK refs',
    description:
      'Hub for function calling, structured output, vision, and the full set of code samples. Bookmark this.',
    url: 'https://ai.google.dev/',
    tier: 'recommended',
  },
  {
    name: 'Firebase',
    tagline: 'Auth, database, hosting, in minutes',
    description:
      'Auth, Firestore, Storage, and Hosting on a generous free tier. Drop-in backend so you can focus on the AI bits.',
    url: 'https://firebase.google.com/',
    tier: 'encouraged',
  },
  {
    name: 'Firebase Studio',
    tagline: 'Full-stack workspace in the browser',
    description:
      'Cloud IDE (the new Project IDX) that scaffolds, runs, and deploys full-stack apps with Gemini baked in. Great if your laptop is struggling.',
    url: 'https://firebase.studio/',
    tier: 'encouraged',
  },
  {
    name: 'Vertex AI',
    tagline: 'Gemini + Imagen + Veo at scale',
    description:
      'Google Cloud’s managed AI platform. Use it when you outgrow the free tier or need Imagen (images) or Veo (video) generation.',
    url: 'https://cloud.google.com/vertex-ai',
    tier: 'encouraged',
  },
  {
    name: 'Cloud Run',
    tagline: 'Deploy a container in one command',
    description:
      'Run any HTTP service serverless. Free tier covers most demos. Pairs well with the Gemini API for AI backends.',
    url: 'https://cloud.google.com/run',
    tier: 'encouraged',
  },
  {
    name: 'NotebookLM',
    tagline: 'Grounded notebooks with sources',
    description:
      'Upload PDFs / docs / videos and chat with them. Useful for research, summarizing papers, and turning briefs into product specs.',
    url: 'https://notebooklm.google.com/',
    tier: 'encouraged',
  },
  {
    name: 'Google Cloud free tier',
    tagline: '$300 in credits + always-free services',
    description:
      'New accounts get $300 in free credits plus always-free quotas on many services. Worth claiming before the hackathon.',
    url: 'https://cloud.google.com/free',
    tier: 'encouraged',
  },
];

export function groupedByTier(): Array<{
  tier: ResourceTier;
  meta: (typeof TIER_META)[ResourceTier];
  items: Resource[];
}> {
  const groups = new Map<ResourceTier, Resource[]>();
  for (const r of RESOURCES) {
    const arr = groups.get(r.tier) ?? [];
    arr.push(r);
    groups.set(r.tier, arr);
  }
  return Array.from(groups.entries())
    .map(([tier, items]) => ({ tier, meta: TIER_META[tier], items }))
    .sort((a, b) => a.meta.order - b.meta.order);
}
