# Tip of the Iceberg

A fast, responsive tip calculator that adjusts the tip so the final bill rounds to the nearest whole dollar.

**Live app:** [sglashkari.github.io/tip](https://sglashkari.github.io/tip/)

## Features

- Calculates the tip, rounded total, and effective tip rate as you type
- Accepts bill amounts as calculator-style cents entry (`1234` becomes `$12.34`)
- Generates every whole-dollar total with an effective tip between 5% and 25%
- Defaults to the option closest to a 16% effective tip while preferring rates of at least 14%, and provides a vertically scrolling, snap-to-option list for comparing alternatives
- Uses a phone-first interface with large touch targets and safe-area support
- Adapts to a split-screen layout on desktop
- Uses original, optimized hero artwork built around the dining-and-iceberg concept
- Can be installed as a standalone Progressive Web App (PWA)
- Works offline after the first visit
- Scans receipt photos with on-device OCR and asks for confirmation before applying the detected total
- Splits the selected clean total among up to 20 people and accounts for every remainder cent

Receipt images are processed locally in the browser and are not uploaded by the app. The OCR engine and English model are downloaded on first use, so the first scan requires an internet connection and may take longer.

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
- `hero-iceberg-v2.webp` — optimized original iceberg artwork
- `favicon.svg` — application icon

## Calculation

The app lists whole-dollar totals whose effective tips fall between 5% and 25%. It initially selects the option closest to 16% from options at or above 14% (falling back to all options only when needed), and the scrollable option wheel moves among the other valid totals in one-dollar steps.

## License

See [LICENSE](LICENSE).
