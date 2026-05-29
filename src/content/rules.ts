export type RuleTile = {
  heading: string;
  body: string;
  bullets?: string[];
};

export const RULES_INTRO =
  'One Hour. Build something useful with AI. Ship code. Read the rules before you start.';

export const RULES_TILES: RuleTile[] = [
  {
    heading: 'Eligibility',
    body: 'Open to all attendees of Build with AI 2026 at UNN. You don’t have to be a student. Mentors and organizers may not compete.',
  },
  {
    heading: 'Teams',
    body: 'Solo or teams of up to 3. One submission per team. You may not be on more than one team.',
  },
  {
    heading: 'What you build',
    body: 'Anything that meaningfully integrates AI — web app, mobile, CLI, browser extension, hardware demo, all fair game.',
    bullets: [
      'Code must be written during the hackathon window.',
      'Pre-existing boilerplate, design systems, and open source are allowed.',
      'AI-generated code is allowed — flex it in your README.',
    ],
  },
  {
    heading: 'What you submit',
    body: 'Every submission needs all four:',
    bullets: [
      'Working demo (deployed link or runnable repo).',
      'Public GitHub repo with a clear README.',
      'Project name + 100–2000 character overview.',
      '1–5 screenshots that show it actually working.',
    ],
  },
  {
    heading: 'Judging',
    body: 'Two stages. Gemini scores every submission across 6 weighted metrics. The top 10 scores advance to live human judging by mentors and organizers.',
  },
  {
    heading: 'Metrics',
    body: 'Your project is scored on:',
    bullets: [
      'Implementation Quality (25%)',
      'AI Integration (20%)',
      'Idea Reasonability (15%)',
      'Innovation (15%)',
      'Real-world Impact (15%)',
      'Presentation Quality (10%)',
    ],
  },
  {
    heading: 'Code of conduct',
    body: 'Be excellent to each other. Harassment, plagiarism, and hostile behavior get you removed without refund of swag. If something feels off, talk to an organizer.',
  },
  {
    heading: 'IP',
    body: 'You keep ownership of everything you build. GDGOCUNN may showcase finalist submissions publicly.',
  },
];
