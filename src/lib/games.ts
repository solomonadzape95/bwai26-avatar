export type QuestionType =
  | 'tech logos'
  | 'scene to movie'
  | 'image to tech'
  | 'name that mascot'
  | 'zoomed in logos'
  | 'name that language'
  | 'emoji to movie'
  | 'emoji to phrase'
  | 'emoji to country'
  | 'quotes';

export type RenderKind = 'image' | 'code' | 'emoji' | 'quote' | 'icon';

export type Question = {
  id: number;
  type: QuestionType | string;
  difficulty: 'easy' | 'intermediate' | string;
  question: string;
  image_required: boolean;
  image_description: string | null;
  image_url?: string;
  answer: string;
};

export type Round = {
  round_title: string;
  questions: Question[];
};

export type TypeMeta = {
  label: string;
  prompt: string;
  render: RenderKind;
};

export const TYPE_META: Record<string, TypeMeta> = {
  'tech logos': { label: 'Tech Logo', prompt: 'What tech is this?', render: 'image' },
  'scene to movie': { label: 'Scene → Movie', prompt: 'Guess the movie', render: 'image' },
  'image to tech': { label: 'Image → Tech', prompt: 'What tech is this?', render: 'image' },
  'name that mascot': {
    label: 'Name That Mascot',
    prompt: 'Whose mascot is this?',
    render: 'image',
  },
  'zoomed in logos': {
    label: 'Zoomed-in Logo',
    prompt: 'Guess the logo',
    render: 'image',
  },
  'name that language': {
    label: 'Name That Language',
    prompt: 'What language is this code?',
    render: 'code',
  },
  'emoji to movie': { label: 'Emoji → Movie', prompt: 'Guess the movie', render: 'emoji' },
  'emoji to phrase': {
    label: 'Emoji → Phrase',
    prompt: 'Guess the phrase',
    render: 'emoji',
  },
  'emoji to country': {
    label: 'Emoji → Country',
    prompt: 'Guess the country',
    render: 'emoji',
  },
  quotes: { label: 'Famous Quote', prompt: 'What is this from?', render: 'quote' },
  'emoji to tech': {
    label: 'Emoji → Tech',
    prompt: 'What tech is this?',
    render: 'emoji',
  },
  'emoji to mascot': {
    label: 'Emoji → Mascot',
    prompt: 'Whose mascot is this?',
    render: 'emoji',
  },
  'icon to tech': {
    label: 'Icon → Tech',
    prompt: 'What tech is this?',
    render: 'icon',
  },
  'icon to mascot': {
    label: 'Icon → Mascot',
    prompt: 'Whose icon is this?',
    render: 'icon',
  },
  'zoomed icon': {
    label: 'Zoomed-in Icon',
    prompt: 'Guess the brand',
    render: 'icon',
  },
};

export const FALLBACK_META: TypeMeta = {
  label: 'Mystery',
  prompt: 'Guess what this is',
  render: 'emoji',
};

export function metaFor(type: string): TypeMeta {
  return TYPE_META[type] ?? FALLBACK_META;
}

export const ROUND_FILES: Array<{ key: string; file: string }> = [
  { key: '1', file: 'first' },
  { key: '2', file: 'second' },
  { key: '3', file: 'third' },
  { key: '4', file: 'fouth' },
  { key: '5', file: 'fifth' },
  { key: '6', file: 'sixth' },
];

function isQuestion(v: unknown): v is Question {
  if (!v || typeof v !== 'object') return false;
  const q = v as Record<string, unknown>;
  return (
    typeof q.id === 'number' &&
    typeof q.type === 'string' &&
    typeof q.question === 'string' &&
    typeof q.image_required === 'boolean' &&
    typeof q.answer === 'string'
  );
}

export async function loadRound(file: string): Promise<Round> {
  const res = await fetch(`/games/${file}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load round ${file}: HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Invalid round file ${file}: expected non-empty array`);
  }
  const first = data[0] as Record<string, unknown>;
  if (typeof first.round_title !== 'string' || !Array.isArray(first.questions)) {
    throw new Error(`Invalid round file ${file}: missing round_title or questions`);
  }
  const questions = first.questions.filter(isQuestion);
  if (questions.length === 0) {
    throw new Error(`Invalid round file ${file}: no valid questions`);
  }
  return { round_title: first.round_title, questions };
}
