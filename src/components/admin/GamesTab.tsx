import { useCallback, useEffect, useState } from 'react';
import { loadRound, ROUND_FILES, type Round } from '../../lib/games';
import QuestionStage from './games/QuestionStage';

type Phase = 'type' | 'question' | 'answer';
type Scores = { left: number; right: number };

export default function GamesTab() {
  const [round, setRound] = useState<Round | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('type');
  const [scores, setScores] = useState<Scores>({ left: 0, right: 0 });
  const [complete, setComplete] = useState(false);

  function startRound(file: string) {
    setLoading(file);
    setError(null);
    loadRound(file)
      .then((r) => {
        setRound(r);
        setQuestionIndex(0);
        setPhase('type');
        setScores({ left: 0, right: 0 });
        setComplete(false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'failed to load'))
      .finally(() => setLoading(null));
  }

  function exitRound() {
    if (!confirm('Exit this round? Scores will reset.')) return;
    setRound(null);
  }

  const next = useCallback(() => {
    if (!round || complete) return;
    if (phase === 'type') {
      setPhase('question');
      return;
    }
    if (phase === 'question') {
      if (questionIndex >= round.questions.length - 1) {
        setComplete(true);
        return;
      }
      setQuestionIndex((i) => i + 1);
      setPhase('type');
      return;
    }
    if (questionIndex >= round.questions.length - 1) {
      setComplete(true);
      return;
    }
    setQuestionIndex((i) => i + 1);
    setPhase('type');
  }, [round, complete, phase, questionIndex]);

  const showAnswer = useCallback(() => {
    if (!round || complete) return;
    setPhase('answer');
  }, [round, complete]);

  const previousQuestion = useCallback(() => {
    if (!round) return;
    setComplete(false);
    setQuestionIndex((i) => Math.max(0, i - 1));
    setPhase('type');
  }, [round]);

  useEffect(() => {
    if (!round) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        showAnswer();
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') {
        e.preventDefault();
        previousQuestion();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        exitRound();
      } else if (e.key === '1') {
        e.preventDefault();
        setScores((s) => ({ ...s, left: s.left + 1 }));
      } else if (e.key === '2') {
        e.preventDefault();
        setScores((s) => ({ ...s, right: s.right + 1 }));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [round, next, showAnswer, previousQuestion]);

  if (!round) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-bwai-blue">
            Games
          </h3>
          <h2 className="mt-1 text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
            Pick a round
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            10 questions per round. <kbd>Space</kbd> advances, <kbd>A</kbd> shows the answer,{' '}
            <kbd>1</kbd> / <kbd>2</kbd> score the teams. Esc exits.
          </p>
        </div>
        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-bwai-red dark:bg-red-950/40">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROUND_FILES.map((r, i) => (
            <button
              key={r.file}
              onClick={() => startRound(r.file)}
              disabled={loading !== null}
              className="group flex flex-col items-start gap-2 rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-neutral-200 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 dark:bg-neutral-900 dark:ring-neutral-800"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-bwai-blue">
                Round {i + 1}
              </span>
              <span className="text-2xl font-semibold text-bwai-ink dark:text-neutral-100">
                Face-Off Set {i + 1}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {loading === r.file ? 'Loading…' : `/games/${r.file}.json`}
              </span>
              <span className="mt-2 text-xs font-semibold text-neutral-500 group-hover:text-bwai-blue dark:text-neutral-400">
                Start →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const question = round.questions[questionIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950">
      <header className="flex flex-shrink-0 items-center justify-between gap-3 px-6 py-5 sm:px-12">
        <div className="text-sm font-bold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
          {complete
            ? 'Round complete'
            : `Question ${questionIndex + 1} / ${round.questions.length}`}
        </div>
        <button
          onClick={exitRound}
          className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-bwai-ink ring-1 ring-neutral-200 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800 dark:hover:bg-neutral-800"
        >
          Exit (Esc)
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-48 sm:px-12">
        {complete ? (
          <CompleteScreen scores={scores} onBack={() => setRound(null)} />
        ) : (
          <QuestionStage question={question} phase={phase} />
        )}
      </div>

      {!complete && (
        <nav className="pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 sm:bottom-12">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={previousQuestion}
              disabled={questionIndex === 0 && phase === 'type'}
              className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-bwai-ink ring-1 ring-neutral-200 hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800"
            >
              ← Prev
            </button>
            {phase !== 'answer' && (
              <button
                onClick={showAnswer}
                className="rounded-full bg-bwai-yellow px-5 py-2 text-xs font-bold uppercase tracking-wide text-bwai-ink hover:brightness-110"
              >
                Show answer (A)
              </button>
            )}
            <button
              onClick={next}
              className="rounded-full bg-bwai-ink px-6 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-bwai-blue dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
            >
              Next (Space)
            </button>
          </div>
        </nav>
      )}

      <ScoreCorner
        side="left"
        score={scores.left}
        onIncrement={() => setScores((s) => ({ ...s, left: s.left + 1 }))}
        onDecrement={() => setScores((s) => ({ ...s, left: Math.max(0, s.left - 1) }))}
      />
      <ScoreCorner
        side="right"
        score={scores.right}
        onIncrement={() => setScores((s) => ({ ...s, right: s.right + 1 }))}
        onDecrement={() => setScores((s) => ({ ...s, right: Math.max(0, s.right - 1) }))}
      />
    </div>
  );
}

function ScoreCorner({
  side,
  score,
  onIncrement,
  onDecrement,
}: {
  side: 'left' | 'right';
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const color = side === 'left' ? 'text-bwai-blue' : 'text-bwai-red';
  const align =
    side === 'left' ? 'left-8 items-start text-left' : 'right-8 items-end text-right';

  return (
    <div className={`absolute bottom-6 z-20 flex flex-col gap-2 sm:bottom-8 ${align}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={onIncrement}
        onContextMenu={(e) => {
          e.preventDefault();
          onDecrement();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onIncrement();
          }
        }}
        className={`cursor-pointer select-none font-mono font-bold leading-none tabular-nums text-[7rem] outline-none transition-transform hover:scale-[1.02] sm:text-[10rem] lg:text-[12rem] ${color}`}
        title={`${side === 'left' ? 'Press 1' : 'Press 2'} or click · right-click to subtract`}
      >
        {score}
      </div>
      <button
        type="button"
        onClick={onDecrement}
        disabled={score === 0}
        className={`text-xs font-bold uppercase tracking-[0.3em] transition-opacity hover:opacity-100 disabled:opacity-30 sm:text-sm ${color} opacity-70`}
      >
        − 1
      </button>
    </div>
  );
}

function CompleteScreen({ scores, onBack }: { scores: Scores; onBack: () => void }) {
  let winner: { label: string; color: string };
  if (scores.left === scores.right) {
    winner = { label: 'Tie', color: 'text-bwai-ink dark:text-neutral-100' };
  } else if (scores.left > scores.right) {
    winner = { label: 'Blue wins', color: 'text-bwai-blue' };
  } else {
    winner = { label: 'Red wins', color: 'text-bwai-red' };
  }
  return (
    <div className="flex flex-col items-center gap-12 text-center text-bwai-ink dark:text-neutral-100">
      <div className="text-sm font-bold uppercase tracking-[0.5em] text-neutral-500 dark:text-neutral-400 sm:text-base">
        Round complete
      </div>
      <h2
        className={`text-6xl font-semibold leading-[0.95] sm:text-9xl ${winner.color}`}
      >
        {winner.label}
      </h2>
      <div className="flex flex-wrap items-end justify-center gap-x-20 gap-y-8">
        <div className="font-mono font-bold leading-none tabular-nums text-bwai-blue text-[6rem] sm:text-[10rem]">
          {scores.left}
        </div>
        <div className="font-mono font-bold leading-none tabular-nums text-bwai-red text-[6rem] sm:text-[10rem]">
          {scores.right}
        </div>
      </div>
      <button
        onClick={onBack}
        className="rounded-full bg-bwai-ink px-8 py-3 text-base font-semibold text-white hover:bg-bwai-blue sm:px-10 sm:py-4 sm:text-lg dark:bg-white dark:text-bwai-ink dark:hover:bg-bwai-blue dark:hover:text-white"
      >
        Back to rounds
      </button>
    </div>
  );
}
