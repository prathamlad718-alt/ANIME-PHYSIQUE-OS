# ANIME PHYSIQUE OS (PROJECT AWAKENING)

> **Tactical Offline-First Personal Fitness & Biometric Progression System**  
> Inspired by the system interfaces of *Solo Leveling*, the raw combat conditioning of *Baki*, and the cold analytical telemetry of *Ayanokoji*.

---

## ⚡ Overview

Anime Physique OS is a local-first, privacy-respecting personal physical conditioning application. It combines gamified Hunter Rank progression, body perimeter tracking, multi-discipline workout logging with automated PR detection, and a client-side progress photo vault with zero third-party cloud data transmission.

## 🛠 Tech Stack

- **Core**: React 18 + TypeScript (Strict Mode) + Vite
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
- **Database**: Dexie.js (IndexedDB wrapper with schema versioning & transactions)
- **Icons**: Lucide React
- **PWA**: `vite-plugin-pwa` (Full offline caching & standalone installability)
- **Testing**: Vitest + `fake-indexeddb`

---

## 🛡 System Architecture & Modules

- **Module A: System HUD & Dashboard**: Live Journey Day counter, dynamic Hunter Rank (`E-Rank` to `MONARCH`), 7-day/30-day consistency rates, recent PR highlights.
- **Module B: Biometrics & Measurements**: Full 13 standard anatomical sites (`neck`, `shoulders`, `chest`, `arms`, `forearms`, `waist`, `hips`, `thighs`, `calves`) + dynamic custom fields, strict input validation (`5cm` - `300cm`), and a Date-to-Date Delta Comparator.
- **Module C: Workout Logger**: Session builder for weighted sets, strict bodyweight + added load, and timed track/laps. Automated PR detection against identical parameters.
- **Module D: Progress Photo Vault**: IndexedDB binary `Blob` storage (up to 15MB, JPG/PNG/WEBP), lifecycle-managed URLs (`URL.revokeObjectURL`), privacy banner, and Side-by-Side Split View Comparator.
- **Module E: Tactical Analytics**: Interactive SVG trend lines for top load and volume per exercise, 4-week workout frequency bar histogram, and a Personal Records Hall of Fame distinguishing `RAW MEASUREMENT` vs `DERIVED METRIC`.
- **Module F: Directives & Progression**: Daily directives, weekly protocols, and milestones. Non-punitive recovery day logging. Transparent XP ledger:
  - `+100 XP` per recorded workout session
  - `+40 XP` per active recovery day
  - `+25 XP` per completed directive
  - `+50 XP` per biometric measurement checkpoint
- **Module G: Config & Vault Backup**: Full JSON export serializing all tables and converting photo `Blob`s to Base64 in a versioned envelope (`schemaVersion: 1`). Atomic transactional restore with corruption rejection.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Tested on Node.js 24)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/anime-physique-os.git
cd anime-physique-os

# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated tests
npm run test

# Build production bundle
npm run build
```

---

## 📱 Mobile & Desktop Installation (PWA)

1. Open the app in **Google Chrome** or **Microsoft Edge**.
2. Click the **Install** button in the URL address bar (or menu `...` -> **Install App**).
3. The app installs locally and operates completely offline with native windowing and zero server dependencies.

---

## 🔒 Privacy & Data Sovereignty

All biometric data, workout histories, and photographs reside strictly inside browser IndexedDB on your device. To transfer your data to another machine, use the **JSON Vault Export** feature in **Module G (System Config)**.

---

## 📄 License

MIT License. Crafted for discipline and relentless physical progression.
