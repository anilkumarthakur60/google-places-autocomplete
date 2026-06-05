# Contributing

## Development setup

```sh
git clone https://github.com/anilkumarthakur60/google-places-autocomplete.git
cd google-places-autocomplete
pnpm install
pnpm build
```

`pnpm install` also runs `husky` via the `prepare` script, wiring up the git hooks described below.

To try the framework examples against real Google data, copy `.env.example` to `.env` at the repo root and add your own Places API (New) key (see the [getting started guide](https://anilkumarthakur60.github.io/google-places-autocomplete/guide/getting-started) for the Google Cloud setup).

## Day-to-day commands

| Command                 | What it does                                              |
| -------------------------- | -------------------------------------------------------------- |
| `pnpm build`               | Builds all 6 published packages.                               |
| `pnpm dev`                 | Watches every package with `tsup --watch` in parallel.          |
| `pnpm --filter example-vue dev` | Runs one framework's example dev server (also `example-react`, `example-svelte`, `example-solid`, `example-element`, `example-landing`). |
| `pnpm test`                | Runs `core`'s Vitest suite (the wrapper packages are covered by it — see below). |
| `pnpm typecheck`           | `tsc`/`vue-tsc`/`svelte-check` across every package and example. |
| `pnpm lint` / `pnpm lint:fix` | ESLint across the repo.                                    |
| `pnpm format` / `pnpm format:check` | Prettier across the repo.                             |
| `pnpm verify`              | typecheck + lint + format:check + test, in that order — what CI runs (minus the build step, which CI runs first; see below). |
| `pnpm build:examples`      | Production-builds every example app.                           |
| `pnpm build:demos`         | Assembles the landing page + all 5 framework demos into `dist-demo/` (what Vercel deploys). |
| `pnpm docs:dev` / `pnpm docs:build` | VitePress docs site.                                  |

**Build before you typecheck/lint.** The wrapper packages' types resolve through `packages/core/dist/index.d.ts` (they consume `@anil-labs/google-places-autocomplete-core` as a real package, not a source alias), so a fresh clone needs `pnpm build` before `pnpm typecheck`/`pnpm lint` will pass. CI does this in the same order for the same reason — see the comment in `.github/workflows/ci.yml`.

## Repo layout

```
packages/
  core/       framework-agnostic engine (machine.ts, api.ts, session.ts, ...)
  vue/        Vue 3 component + composable
  react/      React component + hook
  svelte/     Svelte 5 component
  solid/      Solid component
  element/    framework-free custom element
examples/
  vue/ react/ svelte/ solid/ element/   one Vite app per framework
  shared/     shared fixtures/config, imported by relative path (no build step)
  landing/    framework-neutral demo (built on the -element wrapper only)
docs/         VitePress site
scripts/      build-demos.mjs — assembles the Vercel deploy
```

## Pull request checklist

- `pnpm verify` passes (build first if this is a fresh clone or `core`/a wrapper changed).
- New behavior in `core` has a Vitest test alongside it.
- A wrapper package change that touches its build output includes running `pnpm --filter <pkg> build` locally — its `check-dist.mjs` step mounts the actual compiled bundle, which is the only thing that catches a broken JSX-factory-style build misconfiguration (unit tests alone compile `src/` through a dev-time compiler and won't see it).
- A user-facing change to a package includes a changeset: `pnpm changeset`.

## Style

ESLint (flat config, type-aware) + Prettier, enforced in CI. `noUncheckedIndexedAccess` and `verbatimModuleSyntax` are on across the workspace — prefer `import type` for type-only imports and guard array/object index access explicitly.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, etc.), enforced by commitlint via the `commit-msg` hook.

## Git hooks

Installed automatically by `pnpm install` (via `husky`'s `prepare` script):

- **pre-commit** — runs `lint-staged` (ESLint + Prettier on staged files only).
- **commit-msg** — runs commitlint against your commit message.

## Releasing (maintainers only)

This repo uses [Changesets](https://github.com/changesets/changesets). Add one per user-facing change (`pnpm changeset`); merging to `main` triggers `.github/workflows/release.yml`, which opens/updates a "Version Packages" PR, and merging *that* PR publishes to npm with provenance.

## Questions?

Open a [discussion](https://github.com/anilkumarthakur60/google-places-autocomplete/discussions).
