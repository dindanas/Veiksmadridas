# Veiksmadridas

A mobile-first Spanish verb-conjugation learning app with lessons, contextual multiple-choice practice, spaced repetition, and local progress tracking.

## Use on iPhone

The app is a progressive web app (PWA). Host it over HTTPS, open it once on an iPhone, then use Safari's **Share → Add to Home Screen**. Its full app shell and verb data are cached for offline travel use after that first load.

Progress stays on the device in browser storage. Use **Settings → Export Backup** before changing phones or clearing browser data.

## Development

No build step or package installation is needed. Serve this directory with any static web server and open `index.html` in a browser.

## Data attribution

Verb conjugation data is sourced from the Fred Jehle Spanish Verb Database. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the licence and attribution.
