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
3. ✅ Teacher word-set library in the database (`#/teacher/sets`): cards, text, CSV/Excel import, printable worksheets, example sets.
4. ✅ Classes (`#/teacher/classes`): word sets per class with order, join code, pupil link, QR code (PNG), projector view, archive.
5. ✅ Pupils join with the class link/code and a first name (`#/c/CODE`), play only their class's sets; progress and mixed-up words saved on the server (per pupil, safe on shared tablets).
6. ✅ Class statistics on each class page: summary, pupils × sets levels per game mode, most mixed-up words, per-pupil details.
7. Launch.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(Settings → Pages → Source: **GitHub Actions**).
