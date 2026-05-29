import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api';

type ResultRow = {
  rank: number;
  projectName: string;
  submitterName: string;
  submitterEmail: string;
  finalScore: number;
  source: 'human' | 'ai';
};

type Slide =
  | { kind: 'title' }
  | { kind: 'ordinal'; rank: number }
  | { kind: 'card'; row: ResultRow };

const ORDINALS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
};

export default function ResultsPage() {
  const [published, setPublished] = useState<boolean | null>(null);
  const [top, setTop] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await api.results();
        if (cancelled) return;
        setPublished(r.published);
        setTop(r.top);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'failed to load');
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (error) return <ComingSoonCard message={error} />;
  if (published === null) return <ComingSoonCard message="Loading…" muted />;
  if (!published) return <ComingSoonCard />;

  const slides = buildSlides(top);
  if (slides.length <= 1) return <ComingSoonCard message="No judged submissions yet." />;
  return <Slideshow slides={slides} />;
}

function buildSlides(top: ResultRow[]): Slide[] {
  const slides: Slide[] = [{ kind: 'title' }];
  const reverse = [...top].sort((a, b) => b.rank - a.rank); // 5th → 1st
  for (const row of reverse) {
    slides.push({ kind: 'ordinal', rank: row.rank });
    slides.push({ kind: 'card', row });
  }
  return slides;
}

function ComingSoonCard({
  message = 'Results coming soon.',
  muted,
}: {
  message?: string;
  muted?: boolean;
}) {
  return (
    <div className="color-cycle flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center rounded-3xl px-6 py-16 text-center text-white shadow-sm sm:px-12 sm:py-24">
      <div className="w-full max-w-4xl">
        <div className="text-sm font-bold uppercase tracking-[0.5em] text-white/80">
          Results
        </div>
        <h2 className="mt-4 text-5xl font-semibold sm:text-7xl lg:text-8xl">
          {muted ? message : 'Coming soon'}
        </h2>
        {!muted && (
          <p className="mt-6 text-lg text-white/90 sm:text-2xl">{message}</p>
        )}
        <Link
          to="/hackathon"
          className="mt-10 inline-block rounded-full bg-white/20 px-8 py-3 text-base font-semibold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/30 sm:px-10 sm:py-4 sm:text-lg"
        >
          Back to hub →
        </Link>
      </div>
    </div>
  );
}

function Slideshow({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, slides.length - 1)),
    [slides.length],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const slide = slides[index];
  const atEnd = index === slides.length - 1;

  return (
    <div
      onClick={next}
      className="color-cycle relative flex min-h-[calc(100vh-12rem)] cursor-pointer items-center justify-center overflow-hidden rounded-3xl px-6 py-16 text-center text-white shadow-sm sm:px-12"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-7xl"
        >
          {slide.kind === 'title' && <TitleSlide />}
          {slide.kind === 'ordinal' && <OrdinalSlide rank={slide.rank} />}
          {slide.kind === 'card' && <CardSlide row={slide.row} />}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex items-center justify-between px-6 text-xs uppercase tracking-[0.4em] text-white/60 sm:px-12 sm:text-sm">
        <span>
          Slide {index + 1} / {slides.length}
        </span>
        <span>{atEnd ? '· end ·' : 'press → for next'}</span>
      </div>
    </div>
  );
}

function TitleSlide() {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <div className="text-sm font-bold uppercase tracking-[0.5em] text-white/80 sm:text-base">
        Build with AI 2026
      </div>
      <h2 className="mt-6 text-7xl font-semibold leading-[1] sm:text-9xl lg:text-[12rem]">
        Results
      </h2>
      <p className="mt-8 text-lg text-white/90 sm:text-2xl">Top 5 of the hackathon</p>
    </motion.div>
  );
}

function OrdinalSlide({ rank }: { rank: number }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 120 }}
      className="flex flex-col items-center"
    >
      <div className="text-sm font-bold uppercase tracking-[0.5em] text-white/80 sm:text-base">
        Place
      </div>
      <div className="mt-2 font-mono font-bold leading-none text-[12rem] sm:text-[18rem] lg:text-[22rem]">
        {ORDINALS[rank] ?? `${rank}`}
      </div>
    </motion.div>
  );
}

function CardSlide({ row }: { row: ResultRow }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="text-sm font-bold uppercase tracking-[0.5em] text-white/80 sm:text-base">
          {ORDINALS[row.rank] ?? `${row.rank}`} Place
        </div>
        <h2 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-7xl lg:text-8xl">
          {row.projectName}
        </h2>
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-2xl text-white/90 sm:text-4xl"
      >
        by <span className="font-semibold text-white">{row.submitterName}</span>
      </motion.p>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-lg text-white/80 sm:text-2xl"
      >
        {row.submitterEmail}
      </motion.p>
    </div>
  );
}
