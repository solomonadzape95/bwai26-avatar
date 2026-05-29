import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question } from '../../../lib/games';
import { metaFor } from '../../../lib/games';
import { BRAND_COLORS, ICON_MAP } from '../../../lib/gameIcons';

type Phase = 'type' | 'question' | 'answer';

type Props = {
  question: Question;
  phase: Phase;
};

export default function QuestionStage({ question, phase }: Props) {
  const meta = metaFor(question.type);

  return (
    <div className="relative flex w-full flex-1 items-center justify-center px-6 text-center text-bwai-ink dark:text-neutral-100 sm:px-12">
      <AnimatePresence mode="wait">
        {phase === 'type' && (
          <motion.div
            key="type"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 110 }}
            className="space-y-8"
          >
            <div className="text-sm font-bold uppercase tracking-[0.5em] text-neutral-500 dark:text-neutral-400 sm:text-base">
              Question type
            </div>
            <h2 className="font-bold leading-[0.95] text-[6rem] sm:text-[10rem] lg:text-[14rem]">
              {meta.label}
            </h2>
            <p className="text-base text-neutral-500 dark:text-neutral-400 sm:text-xl">
              Press Space / → to reveal
            </p>
          </motion.div>
        )}

        {(phase === 'question' || phase === 'answer') && (
          <motion.div
            key="question"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex w-full max-w-6xl flex-col items-center gap-8"
          >
            <div className="text-sm font-bold uppercase tracking-[0.5em] text-neutral-500 dark:text-neutral-400 sm:text-base">
              {meta.prompt}
            </div>
            <QuestionBody question={question} phase={phase} />
            {phase === 'answer' && <AnswerReveal answer={question.answer} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionBody({ question, phase }: { question: Question; phase: Phase }) {
  const meta = metaFor(question.type);

  if (meta.render === 'image') {
    if (!question.image_url || question.image_url.length === 0) {
      return (
        <div className="flex max-w-3xl flex-col items-center gap-3 border-2 border-dashed border-neutral-300 px-8 py-10 dark:border-neutral-700">
          <div className="text-sm font-bold uppercase tracking-[0.4em] text-neutral-500 dark:text-neutral-400">
            Image pending
          </div>
          <p className="text-2xl text-bwai-ink dark:text-neutral-100 sm:text-3xl">
            {question.image_description ?? 'Drop the image into the JSON.'}
          </p>
        </div>
      );
    }

    const showHalf = question.type === 'zoomed in logos' && phase === 'question';
    if (showHalf) {
      const side: 'left' | 'right' = question.id % 2 === 0 ? 'left' : 'right';
      return <HalfImage url={question.image_url} alt="" side={side} />;
    }

    return (
      <img
        src={question.image_url}
        alt={question.image_description ?? ''}
        className="max-h-[60vh] w-auto object-contain"
      />
    );
  }

  if (meta.render === 'code') {
    return (
      <pre className="w-full max-w-5xl whitespace-pre-wrap break-words rounded-2xl bg-bwai-ink p-6 text-left font-mono text-xl leading-relaxed text-white sm:p-10 sm:text-2xl lg:text-3xl">
        <code>{question.question}</code>
      </pre>
    );
  }

  if (meta.render === 'quote') {
    return (
      <blockquote className="max-w-5xl text-3xl italic leading-snug text-bwai-ink dark:text-neutral-100 sm:text-5xl lg:text-6xl">
        {question.question}
      </blockquote>
    );
  }

  if (meta.render === 'icon') {
    const Icon = ICON_MAP[question.question];
    if (!Icon) {
      return (
        <div className="rounded-2xl border-2 border-dashed border-bwai-red px-6 py-4 text-bwai-red">
          Unknown icon: <code>{question.question}</code>
        </div>
      );
    }
    const color = BRAND_COLORS[question.question] ?? 'currentColor';
    const showZoomed = question.type === 'zoomed icon' && phase === 'question';
    if (showZoomed) {
      return (
        <div
          className="overflow-hidden"
          style={{ width: 'min(40vh, 40vw)', height: 'min(40vh, 40vw)', color }}
        >
          <Icon
            style={{
              width: 'min(80vh, 80vw)',
              height: 'min(80vh, 80vw)',
              marginLeft: 'min(-20vh, -20vw)',
              marginTop: 'min(-22vh, -22vw)',
              display: 'block',
            }}
          />
        </div>
      );
    }
    return (
      <div style={{ color }}>
        <Icon style={{ width: 'min(45vh, 45vw)', height: 'min(45vh, 45vw)' }} />
      </div>
    );
  }

  return (
    <div className="font-bold leading-[1] text-[5rem] sm:text-[8rem] lg:text-[10rem]">
      {question.question}
    </div>
  );
}

function HalfImage({
  url,
  alt,
  side,
}: {
  url: string;
  alt: string;
  side: 'left' | 'right';
}) {
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const aspect = dim ? dim.w / dim.h : 1;
  // Height is fixed; width = half of the image's rendered width at that height.
  const widthExpr = dim
    ? `min(45vh, calc(55vh * ${aspect} / 2))`
    : `min(28vh, 28vw)`;
  const heightExpr = dim
    ? `min(55vh, calc((45vh * 2) / ${aspect}))`
    : `min(55vh, 55vw)`;
  return (
    <div
      className="overflow-hidden"
      style={{ width: widthExpr, height: heightExpr }}
    >
      <img
        src={url}
        alt={alt}
        onLoad={(e) =>
          setDim({
            w: e.currentTarget.naturalWidth,
            h: e.currentTarget.naturalHeight,
          })
        }
        style={{
          height: '100%',
          width: 'auto',
          maxWidth: 'none',
          display: 'block',
          objectFit: 'cover',
          marginLeft: side === 'right' && dim ? `calc(-1 * ${widthExpr})` : '0',
        }}
      />
    </div>
  );
}

function AnswerReveal({ answer }: { answer: string }) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 120 }}
      className="mt-4 flex max-w-5xl flex-col items-center gap-3 rounded-3xl bg-bwai-yellow px-8 py-6 text-bwai-ink shadow-xl sm:px-12 sm:py-8"
    >
      <div className="text-xs font-bold uppercase tracking-[0.5em] sm:text-sm">Answer</div>
      <div className="text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">{answer}</div>
    </motion.div>
  );
}
