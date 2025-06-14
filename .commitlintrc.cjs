/**
 * Conventional Commits enforcement.
 *
 * Extends the standard config and just documents the type list explicitly
 * so contributors don't have to go look it up: `feat`/`fix` drive changesets
 * and the release notes; the rest are for everything that isn't a published
 * change (tooling, docs, tests, chores, refactors, style/formatting-only,
 * performance, reverts, and CI).
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
  },
}
