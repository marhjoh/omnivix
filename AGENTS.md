# Omnivix

A Next.js app on Vercel that turns public GitHub data and quotes into downloadable profile banners. No user accounts.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Stack

Your training data is older than this stack. Check the current docs before using an API from memory; exact versions are in `package.json`.

| Library                     | Docs                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| Next.js 16 (App Router)     | `node_modules/next/dist/docs/` (matches the installed version)                 |
| React 19                    | [react.dev/llms.txt](https://react.dev/llms.txt)                               |
| Tailwind CSS 4              | [tailwindcss.com/docs](https://tailwindcss.com/docs)                           |
| Effect 4 (server only)      | `node_modules/effect/AGENTS.md` and `ai-docs/` (matches the installed version) |
| Vitest 5                    | [vitest.dev/llms.txt](https://vitest.dev/llms.txt)                             |
| Playwright                  | [playwright.dev/docs](https://playwright.dev/docs/intro)                       |
| Upstash Redis and Ratelimit | [upstash.com/docs/llms.txt](https://upstash.com/docs/llms.txt)                 |
| framer-motion               | [motion.dev/llms.txt](https://motion.dev/llms.txt)                             |
| lucide-react                | [lucide.dev/llms.txt](https://lucide.dev/llms.txt)                             |

TypeScript 6 and Node 24. Use `pnpm` only; `pnpm-lock.yaml` is the source of truth. Bump Node in `engines.node`, `.github/workflows/ci.yml` and `@types/node` together.

## Commands

- `pnpm dev`: dev server at http://localhost:3000 (needs `GITHUB_TOKEN` in `.env.local`)
- `pnpm test`: Vitest; tests sit next to the code as `src/**/*.test.ts`
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format`

## Layout

- `app/`: routes only (pages, API handlers, metadata). Keep handlers thin; logic lives in `src/`.
- `src/studio/`: the editor. `src/templates/`: one folder per banner template. `src/banner/`: shared banner pieces.
- `src/export/`: server-side PNG/JPEG export. `src/github/`: GitHub GraphQL client and cache.
- `src/lib/`, `src/ui/`, `src/theme/`: shared helpers, UI pieces and theme.

The studio preview and the export render the same `BannerRenderer`. `POST /api/export` validates the settings, signs them into a short-lived token, opens `/render/[templateId]?token=…` in Playwright and returns a screenshot. Details: [docs/architecture.md](docs/architecture.md), [docs/api.md](docs/api.md), [docs/deployment.md](docs/deployment.md).

## Conventions

- Derive values during render. Don't copy props into state with `useEffect` + `setState`, and don't call `setState` synchronously in an effect (see `src/studio/useDelayedFlag.ts`). Data from our API routes goes through TanStack Query (`src/studio/useApiQuery.ts`)..
- When a feature is removed or changed, remove it completely: no migration or fallback code for old cookies, links or API values.
- `@sparticuz/chromium` must match the Chromium major that `playwright` targets (`playwright-core/browsers.json`); upgrade both in one PR. Files the export loads at runtime need an `outputFileTracingIncludes` entry in `next.config.ts`.
- New template: follow the steps in [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-template).
- Secrets live in `.env.local` locally and in Vercel environment variables (Production and Preview). Never commit them.

### Effect

The server runs on Effect 4: the export API (`src/export/`), the GitHub client and routes (`src/github/`), and the settings schemas (`src/templates/stateSchemas.ts`, `src/lib/schema.ts`).

- Server only: every module that imports `effect` starts with `import "server-only"`, so a browser import fails the build. Never import `effect` from code that runs in the browser: it adds about 50 KB to a page (measured in #205). The studio uses TanStack Query and checks nothing itself: its controls keep settings valid, and the export API checks them.
- Most examples online and most AI output are Effect 3. Work from the installed docs: `Effect.catchAll` is now `Effect.catch`, `Effect.either` is `Effect.result`, and errors are `Schema.TaggedError` classes.
- Check a module's `@stability` tag before using it; unstable ones can change in a minor release, which is why the version is pinned.
- Route handlers stay plain Next.js: build one Effect and run it with `Effect.runPromise` at the edge, turning each tagged error into its response there with `Effect.catchTags` (see `src/export/route.ts`).
- Validate untrusted input (requests, GitHub responses, links) with `Schema`. Give each field its own message (`src/lib/schema.ts`), so an issue never repeats the value that failed.
- Resources that must close, like Chromium, use `Effect.acquireRelease` inside `Effect.scoped`, so a timeout or failure still closes them (see `captureBanner`).

### UI

- No `title` tooltips. Icon-only buttons get an `aria-label`; problems show as a toast or a preview state.
- Selected or "on" controls show it with an accent (blue) frame, tint or check; their text and icons keep the normal text color.
- Color changes on hover, focus and selection fade like `.btn` in `app/globals.css` (`var(--hover-fade)`). Put hover rules in `:where(...)` so they never outrank selected or focus states.

### Writing

American English everywhere: code, comments, UI copy, docs, commits and PRs (customize, color, center, behavior, canceled).

## Git and pull requests

- Branch from `main` with a `feat/`, `fix/`, `docs/`, `refactor/` or `chore/` prefix. Each branch gets a Vercel preview; `main` is protected by CI and deploys to production.
- PRs are squash-merged and the PR title becomes the commit, so write it as a [Conventional Commit](https://www.conventionalcommits.org). It decides the release-please version bump; never edit the version or `CHANGELOG.md`.
- Keep PRs small, and link issues with `Closes #` or `Refs #`. More in [CONTRIBUTING.md](CONTRIBUTING.md).

## Checks

CI runs `pnpm format:check`, `pnpm lint`, `pnpm knip`, `pnpm typecheck`, `pnpm test` and `pnpm build` on every PR.

Run them once, when a change is finished and before suggesting a commit, not after every edit:

1. `pnpm format`
2. `pnpm lint`, `pnpm knip`, `pnpm typecheck` and `pnpm test`
3. `pnpm build`, only when the change touches routes, components, `app/` or config. Skip it for docs-only or test-only changes. It needs no `.env.local`.
