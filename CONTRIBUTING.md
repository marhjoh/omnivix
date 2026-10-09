# Contributing

For setup, see [Getting started](README.md#getting-started). By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

Open an issue first for larger changes or new templates, so the direction is agreed early.

## Branches and commits

- Branch from `main` with a `feat/`, `fix/`, `docs/`, `refactor/` or `chore/` prefix.
- Use [Conventional Commits](https://www.conventionalcommits.org), e.g. `fix: correct cache duration in the FAQ`.

## Code guidelines

- Use `pnpm` only; `pnpm-lock.yaml` is the source of truth.
- Keep route handlers thin; put logic in `src/*`.
- Put template code in `src/templates/<template-id>/` and render it through the [shared renderer](README.md#one-renderer-for-preview-and-export).
- Derive values during render instead of copying them into state with `useEffect` + `setState`.
- Upgrade `playwright` and `@sparticuz/chromium` together (see [Export flow](README.md#export-flow)).

## Pull requests

- Keep PRs small and focused, and link the issue they close.
- Add screenshots for UI changes.

## Checks

CI runs every check below on each pull request, and a PR must pass all of them before it's merged. To reproduce a failure locally, run the same command:

| Check      | Command             | Fix                                   |
| ---------- | ------------------- | ------------------------------------- |
| Formatting | `pnpm format:check` | `pnpm format`                         |
| Lint       | `pnpm lint`         | `pnpm lint --fix` for the simple ones |
| Types      | `pnpm typecheck`    |                                       |
| Tests      | `pnpm test`         | add `--coverage` for the summary      |
| Build      | `pnpm build`        |                                       |

`pnpm build` doesn't need `.env.local`, because secrets are only read at request time.
