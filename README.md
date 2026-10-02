# BillSplitr

<p align="center">
  <img src="./og-image.jpg" alt="BillSplitr preview" width="1200" />
</p>

A simple, fast way to split a bill without creating an account. Add the bill, assign what each person ordered, adjust service/tip, and instantly see who owes what.

Live app: https://usebillsplitr.netlify.app/

## Why BillSplitr?

- No signup, no accounts, no friction
- Works for meals, coffees, takeaways, and shared expenses
- Splits items proportionally by who ordered what
- Supports service/tip percentages and a custom payer
- Generates a shareable link so everyone can view the exact same bill
- Works locally and in the browser with no build step

## How it works

1. Add the people splitting the bill.
2. Add each item and assign it to the relevant people.
3. Choose a service or tip percentage if needed.
4. Share the final split with your group.

## Features

- Quick item-by-item bill entry
- Per-person item allocation
- Custom service/tip percentage or preset percentages
- Automatic total calculations and balances
- Read-only shared links for easy sending
- Reset flow to start a new bill in seconds

## Run locally

Because this project is a static web app, you can open it directly in a browser or serve it locally:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000 in your browser.

## Project structure

- `index.html` — app logic, styles, and UI
- `og-image.jpg` — social preview image used in the app and README
- `favicon.*` and `apple-touch-icon.png` — branding assets
- `oembed.json` — share metadata for embeds

## Credits

Built by Aaron Conway.

If you want a cleaner, zero-friction way to split group bills, BillSplitr is built for exactly that.
