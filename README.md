# The Seven-Year Dream

A multiplayer browser decision game (university project) inspired by the Story of Yusuf (Joseph). Two to three players share one advisor character, discuss choices together, vote in real time, and navigate seven years of abundance followed by seven years of famine.

---

## Tech Stack & Design Rules

- **Stack**: React 19, Vite, TypeScript + JS data/API modules, Tailwind CSS v4, Motion (`motion/react`), Lucide icons (`lucide-react`), Supabase (`@supabase/supabase-js`).
- **Palette**: Dark brown `#1E140D`, sandstone `#D9B98A`, muted gold `#C9993A`, deep blue `#1B2A41`, parchment `#EBD9B4`, torch-orange `#E8883A`.
- **Fonts**: `Cinzel` (titles, buttons), `Lora` (body prose), loaded in `index.html` and configured in `src/index.css`.
- **Visual Constraints**: Low-poly flat SVG/CSS aesthetic; **no human faces** (silhouettes only), **no eye symbols or religious icons as decoration**, thin `6px` gold scrollbars, responsive on phones and laptops.
- **Content Rule**: Any references to scripture or scholars must be marked `[PLACEHOLDER: verified source]`. Never invent quotations.

---

## Project File Map (Read This First)

- `src/lib/gameApi.js` — **ALL** Supabase client, anonymous auth, `server_time()` clock sync, table reads, RPC calls, `postgres_changes` subscriptions, and test-bot client helpers. **UI components must never import or call Supabase directly.**
- `src/data/storyData.js` — Story scenes, diamond branch/merge logic, `evaluateEnding(grain, panic)`, and the 4 `ENDINGS` (kept completely separate from UI).
- `src/types/game.ts` — Shared TypeScript interfaces (`RoomRow`, `PlayerRow`, `VoteRow`, `StoryScene`, `HistoryEntry`, `YearCard`, `EndingInfo`).
- `src/App.tsx` — Top-level state router driven by DB `room.status`, server-synced clock tick, 20s heartbeat, visibility/online reconnect, 5-second `"Locking in..."` countdown, `resolveCurrentScene()` tallying/RPC trigger, bot vote-mirroring, and `D` key dev panel toggle.
- `src/components/TitleBackground.tsx` — Performant animated low-poly SVG scene (swaying wheat, glowing sun, palace silhouette, drifting dust) + optional `/public/title-bg.mp4` muted looping video slot (checked via `HEAD` for `video/*` MIME type).
- `src/components/TitleScreen.tsx` — Title screen with `THE SEVEN-YEAR DREAM`, one-sentence premise, and pulsing gold `START` button.
- `src/components/RoomEntryScreen.tsx` — Create Room (`name`) and Join Room (`name` + auto-uppercase 4-letter `code`) flows.
- `src/components/LobbyScreen.tsx` — Copyable 4-letter code, 3 player slots (`P1`/`P2`/`P3`, `HOST` badge, green/gray dot = `last_seen` within 45s), `Start` (host only, 2–3 players), `Add Test Bot` / `Remove Bots`, and `Leave room`.
- `src/components/SceneScreen.tsx` — Top bar (phase, `P1`/`P2`/`P3` avatars, 120s timer bar turning red/pulsing in last 15s), readable parchment narrative (`18px` mobile / `20px` laptop, `1.6` line-height, `~65ch` max-width), side-by-side `ChoiceCard` grid, 5s `"Locking in..."` banner, 4s Result Card, and Year Title Card transitions.
- `src/components/ChoiceCard.tsx` — Custom dark/gold choice card derived from `highlight-card.tsx` accepting `title`, `description`, and optional `bgImageUrl` (`opacity-30` default -> `group-hover:opacity-70` over a dark gradient scrim for future generated artwork).
- `src/components/YearTitleCard.tsx` — Full-screen mood-matched title card (`abundance` gold vs `drought` dusty amber/gray) with 1s fade transitions and `prefers-reduced-motion` support.
- `src/components/EndingScreen.tsx` — Ending X of 4 banner, outcome text, Professor Mode placeholders, 3 meter bars (`grain`, `panic`, `trust`), `history` key choices, host-only `Play Again`, and `Leave`.
- `src/components/PlayerAvatar.tsx` — Rounded `P1`/`P2`/`P3` circles with check mark (voted) or revealed choice letter.
- `src/components/DevPanel.tsx` — Hidden overlay toggled with **`D`** (shows meters, flags, scene, votes, clock offset, lock-in countdown, and **Skip Title Card** button).

---

## Supabase Contract (Database Already Exists — Do Not Create Tables/SQL)

- **Env Vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (documented in `.env.example`; never hardcode keys or use `service_role`).
- **Auth**: On load, calls `supabase.auth.getSession()`, falling back to `signInAnonymously()`.
- **Tables (SELECT only)**:
  - `rooms(code, host_id, status, current_scene, voting_opens_at, scene_ends_at, scene_duration, year, grain, panic, trust, flags, history, ending)`
  - `players(id, room_code, name, seat, last_seen)`
  - `votes(room_code, scene_id, player_id, choice_id)`
- **RPCs**:
  - `create_room(p_name) -> code`
  - `join_room(p_code, p_name) -> code`
  - `leave_room()`
  - `touch_player()` (called every 20s)
  - `start_game(p_code, p_first_scene, p_duration)` (DB gives first scene a 7s intro automatically)
  - `submit_vote(p_code, p_scene, p_choice)`
  - `resolve_scene(p_code, p_from, p_next, p_grain, p_panic, p_trust, p_year, p_flags, p_entry, p_duration, p_ending, p_intro)`
  - `reset_room(p_code)`
  - `server_time()` (called at startup to compute `clockOffsetMs`)

---

## Implemented Game, Cinematic & Voting Rules

1. **Hidden Meters (0–100 clamped)**: Start values on DB are `grain: 30`, `panic: 10`, `trust: 50`. Never shown as numbers during play (only on Ending screen and `D` Dev Panel).
2. **Cinematic Timing (`serverNowMs` vs `voting_opens_at`)**:
   - Game Start (`start_game`, 7s intro): ~1s fade to black -> Year 1 Title Card -> scene slides up.
   - Decision Resolution (`resolve_scene`):
     - `p_intro = 9` if next scene has `yearCard` (4s Result Card + 5s Year Title Card).
     - `p_intro = 4` if next scene has no `yearCard` (4s Result Card only).
     - `p_intro = 0` when `next === 'ENDING'`.
   - Reconnecting mid-intro shows only remaining intro time or jumps straight to the scene.
3. **Timer & 5s Lock-In**:
   - Default scene duration is **120s** (`DEFAULT_SCENE_DURATION = 120`); timer bar turns red and pulses in the final **15s**.
   - When all players have voted, a **5-second `"Locking in..."`** countdown runs (players can still change votes). When it finishes or the main timer hits 0, every client waits a random `0–600ms` and runs `resolveCurrentScene()` (server ignores duplicate calls).
4. **Vote Resolution & `decidedBy`**:
   - Strict highest vote count wins (`decidedBy: 'majority'`).
   - On a tie or if nobody voted: uses the host's vote if the host voted (`decidedBy: 'host'`), otherwise `scene.defaultChoice` (`decidedBy: 'default'`).
   - Recorded in `rooms.history` entry `{ scene, phase, choiceId, choiceText, votes, decidedBy }` and displayed on the Result Card (`"Tie, the host decided"` / `"No votes, the host's default applied"`).
5. **Four Endings (evaluated in exact order)**:
   1. `panic >= 70` -> `"The Self-Fulfilling Prophecy"`
   2. `grain >= 70 && panic < 55` -> `"The Yusuf Strategy"`
   3. `grain >= 70` -> `"A Narrow Escape"`
   4. Otherwise -> `"The Dream Predicts the Future"`
6. **Testing Bots**:
   - Host can click **Add Test Bot** in the Lobby (spawns isolated in-memory anonymous Supabase clients with `persistSession: false` so the host session is untouched). Bots automatically mirror the human's vote ~380ms later so the entire multiplayer flow can be tested solo.

---

## Current Status & What Remains To Be Built

### Completed
- Title screen + animated low-poly SVG background + `/title-bg.mp4` slot.
- Full Supabase multiplayer integration (anonymous auth, create/join, live lobby, reconnect on reload/visibility/online, 20s heartbeat, room-deleted handling).
- Full cinematic sequence (fade-to-black, mood-matched `YearTitleCard`, 4s Result Card with `resultText`, `D` Dev Panel with `Skip Title Card`).
- Updated 120s timer, 15s red pulse, 5s `"Locking in..."` countdown, and `majority` / `host` / `default` resolution rule.
- Solo testing bot support (`Add Test Bot` / `Remove Bots` with mirrored votes).
- Complete 12-node diamond narrative map in `src/data/storyData.js` (`s1_royal_summons` -> `s2a_quiet_council` / `s2b_public_stir` -> `s3_merchant_guild` -> `s4a_auditors_report` / `s4b_complacency_wave` -> `s5_famine_onset` -> `s6_deep_drought` -> 4 evaluated endings) with Professor Mode behavioural economics explanations (`coreConcept` + `academicExplanation`).

### Remaining / Next Steps
1. **Verified Scriptural/Scholarly Citations**: Replace remaining `[PLACEHOLDER: verified source]` tags in `src/data/storyData.js` with verified citations where needed.
2. **Optional Video Asset**: Drop a looping background video at `/public/title-bg.mp4` if desired (currently falls back cleanly to the animated SVG scene).
3. **Live End-to-End Test**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in environment settings (with Anonymous Auth enabled in Supabase) and run through a full game using **Add Test Bot**.
