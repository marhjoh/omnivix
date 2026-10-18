# Contributing

For setup, see [Getting started](README.md#getting-started). By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

Open an issue first for larger changes or new templates, so the direction is agreed early. The issue templates ask for what's needed. Report security problems privately, as described in [SECURITY.md](SECURITY.md).

## Branches and commits

- Branch from `main` with a `feat/`, `fix/`, `docs/`, `refactor/` or `chore/` prefix.
- Use [Conventional Commits](https://www.conventionalcommits.org), e.g. `fix: correct cache duration in the FAQ`.

## Code guidelines

- Use `pnpm` only; `pnpm-lock.yaml` is the source of truth.
- Keep route handlers thin; put logic in `src/*`.
- Derive values during render instead of copying them into state with `useEffect` + `setState`.
- Upgrade `playwright` and `@sparticuz/chromium` together (see [Chromium](docs/deployment.md#chromium)).

How the pieces fit together is described in [docs/architecture.md](docs/architecture.md).

## Adding a template

1. Add its id to `TemplateId` (`src/types/template.ts`).
2. Add a definition in `src/templates/definitions.ts` and an entry in `src/templates/registry.ts`.
3. Add a renderer in `src/templates/<template-id>/Renderer.tsx` and wire it into `src/templates/BannerRenderer.tsx`, the [shared renderer](docs/architecture.md#rendering) for preview and export.
4. For the landing page, add a 2× export as `public/landing/<template-id>.webp`, and add the id to `LANDING_TEMPLATE_ORDER` in `src/landing/landingPreviewAssets.ts`.
5. For link previews, add a JPEG copy in `src/og/banners/`.

## Pull requests

- Keep PRs small and focused, and link related issues: `Closes #` for the ones it finishes, `Refs #` for the rest.
- Add screenshots for UI changes.
- PRs are squash-merged, and the PR title becomes the commit on `main`. Write it as a Conventional Commit; CI checks it.
- If a PR has more than one change for the release notes, list each one in the `BEGIN_COMMIT_OVERRIDE` block of the PR template.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please) and follow [Semantic Versioning](https://semver.org). Your PR title decides the next version: `fix:` bumps the patch, `feat:` the minor, and `feat!:` the major. Other types, like `docs:` and `chore:`, don't trigger a release. Don't edit the version or `CHANGELOG.md` by hand.

## Checks

CI runs these on every pull request, and all must pass before merging. Run them locally before you push:

| Check       | Command             | Tip                                                       |
| ----------- | ------------------- | --------------------------------------------------------- |
| Formatting  | `pnpm format:check` | `pnpm format` fixes it                                    |
| Lint        | `pnpm lint`         | `pnpm lint --fix` fixes simple errors                     |
| Unused code | `pnpm knip`         | `pnpm knip --fix` removes unused exports and dependencies |
| Types       | `pnpm typecheck`    |                                                           |
| Tests       | `pnpm test`         | `pnpm test:watch` reruns as you edit                      |
| Build       | `pnpm build`        | Works without `.env.local`                                |

## Maintenance scripts

| Command                   | What it does                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm backgrounds`        | Regenerate the background photos from Unsplash (all, or by id)                                                             |
| `pnpm social-preview`     | Regenerate the repository's social preview image                                                                           |
| `pnpm readme-screenshots` | Regenerate the README screenshots from a running `pnpm dev`                                                                |
| `pnpm doctor`             | Check React code for effect, state and performance problems with [React Doctor](https://github.com/millionco/react-doctor) |
