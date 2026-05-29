import { Link } from 'react-router-dom';
import BigCountdown from '../../components/BigCountdown';
import { endsAtDate, phaseOf, useTimerState } from '../../lib/timerState';

export default function TimerPage() {
  const { state, error } = useTimerState();
  const phase = phaseOf(state);
  const endsAt = endsAtDate(state);
  const durationSeconds = state?.durationSeconds ?? 0;

  if (error && !state) {
    return (
      <Panel>
        <h2 className="text-4xl font-semibold sm:text-6xl">Couldn’t load the timer</h2>
        <p className="mt-6 text-lg text-white/90 sm:text-2xl">{error}</p>
      </Panel>
    );
  }

  if (phase === 'loading') {
    return (
      <Panel>
        <p className="text-2xl text-white/90 sm:text-3xl">Loading…</p>
      </Panel>
    );
  }

  if (phase === 'not-started') {
    return (
      <Panel>
        <Eyebrow>Standing by</Eyebrow>
        <div className="mt-10 sm:mt-14">
          <BigCountdown
            durationSeconds={durationSeconds}
            endsAt={null}
            mode="frozen"
            variant="public"
            tone="light"
          />
        </div>
      </Panel>
    );
  }

  if (phase === 'ended') {
    return (
      <Panel>
        <Eyebrow>Time’s up</Eyebrow>
        <h2 className="mt-4 text-5xl font-semibold sm:text-7xl lg:text-9xl">
          The hackathon has ended
        </h2>
        <p className="mt-6 text-lg text-white/90 sm:text-2xl">
          Submissions are closed. Finalists will be announced shortly.
        </p>
        <Link
          to="/hackathon"
          className="mt-10 inline-block rounded-full bg-white/20 px-8 py-3 text-base font-semibold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/30 sm:px-10 sm:py-4 sm:text-lg"
        >
          Back to hub →
        </Link>
      </Panel>
    );
  }

  return (
    <Panel>
      <Eyebrow>Hackathon live</Eyebrow>
      <div className="mt-10 sm:mt-14">
        <BigCountdown
          durationSeconds={durationSeconds}
          endsAt={endsAt}
          mode="running"
          variant="public"
          tone="light"
        />
      </div>
      <p className="mt-12 text-base text-white/85 sm:text-xl">
        Submissions close{' '}
        <span className="font-semibold text-white">{formatLong(endsAt!)}</span>
      </p>
      <Link
        to="/hackathon/submit"
        className="mt-10 inline-block rounded-full bg-white/20 px-8 py-3 text-base font-semibold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/30 sm:px-10 sm:py-4 sm:text-lg"
      >
        Submit your project →
      </Link>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="color-cycle flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center rounded-3xl px-6 py-16 text-center text-white shadow-sm sm:px-12 sm:py-24">
      <div className="w-full max-w-7xl">{children}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-bold uppercase tracking-[0.5em] text-white/80 sm:text-base">
      {children}
    </div>
  );
}

function formatLong(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
