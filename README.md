# BillSplitr

<p align="center">
  <a href="https://app.netlify.com/projects/usebillsplitr/deploys"><img src="https://api.netlify.com/api/v1/badges/8283874a-88d8-4366-9e0f-6d543f84d2e5/deploy-status" alt="Netlify deploy status" /></a>
</p>

<p align="center">
  <img src="./og-image.jpg" alt="BillSplitr preview" width="1200" />
</p>

A clean, no-fuss way to split a bill. Add people, assign items, adjust the service/tip, and instantly see who owes what.

Live demo: https://usebillsplitr.netlify.app/

## Features

- Split bills in seconds
- Assign items to specific people
- Optional service/tip percentage
- Shareable bill links for the group
- Works entirely in the browser

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

Short share links (`/<uuid>`) need the Netlify functions. To test them locally:

```bash
npm install
npx netlify-cli dev
```

Then open http://localhost:8888. Under the plain Python server, "Copy link" falls back to a compressed long link.

## Project files

- `index.html` — app UI and logic
- `netlify/functions/` — short-link API (`/api/shorten`) and redirect (`/<uuid>`), stored in Netlify Blobs
- `og-image.jpg` — social preview image
- `favicon.*` and `apple-touch-icon.png` — brand assets
- `oembed.json` — embed metadata
