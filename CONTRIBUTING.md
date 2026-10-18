# Contributing

For setup, see [Getting started](README.md#getting-started). By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

Open an issue first for larger changes or new templates, so the direction is agreed early. The issue templates ask for what's needed: a problem and when it's done for a task, steps and a studio link for a bug. Report security problems privately, as described in [SECURITY.md](SECURITY.md).

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
4. For the landing page, add `public/landing/<template-id>.webp` and list it in `src/landing/landingPreviewAssets.ts`.
5. For link previews, add a JPEG copy in `src/og/banners/`.

## Pull requests

- Keep PRs small and focused, and link the issue they close.
- Add screenshots for UI changes.
- PRs are squash-merged, and the PR title becomes the commit on `main`. Write it as a Conventional Commit; CI checks it.
- If a PR has more than one change for the release notes, list each one in the PR description. The PR template has the block ready:

  ```
  BEGIN_COMMIT_OVERRIDE
  fix: correct cache duration in the FAQ
  feat: add a dark theme to the studio
  END_COMMIT_OVERRIDE
  ```

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please) and follow [Semantic Versioning](https://semver.org). The types of the commits on `main` (your PR titles) decide the next version: `fix:` bumps the patch, `feat:` the minor, and a breaking change (`feat!:` or a `BREAKING CHANGE:` footer) the major. Other types, like `docs:` and `chore:`, don't trigger a release.

After a merge to `main` with a `feat:` or `fix:` commit, the release workflow opens a release PR and merges it once CI passes. That bumps `package.json`, updates `CHANGELOG.md`, tags `vX.Y.Z` and publishes a GitHub Release with the notes. Don't edit the version or the changelog by hand.

## Checks

CI runs every check below on each pull request, and a PR must pass all of them before it's merged. To reproduce a failure locally, run the same command:

| Check      | Command             | Fix                                   |
| ---------- | ------------------- | ------------------------------------- |
| Formatting | `pnpm format:check` | `pnpm format`                         |
| Lint       | `pnpm lint`         | `pnpm lint --fix` for the simple ones |
| Types      | `pnpm typecheck`    |                                       |
| Tests      | `pnpm test`         | add `--coverage` for the summary      |
| Build      | `pnpm build`        |                                       |

`pnpm build` doesn't need `.env.local`, because secrets are only read at request time. While working, `pnpm test:watch` reruns the tests on file changes.

## Maintenance scripts

| Command                   | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `pnpm backgrounds`        | Regenerate the background photos from Unsplash (all, or by id) |
| `pnpm social-preview`     | Regenerate the repository's social preview image               |
| `pnpm readme-screenshots` | Regenerate the README screenshots from a running `pnpm dev`    |
