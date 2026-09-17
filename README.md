# Tip of the Iceberg

A fast, responsive tip calculator that adjusts the tip so the final bill rounds to the nearest whole dollar.

**Live app:** [sglashkari.github.io/tip](https://sglashkari.github.io/tip/)

## Features

- Calculates the tip, rounded total, and effective tip rate as you type
- Includes one-tap presets for 10%, 15%, 18%, and 20%, plus a custom rate
- Accepts bill amounts as calculator-style cents entry (`1234` becomes `$12.34`)
- Recommends the integer rate from 14%–20% that comes closest to a whole-dollar total
- Uses a phone-first interface with large touch targets and safe-area support
- Adapts to a split-screen layout on desktop
- Can be installed as a standalone Progressive Web App (PWA)
- Works offline after the first visit

## Use it like an app

On iPhone or iPad, open the live app in Safari, tap **Share**, and choose **Add to Home Screen**.

On Android, open it in Chrome and choose **Install app** or **Add to Home screen** from the browser menu.

## Run locally

Because the app uses a service worker, serve the folder through a local web server instead of opening `index.html` directly:

```bash
git clone https://github.com/sglashkari/tip.git
cd tip
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Project structure

- `index.html` — application markup and metadata
- `styles.css` — responsive phone and desktop layouts
- `script.js` — tip calculations and interactions
- `manifest.webmanifest` — installation metadata
- `sw.js` — offline asset caching
- `calculator.png` — original iceberg artwork
- `favicon.svg` — application icon

## Calculation

The selected percentage first produces a preliminary total. That total is rounded to the nearest whole dollar, then the actual tip and effective percentage are recalculated from the rounded total.

## License

See [LICENSE](LICENSE).
