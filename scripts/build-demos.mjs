// Assemble all example apps into a single static site for deployment.
//
//   dist-demo/
//     index.html      <- the landing page (example-landing, built at base=/)
//     assets/         <- the landing page's own bundle
//     vue/            <- example-vue     built with base=/vue/
//     react/          <- example-react   built with base=/react/
//     ...
//
// The landing page is a real Vite app under examples/landing (not a
// hardcoded HTML string generated here), so it's typechecked, linted and
// formatted like everything else, and its live demo is the actual
// <gpa-autocomplete> component rather than prose about it.
//
// Run from the repo root:  node scripts/build-demos.mjs
// Vercel runs this as the project's build command (see vercel.json).

import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(root, 'dist-demo')

const run = (cmd) => {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { cwd: root, stdio: 'inherit' })
}

const demos = [
  { slug: 'vue', filter: 'example-vue' },
  { slug: 'react', filter: 'example-react' },
  { slug: 'svelte', filter: 'example-svelte' },
  { slug: 'solid', filter: 'example-solid' },
  { slug: 'element', filter: 'example-element' },
]

// 1. Build the workspace packages the examples depend on (core + wrappers).
//    `pnpm install` on Vercel links workspace deps but does not build them.
run('pnpm --filter "./packages/*" build')

// 2. Build each example into dist-demo/<slug> with a matching base path.
for (const { slug, filter } of demos) {
  run(
    `pnpm --filter ${filter} exec vite build --base=/${slug}/ --outDir=${join(outDir, slug)} --emptyOutDir`,
  )
}

// 3. Build the landing page into the root.
//
//    `--emptyOutDir` is deliberately omitted: dist-demo already holds the
//    five demo builds at this point, and Vite would wipe them. Vite warns
//    when the outDir sits outside its root and it isn't emptying it — that
//    warning is the expected outcome here, not a problem.
run(`pnpm --filter example-landing exec vite build --base=/ --outDir=${outDir}`)

// 4. Verify the deployed artifact, not just the one `pnpm build` produces.
//    This build bypasses the package's own build script (it overrides
//    outDir), so the guard has to be invoked explicitly against dist-demo.
run(`node examples/landing/scripts/check-page.mjs ${outDir}`)

console.log('\n✓ Landing page + 5 framework demos assembled in dist-demo/')
