# Contributing

For setup, see [Getting started](README.md#getting-started).

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
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` first. CI doesn't run `build`.
- Add screenshots for UI changes.