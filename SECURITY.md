# Security Policy

## Supported versions

Only the latest published version of each package is supported with security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

- Preferred: [open a private security advisory](https://github.com/anilkumarthakur60/google-places-autocomplete/security/advisories/new).
- Alternative: email the maintainer at anilkumarthakur60@gmail.com.

Please include what you've found, the affected package/version, and reproduction steps if possible. We'll acknowledge reports as promptly as we can.

## A note on API keys

This library never bundles, logs, or transmits your Google API key anywhere other than directly to `places.googleapis.com` (or to your own `fetcher` override, if you supply one). Restricting your key (HTTP referrer for browser use) in Google Cloud Console is your responsibility and is not something this library can enforce.
