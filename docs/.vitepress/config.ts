import { defineConfig } from 'vitepress'

const REPO = 'https://github.com/anilkumarthakur60/google-places-autocomplete'

export default defineConfig({
  // '/' for local dev and custom domains; the Pages workflow sets
  // VITEPRESS_BASE to '/google-places-autocomplete/' for the GitHub Pages
  // project site.
  base: process.env.VITEPRESS_BASE ?? '/',
  title: '@anil-labs/google-places-autocomplete',
  description:
    'A typed address autocomplete on Google Places API (New) — debounced predictions, session-token billing and resolved place details, for React, Vue, Svelte, Solid and Web Components.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '@anil-labs/google-places-autocomplete' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/core' },
      {
        text: 'Changelog',
        items: [
          { text: 'core', link: `${REPO}/blob/main/packages/core/CHANGELOG.md` },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/@anil-labs/google-places-autocomplete-core',
          },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Session tokens & billing', link: '/guide/session-tokens' },
          ],
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'Vue', link: '/guide/frameworks/vue' },
            { text: 'React', link: '/guide/frameworks/react' },
            { text: 'Svelte', link: '/guide/frameworks/svelte' },
            { text: 'Solid', link: '/guide/frameworks/solid' },
            { text: 'Web Component', link: '/guide/frameworks/web-component' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [{ text: 'Core', link: '/api/core' }],
        },
      ],
    },
    search: { provider: 'local' },
    editLink: {
      pattern: `${REPO}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    socialLinks: [{ icon: 'github', link: REPO }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Er. Anil Kumar Thakur',
    },
  },
})
