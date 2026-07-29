// The core stylesheet is imported as a raw string (tsup's `.css` text loader),
// then injected into the document by the element — so a CDN/script-tag user
// gets styling with zero setup. See tsup.config.ts's `loader`/`noExternal`.
declare module '@anil-labs/google-places-autocomplete-core/styles.css' {
  const css: string
  export default css
}
