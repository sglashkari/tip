# Tip of the Iceberg

A fast, responsive tip calculator that lets the user choose a clean total, a whole-dollar tip, or a precise percentage—and compare or split every option clearly.

**Live app:** [sglashkari.github.io/tip](https://sglashkari.github.io/tip/)

## Features

- Calculates the total, tip, and effective tip rate as you type
- Accepts bill amounts as calculator-style cents entry (`1234` becomes `$12.34`)
- Generates relevant options with an effective tip between 5% and 25%
- Defaults to the option closest to a 16% effective tip while preferring rates of at least 14%, and provides a vertically scrolling, snap-to-option list for comparing alternatives
- Switches among **Clean total**, **Clean tip**, and **Exact rate**, then adds **Clean total each** and **Clean tip each** whenever the bill is split
- Uses tap-friendly controls to adjust and remember a preferred tip target from 5% to 25%
- Uses a phone-first interface with large touch targets and safe-area support
- Adapts to a split-screen layout on desktop
- Uses original, optimized hero artwork built around the dining-and-iceberg concept
- Can be installed as a standalone Progressive Web App (PWA)
- Works offline after the first visit
- Scans receipt photos with on-device OCR and asks for confirmation before applying the detected total
- Shows bill, tip, and total per person directly in every comparison row when splitting among up to 20 people, including exact remainder-cent shares

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

The app can generate options by whole-dollar total, whole-dollar tip, whole-percent rate, whole-dollar total per person, or whole-dollar tip per person. It selects the option closest to the user's preferred rate, initially 16%, while favoring rates of at least 14% when the target is 14% or higher. Preferences stay on the device.

## License

See [LICENSE](LICENSE).
