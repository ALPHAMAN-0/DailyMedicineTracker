# Daily medicine tracker

A simple, single-user medicine tracker. Data lives in a real Google Sheet (one tab per month), so you can open it like Excel any time. Deployed on Vercel.

## One-time setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project, then enable the **Google Sheets API** and **Google Drive API**.
2. Under IAM & Admin > Service Accounts, create a service account (no IAM roles needed). Create a JSON key for it and download it.
3. Copy `.env.example` to `.env.local` and fill in:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` field from the JSON key.
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — the `private_key` field from the JSON key (keep the `\n` sequences as-is).
   - `GOOGLE_SHEET_OWNER_EMAIL` — your own Google account email, so the sheet gets shared with you.
   - `APP_PASSCODE` — any passcode you want to use to unlock the app.
   - `SESSION_SECRET` — a random string, e.g. from `openssl rand -hex 32`.
4. Run the bootstrap script once to create the spreadsheet and share it with you:
   ```bash
   node --env-file=.env.local scripts/bootstrap-sheet.mjs
   ```
   It prints a spreadsheet ID — set that as `GOOGLE_SHEET_ID` in `.env.local` (and later in Vercel).
5. Run locally:
   ```bash
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000`, enter your passcode, add a medicine, check off doses, and hit "Save today" — then open the Google Sheet to confirm the row appeared.

## Deploying to Vercel

1. Push this repo to GitHub (or run `vercel` directly from this folder).
2. In the Vercel project's Environment Variables settings, set: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `APP_PASSCODE`, `SESSION_SECRET`. (`GOOGLE_SHEET_OWNER_EMAIL` is only needed for the one-time local bootstrap script, not in Vercel.)
3. Deploy. Visit the production URL, log in, and repeat the same walkthrough as above to confirm everything works end-to-end.

## How it works

- `/login` — passcode gate, sets a signed session cookie.
- `/` — today's checklist: check off doses for each medicine, then "Save today" writes one row into the current month's tab (e.g. "September 2026"), creating that tab automatically the first time it's needed.
- `/medicines` — add or remove medicines (1-4 doses/day each). Removing a medicine only stops it from appearing going forward; its history stays in past sheet tabs untouched.

All history and reporting happens by opening the Google Sheet directly — the app itself only shows today.
