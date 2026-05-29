import { useEffect, useState } from 'react';
import { api, getAdminToken, setAdminToken } from '../lib/api';

type Props = {
  children: React.ReactNode;
};

type State = 'checking' | 'unauthed' | 'authed';

export default function RequireAdmin({ children }: Props) {
  const [state, setState] = useState<State>(getAdminToken() ? 'checking' : 'unauthed');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  useEffect(() => {
    if (state !== 'checking') return;
    api
      .finalists()
      .then(() => setState('authed'))
      .catch(() => {
        setAdminToken(null);
        setState('unauthed');
      });
  }, [state]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoginPending(true);
    setLoginError(null);
    try {
      const { token } = await api.adminLogin(password);
      setAdminToken(token);
      setPassword('');
      setState('authed');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'login failed');
    } finally {
      setLoginPending(false);
    }
  }

  if (state === 'checking') {
    return <p className="mx-auto max-w-md text-center text-sm text-neutral-500">Checking session…</p>;
  }

  if (state === 'unauthed') {
    return (
      <form
        onSubmit={submit}
        className="mx-auto max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
      >
        <div className="text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-bwai-blue">
            Admin
          </div>
          <h2 className="mt-1 text-xl font-semibold text-bwai-ink">Sign in</h2>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          className="form-input"
        />
        {loginError && <p className="text-xs text-bwai-red">{loginError}</p>}
        <button
          type="submit"
          disabled={!password || loginPending}
          className="w-full rounded-full bg-bwai-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-bwai-blue disabled:opacity-50"
        >
          {loginPending ? 'Signing in…' : 'Enter'}
        </button>
      </form>
    );
  }

  return <>{children}</>;
}
