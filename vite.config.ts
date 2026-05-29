import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

type Route = { pattern: RegExp; paramNames: string[]; file: string };

function discoverRoutes(apiRoot: string): Route[] {
  const routes: Route[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('_')) continue; // skip _lib
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.ts')) {
        const rel = relative(apiRoot, full).replace(/\.ts$/, '');
        const segments = rel.split(/[\\/]/);
        const paramNames: string[] = [];
        const regex = segments
          .map((seg) => {
            const m = seg.match(/^\[(.+)\]$/);
            if (m) {
              paramNames.push(m[1]);
              return '([^/]+)';
            }
            return seg.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          })
          .join('/');
        routes.push({
          pattern: new RegExp(`^/api/${regex}/?$`),
          paramNames,
          file: full,
        });
      }
    }
  }
  walk(apiRoot);
  return routes;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return undefined;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function shimResponse(res: ServerResponse) {
  const r = res as ServerResponse & {
    status?: (code: number) => typeof r;
    json?: (body: unknown) => typeof r;
    send?: (body: unknown) => typeof r;
  };
  r.status = (code: number) => {
    r.statusCode = code;
    return r;
  };
  r.json = (body: unknown) => {
    if (!r.getHeader('Content-Type')) r.setHeader('Content-Type', 'application/json');
    r.end(JSON.stringify(body));
    return r;
  };
  r.send = (body: unknown) => {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      r.end(body);
    } else {
      r.json!(body);
    }
    return r;
  };
  return r;
}

function apiPlugin(): Plugin {
  const apiRoot = join(__dirname, 'api');

  return {
    name: 'vite-plugin-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        const host = req.headers.host || 'localhost';
        const url = new URL(req.url, `http://${host}`);

        // Re-discover every request so files added after dev started are picked up.
        const routes = discoverRoutes(apiRoot);
        const match = routes.find((r) => r.pattern.test(url.pathname));
        if (!match) return next();

        const m = match.pattern.exec(url.pathname)!;
        const query: Record<string, string> = {};
        match.paramNames.forEach((name, i) => {
          query[name] = decodeURIComponent(m[i + 1]);
        });
        url.searchParams.forEach((v, k) => {
          query[k] = v;
        });

        try {
          const body = await readJsonBody(req);
          (req as IncomingMessage & { query: unknown; body: unknown }).query = query;
          (req as IncomingMessage & { query: unknown; body: unknown }).body = body;

          const mod = await server.ssrLoadModule(match.file);
          const handler = (mod as { default?: unknown }).default;
          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `no default export in ${match.file}` }));
            return;
          }
          await (handler as (req: unknown, res: unknown) => Promise<void>)(
            req,
            shimResponse(res),
          );
        } catch (err) {
          console.error(`[api] ${url.pathname} failed:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({ error: err instanceof Error ? err.message : 'failed' }),
            );
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load every env var (no VITE_ prefix filter) so api/* handlers see process.env.*
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
  return {
    plugins: [react(), apiPlugin()],
    build: {
      chunkSizeWarningLimit: 2000,
      assetsInlineLimit: 0,
    },
    server: {
      fs: { strict: false },
    },
  };
});
