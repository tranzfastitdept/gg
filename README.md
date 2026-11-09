#Will you go out with me? — pink pixel date site

A cute pixel-art date planner inspired by the viral Valentine sites:
"Will you go out with me?" → YAY! → pick a date → pick an activity → **IT'S A DATE!**

It also remembers every date you plan, and lets you add a memory photo to any
past date — shared between you and your partner through Supabase.

## What is inside

| Part | Where |
| --- | --- |
| Pink shader sky (WebGL) | `src/components/ShaderBackground.jsx` |
| Pixel hearts + falling petals | `src/components/PixelParticles.jsx` |
| Click heart-burst + flying kiss | `src/components/LoveBurst.jsx` |
| The flow (ask → yay → date → activity → it's a date) | `src/App.jsx` |
| Our Dates list + memory photos | `src/App.jsx` (bottom) |
| Supabase client | `src/lib/supabase.js` |
| Love notes pool (100 hand-written notes, per moment) | `src/lib/notesPool.js` |
| Note history (skips already-shown notes, no repeats) | `src/lib/notesHistory.js` |
| Note picker (rewires the pool for the UI) | `src/lib/loveNotes.js` |
| SQL to run in Supabase | `supabase/valentine-schema.sql` |
| GIFs | `src/assets/medias/` |

GIF assignments:
- **dancing-bear.gif** — asking "Will you go out with me?" and picking a date
- **flying-kiss.gif** — the "YAY!" screen + flying across on confirmation
- **success-date-scheduled.gif** — "IT'S A DATE!" celebration
- **falling-petals-overlay-transparent-bg.gif** — pink petals drifting over everything

### How the notes work (no AI, no API)

All love notes are hand-written in `src/lib/notesPool.js` — 100 notes split
across the flow (ask, yes, it's a date, after a date, and memory). The app
picks a random note that hasn't been shown yet, using `src/lib/notesHistory.js`:

- Every note shown is remembered in `localStorage` (and copied to the Supabase
  `love_notes` table when it exists, so both phones stay in sync).
- The picker always chooses from **unseen** notes, so you won't see a repeat
  until the whole pool for that moment has been used up.
- Once a moment's pool is exhausted, its history clears and a fresh cycle
  begins — other moments keep their history.
- To add, edit or rewrite notes, just edit `src/lib/notesPool.js`. Every note
  is written for **Gelo → Precious**.

## Run it

```bash
npm install
npm run dev
```

Open the link in the terminal. Notes, the flow and the whole UI work completely
offline — no AI service, no API key needed. Dates are saved in your browser so
you can try the whole flow right away, and when Supabase is connected they are
shared between you both.

## Connect Supabase (so you + your partner share dates)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor → New query**, paste the whole file
   `supabase/valentine-schema.sql`, and run it. This creates the `dates` and
   `memories` tables, the `love_notes` history table, the photo bucket, and
   the access rules.
3. In the dashboard, open **Settings → API Keys** and copy:
   - the **Project URL**
   - the **anon key** (the publishable one — *never* the service_role key)
4. Open `src/lib/supabase.js` and paste the Project URL and the anon key into
   the hard-coded `SUPABASE_URL` and `SUPABASE_ANON_KEY` values (there is no
   `.env` file in this project by design).
5. Restart `npm run dev` and refresh. Now a date saved on one phone shows on
   the other, and memory photos are stored in the `memories` storage bucket.

## How the memory photos work

- Open **♥ our dates** (top right) → **Past dates · Memories**
- Tap any date → **+ ADD MEMORY PHOTO** and pick a photo
- With Supabase connected, the photo goes to the `memories` bucket (set to
  public) and a row in `memories` links it to that date. Offline, photos are
  shrunk and kept in this browser only.

## Privacy note

The SQL uses open "anyone with the link" policies so the two of you can share
without sign-ups. That means anyone who has the link + anon key can read/write
the dates. Keep the link private, and never post the anon key publicly.

> The love notes no longer call any AI service — the hand-written pool in
> `notesPool.js` is the only source, so the notes also work with the internet
> off.
