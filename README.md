# Omnivix

Omnivix is a template-driven social banner generator built with Next.js App Router.
It has a gallery home, a shared studio editor, and deterministic PNG export via Playwright.

## Architecture

- Canonical app lives in root `app/` and `src/`.
- Template rendering contract is single-path: preview and export both use `src/templates/BannerRenderer.tsx` and per-template renderers.
- GitHub data uses `@octokit/graphql` in `src/github/client.ts` and normalizes into stable contracts.
- Export flow: `POST /api/export` -> temporary render token -> `/render/[templateId]` -> Playwright screenshot.

## Routes

- `/` template gallery
- `/studio/[templateId]` studio shell
- `/render/[templateId]` export render scene
- `/api/github/user-summary`
- `/api/github/contributions`
- `/api/github/repos`
- `/api/export`

## Local setup (pnpm only)

```bash
pnpm install
pnpm dev
```

## Environment

Create `.env.local` from `.env.example`:

- `GITHUB_TOKEN`: required for production GitHub data path.
- `EXPORT_RENDER_ORIGIN`: optional origin override for export rendering.

## Conventions

- Use `pnpm` only (`pnpm-lock.yaml` is authoritative).
- Keep route handlers thin; place logic in `src/*` services.
- Add template-specific UI inside `src/templates/<template-id>/`.
- Keep preview/export parity by reusing the same renderer component tree.

## Testing and checks

```bash
pnpm lint
pnpm test
pnpm build
```
