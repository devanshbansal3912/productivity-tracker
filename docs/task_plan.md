# Task Plan (B.L.A.S.T. Protocol)

## 🟢 Protocol 0: Initialization
- [x] Initialize Project Memory
- [x] Discovery Questions & Answers

## 🏗️ Phase 1: B - Blueprint
- [x] Define Data Schema
- [x] Confirm Payload

## ⚡ Phase 2: L - Link
- [ ] **Action:** Verify Supabase Connection
    - Need user to provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`.
    - Provide SQL Init Script.

## ⚙️ Phase 3: A - Architect (Execution)
- [ ] **Step 1: Scaffolding**
    - Initialize Next.js app (using `create-next-app` pattern).
    - Apply `globals.css` with Design Specs.
- [ ] **Step 2: Database Layer**
    - Create `utils/supabase.ts` client.
- [ ] **Step 3: API Layer**
    - Implement `route.ts` handlers.
- [ ] **Step 4: UI Components**
    - `ActivityCard`, `GoalCheckbox`, `AddActivityModal`.
- [ ] **Step 5: Pages**
    - Dashboard, Timeline, Summary.

## ✨ Phase 4: S - Stylize
- [ ] Refine Animations (CSS Config).
- [ ] Accessibility Check.

## 🛰️ Phase 5: T - Trigger
- [ ] Manual Deploy / Verification.
