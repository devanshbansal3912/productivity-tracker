# Gemini Project Constitution

## 🟢 Protocol 0: Initialization

### 1. Mandatory Rules
- **Data First:** Define JSON Data Schema before writing tool logic.
- **Strict Determinism:** Use atomic, testable logic.
- **Self-Healing:** Analyze -> Patch -> Test -> Update Architecture.
- **No Auth (MVP):** Single user, open access for MVP speed.

### 2. Behavioral Rules
- **Tone:** Minimal, Direct, "Reality Tracker".
- **Design:** Dark Mode First (#0A0A0A), High Contrast, "Linear-style".
- **Anti-Patterns:** No gamification, no social proof, no gradient backgrounds, no "Are you sure?" spam.
- **Mobile First:** Touch targets > 44px, no hover-dependent constraints.

---

## 🏗️ Phase 1: B - Blueprint

### Data Schema (Supabase)

#### Table: `activities`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, Auto | Unique ID |
| `date` | date | NOT NULL | YYYY-MM-DD |
| `start_time` | time | NOT NULL | HH:MM |
| `end_time` | time | NOT NULL | HH:MM |
| `title` | text | NOT NULL | Description |
| `category` | text | NOT NULL | Enum: deep_work, work, personal, health, distraction, rest |
| `created_at` | timestamp | DEFAULT NOW() | |

#### Table: `daily_goals`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK, Auto | Unique ID |
| `date` | date | NOT NULL | YYYY-MM-DD |
| `goal_text` | text | NOT NULL | Description |
| `completed` | boolean | DEFAULT FALSE | Status |
| `created_at` | timestamp | DEFAULT NOW() | |

### Architectural Invariants
- **Framework:** Next.js (App Router)
- **Database:** Supabase
- **Styling:** Tailwind CSS + Vanilla CSS Variables
- **Icons:** Lucide React (standard for this stack) or Heroicons
- **Charts:** Recharts
- **Date Lib:** date-fns

---

## ⚡ Phase 2: L - Link
- **Env Variables:**
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ⚙️ Phase 3: A - Architect Requirements
- **API Routes:**
    - `GET /api/activities?date=...`
    - `POST /api/activities`
    - `PATCH/DELETE /api/activities/[id]`
    - `GET/POST/PATCH/DELETE /api/daily_goals`
    - `GET /api/summary?start=...&end=...`

---

## ✨ Phase 4: S - Stylize Guidelines
- **Palette:**
    - Bg: `#0A0A0A`
    - Surface: `#1A1A1A`
    - Primary (Deep Work): `#3B82F6`
    - Distraction: `#EF4444`
- **Typography:** Inter (Headers), JetBrains Mono (Data/Time).

---

## 🛰️ Phase 5: T - Trigger
- Deployment to Vercel.
