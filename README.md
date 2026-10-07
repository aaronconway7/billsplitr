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
- Short shareable links: read-only view links and edit links, always showing the latest version
- Works in the browser, with a small Netlify backend for shared links
- Shared links expire 30 days after the last edit (a daily scheduled function deletes them)

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

Shared links (`/<uuid>` to view, `/e/<uuid>` to edit) need the Netlify functions. To test them locally:

```bash
npm install
npx netlify-cli dev
```

Then open http://localhost:8888. Under the plain Python server, "Copy view link" falls back to a compressed long link (a snapshot) and edit links aren't available.

## Project files

- `index.html` — app UI and logic
- `netlify/functions/` — create (`POST /api/bills`), save (`PUT /api/bills/<editId>`), the shared-bill page (`/<viewId>`, `/e/<editId>`) and the daily expiry job (`expire.mjs`)
- `netlify/lib/bills.mjs` — Netlify Blobs stores and validation shared by the functions
- `og-image.jpg` — social preview image
- `favicon.*` and `apple-touch-icon.png` — brand assets
- `oembed.json` — embed metadata
