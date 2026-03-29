# Getting started

## Install

Pick the package for your framework — each depends on `@anil-labs/google-places-autocomplete-core` automatically, so you don't install it separately.

::: code-group

```sh [Vue]
npm install @anil-labs/google-places-autocomplete-vue
```

```sh [React]
npm install @anil-labs/google-places-autocomplete-react
```

```sh [Svelte]
npm install @anil-labs/google-places-autocomplete-svelte
```

```sh [Solid]
npm install @anil-labs/google-places-autocomplete-solid
```

```sh [Web Component]
npm install @anil-labs/google-places-autocomplete-element
```

:::

Then see the [framework guide](/guide/frameworks/vue) for your framework for a complete usage example.

## Google Cloud setup

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Places API (New)** on your project (this is a separate toggle from the legacy "Places API").
2. Create an API key and restrict it — for browser usage, an **HTTP referrer** restriction limiting it to your site's domain(s) is the standard practice (the same approach used for Maps JavaScript API keys).
3. Pass that key as `apiKey` to whichever component/hook you're using.

If you'd rather not expose a key to the browser at all, every wrapper accepts a `fetcher` override — see [Session tokens & billing](/guide/session-tokens#proxying-through-your-own-backend) for how to proxy requests through your own backend instead.

## What you get back

Every wrapper resolves the same [`PlaceDetails`](/api/core#placedetails) shape on selection, regardless of framework:

```ts
interface PlaceDetails {
  placeId: string
  displayName: string
  formattedAddress: string
  location: { lat: number; lng: number } | null
  addressComponents: AddressComponent[]
}
```

This is fetched automatically after a user picks a suggestion — you don't make a second API call yourself. See [Session tokens & billing](/guide/session-tokens) for exactly how that works and why it matters for cost.
