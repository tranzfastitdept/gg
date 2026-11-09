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
| SQL to run in Supabase | `supabase/valentine-schema.sql` |
| GIFs | `src/assets/medias/` |

GIF assignments:
- **dancing-bear.gif** — asking "Will you go out with me?" and picking a date
- **flying-kiss.gif** — the "YAY!" screen + flying across on confirmation
- **success-date-scheduled.gif** — "IT'S A DATE!" celebration
- **falling-petals-overlay-transparent-bg.gif** — pink petals drifting over everything

To make the notes personal, edit the `NOTES` object at the top of `src/App.jsx`
(and change the `from="gelo"` signature to your name).

## Run it

```bash
npm install
npm run dev
```

Open the link in the terminal. Everything works offline first — dates are saved
in your browser so you can try the whole flow right away.

## Connect Supabase (so you + your partner share dates)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor → New query**, paste the whole file
   `supabase/valentine-schema.sql`, and run it. This creates the `dates` and
   `memories` tables, the photo bucket, and the access rules.
3. In the dashboard, open **Settings → API Keys** and copy:
   - the **Project URL**
   - the **anon key** (the publishable one — *never* the service_role key)
4. In this project folder, create a file named `.env` with exactly this:

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. Restart `npm run dev` and refresh. Now a date saved on one phone shows on
   the other, and memory photos are stored in the `memories` storage bucket.

> The `.env` file is listed in `.gitignore` — never commit it, and never put the
> `service_role` key anywhere in this project.

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
