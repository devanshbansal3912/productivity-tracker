# Research Findings & Constraints

## 🟢 Initialization
- **Project:** Reality Tracker (MVP)
- **User Constraints:** Mobile-first, Dark mode only, No Auth (Logic-wise).

## 🏗️ Phase 1: Blueprint
- **Schema:** Defined in `gemini.md`.
- **Validation:**
    - `end_time` > `start_time`.
    - Max 3 goals per day.
    - Category must be valid enum.

## ⚡ Phase 2: Link
- **Supabase:** Need to create tables. SQL definition will be provided in `architecture/setup.sql`.

## ⚙️ Phase 3: Architect
- **State Management:** React `useState` + `useEffect` (Simple MVP).
- **Date Handling:** Store `YYYY-MM-DD`, assume local browser timezone for display.

## ✨ Phase 4: Stylize
- **Design System:**
    - "Linear" aesthetic.
    - 1px borders (`#333`).
    - Subtle interactions (border beams, lift on hover).
    - **No** gamification or clutter.
