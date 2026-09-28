# Bubble Sort

A word-sorting vocabulary game for classrooms (Pearson iPrimary / iLowerSecondary, EAL learners).

Pupils pop bubbles by matching words:

- **Groups** — merge words that belong to the same group.
- **Odd one out** — find the word that doesn't belong.
- **Word ↔ translation** — match each word with its translation.

Interface languages: Russian, English, Turkish.

## Roadmap

1. ✅ Standalone site: the game on demo word sets, GitHub Pages deploy.
2. ✅ Database schema (`supabase/schema.sql`, setup guide in `supabase/SETUP.md`), teacher sign-in by e-mail link, invitations.
3. Teacher word-set library (cards, text, CSV/Excel import, printable worksheets).
4. Classes with join links / QR codes.
5. Pupil access by class code, progress saved on the server.
6. Class statistics.
7. Launch.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(Settings → Pages → Source: **GitHub Actions**).
