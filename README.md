<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MathQuest: Mental Mastery

An interactive mental math trainer for kids (grades 2–4) with collectible stuffy animal rewards. Practice 7 categories of mental math strategies — from rounding and splitting to estimation — and earn adorable stuffy badges along the way.

## Setup

**Prerequisites:** Node.js, [pi](https://github.com/mariozechner/pi-coding-agent)

1. Install dependencies:
   ```
   npm install
   ```

2. Generate the problem bank (uses `pi --mode json` to produce structured JSON):
   ```
   npm run generate
   ```
   This writes `public/problems.json` with 20 problems per category (140 total) across all 7 categories. Problems include a mix of free-text and multiple-choice formats.

3. Run the app:
   ```
   npm run dev
   ```
   Opens on [http://localhost:3000](http://localhost:3000).

## Categories

| Category | Strategy | Example |
|----------|----------|---------|
| ➕ Bigger Addition | Rounding & splitting | `68 + 47 → 68 + 50 - 3 = 115` |
| ➖ Multi-Step Subtraction | Counting up | `250 - 97 → 97 + 3 = 100, then + 150 = 153` |
| ✖️ Mental Breakdown | Split to multiply | `23 × 5 = (20 × 5) + (3 × 5) = 115` |
| 🎯 Near-10 Mastery | Anchor on 10s/100s | `19 × 6 = (20 × 6) - 6 = 114` |
| ➗ Division Explorer | Facts & remainders | `65 ÷ 6 = (6 × 10) + 5` |
| 🧩 Fraction Power | Halves, quarters, ¾ | `Quarter of 80 = 80 ÷ 4 = 20` |
| 🔢 Estimation Champ | Number sense | `49 + 73 ≈ 50 + 70 = 120` |

## Architecture

```
├── App.tsx                    # Main app: home, arena, and collection views
├── index.tsx                  # React entry point
├── types.ts                   # TypeScript enums & interfaces (Problem, UserProgress, etc.)
├── constants.tsx              # Category definitions + 25 collectible stuffy badges
├── components/
│   ├── ProblemCard.tsx        # Answer input (free-text & multiple-choice)
│   └── MathBuddy.tsx         # Animated robot companion "Pixel"
├── services/
│   └── geminiService.ts      # Loads problems from static JSON pool, filters seen problems
├── public/
│   └── problems.json         # Pre-generated problem bank (generated via `npm run generate`)
├── vite.config.ts            # Vite config (base: /mental-math/, port 3000)
├── metadata.json             # App metadata for hosting frame
└── package.json
```

### Key design decisions

- **Offline-first:** Problems are pre-generated at build time via `pi` CLI — no API keys or network calls needed at runtime.
- **Progress persistence:** `UserProgress` (badges, level, completed categories, seen problem IDs) is saved to `localStorage`.
- **Seen-problem filtering:** The service layer excludes already-answered problem IDs so kids don't repeat questions until the pool is exhausted.
- **Stuffy badge rewards:** 25 collectible animal badges motivate continued practice across categories.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run generate` | Generate `public/problems.json` via `pi` CLI |

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server & bundler)
- **Tailwind CSS** (via class utilities in components)
- **pi CLI** (offline problem generation)
