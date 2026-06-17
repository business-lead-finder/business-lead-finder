# Business Lead Finder

A small Next.js (App Router) tool: search nearby businesses by ZIP code and
category via Google Maps, then crawl each business's website for a personal
email address (filtering out info@, contact@, support@, etc.).

## 1. Install dependencies

From your Next.js project root:

```bash
npm install @supabase/supabase-js cheerio
```

## 2. Set up Supabase

1. In the Supabase dashboard, open the SQL editor and run `sql/schema.sql`
   from this folder. It creates `businesses` and `contacts` tables and
   enables Row Level Security with a permissive "allow all" policy.
2. Copy `.env.local.example` to `.env.local` in your project root and fill
   in your Supabase URL + anon key.

## 3. Set up Google Maps

You need a Google Cloud project with billing enabled and these APIs turned on:

- **Geocoding API** (turns a ZIP code into lat/lng)
- **Places API** (Nearby Search + Place Details)

Put the API key in `.env.local` as `GOOGLE_MAPS_API_KEY`. This one is
**not** prefixed with `NEXT_PUBLIC_` — it's only used server-side in the API
route, so it's never exposed to the browser. In Google Cloud, restrict the
key to these two APIs and (if possible) to your server's IP/referrer.

## 4. Copy the files in

Drop these files into your project, preserving the folder structure:

```
lib/supabase.js
sql/schema.sql                  (reference only — already run in step 2)
app/page.js                     (replaces the default homepage)
app/globals.css                 (merge the :root block into your existing file)
app/components/SearchForm.jsx
app/components/BusinessCard.jsx
app/components/BusinessList.jsx
app/api/search-businesses/route.js
app/api/find-contact/route.js
```

`app/globals.css` here is just the CSS variables to add — merge it into the
`globals.css` that `create-next-app` already generated rather than
overwriting it.

## 5. Run it

```bash
npm run dev
```

Open `http://localhost:3000`, enter a 5-digit ZIP and pick a category, hit
Search, then click "Find owner contact" on any card with a website.

## How the contact crawl works

For each business website, it fetches the homepage plus common pages
(`/about`, `/team`, `/contact`, `/staff`, etc.), pulls every email address it
finds — prioritizing `mailto:` links since those often sit next to a name —
and discards anything starting with a generic prefix (`info`, `contact`,
`support`, `sales`, `admin`, `hello`, and similar). What's left is tagged
high/medium/low confidence based on whether the address looks like
`firstname.lastname@`, `jsmith@`, etc.

## Known limitations — set expectations accordingly

- **Hit rate varies a lot.** Many small businesses simply don't list any
  personal email — only a contact form or a generic inbox. In that case the
  crawl correctly returns "no personal contact found," not an error.
- **No LinkedIn or business-registry lookups.** LinkedIn blocks scraping and
  requires login, and state business registries differ wildly with no
  unified API — neither is included here. If you want richer enrichment, a
  paid API (e.g. Hunter.io, which has a free tier) is the realistic next
  step, called as a fallback when the site crawl comes back empty.
- **Confidence scores are heuristics**, not verification — they're a sorting
  aid, not a guarantee the address is correct or still active.
- **Google Places costs add up.** Each search calls Place Details once per
  result (up to 20), and each of those is billed separately by Google.
  Consider caching aggressively (the upsert on `place_id` already avoids
  re-saving duplicates) and/or capping results per search.

## Outreach compliance

If you're using found contacts for email outreach, build in CAN-SPAM basics
from day one: clear sender identification, a working opt-out, and no
misleading subject lines.
