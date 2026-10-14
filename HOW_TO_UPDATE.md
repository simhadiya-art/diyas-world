# How to update Diya's World

Everything you'll want to change lives in **`src/content/`** as plain text files.
You never need to touch the layout code to add things. Save the file, and the site updates.

> **See changes while you edit:** open a terminal in VS Code (**Terminal → New Terminal**), type `npm run dev`, then open http://localhost:4321 in your browser. It refreshes every time you save.
>
> **Publish changes:** commit and push to GitHub (see `SETUP.md`). Vercel rebuilds the live site in about a minute.

---

## The three kinds of content

| Folder | What it is | One file = |
|---|---|---|
| `src/content/places/` | Cities on the map | one city page |
| `src/content/experiences/` | Jobs, roles, projects you did in a city | one experience card + one journal entry |
| `src/content/projects/` | Deep-dive "case files" | one project page |

Each file has a **header** between two `---` lines (the facts), then optional **body text** underneath (the story).

### ⚠️ Two rules for the header
1. If a value contains `#` or `:` wrap it in quotes: `summary: "We finished #2 in the class."`
2. Keep the spacing (indentation) exactly like the examples. Spaces, not tabs.

---

## Add a photo

1. Put the original in `assets-raw/` (that folder never goes online).
2. Copy it into the matching folder in `src/assets/images/places/<city>/` with a short, lowercase, hyphenated name, e.g. `sunset-hike.jpg`. (Or add a line for it in `scripts/prepare-images.mjs` and run `npm run images`.)
3. Add it to the city's `gallery:` list in `src/content/places/<city>.md`:

```yaml
gallery:
  - src: ../../assets/images/places/phoenix/sunset-hike.jpg
    alt: Diya and friends hiking at sunset above the city   # describe the scene
    caption: The hike that almost killed us.                # optional, shown handwritten
```

The site automatically makes small, fast versions of every photo.

**Privacy rules (always):** captions never name anyone but you · no identifiable photos of children · nothing confidential from work.

---

## Write a reflection

Open the experience file, e.g. `src/content/experiences/wells-fargo.md`, and write underneath the bottom `---`:

```markdown
---
place: phoenix
org: Wells Fargo · Chief Operating Office
...
---

The moment I'll remember is the night before the innovation sprint final...

A second paragraph works too.
```

Empty body = the page shows a "still writing" journal page with prompts. Fill it in and it becomes your real entry.

Remove a handwritten "to confirm" sticky note by deleting its line under `tbd:` (or delete the whole `tbd:` list).

---

## Add a new experience

Create `src/content/experiences/my-new-thing.md`:

```yaml
---
place: davis                 # must match a file name in places/ (without .md)
org: Name of the organization
role: Your title
dates: Fall 2026             # shown exactly as written
start: "2026-09"             # year-month, used to sort newest first
summary: One sentence about what it was.
highlights:
  - Something you did, with a number if you have one
  - Another thing
---
```

---

## Add a new city

1. Create `src/content/places/new-york.md` (copy an existing one as a starting point).
2. Look up the city's latitude/longitude (search "New York coordinates") and fill in `coords`.
3. Set `order:` to its position on the journey (6 = after Phoenix). The dotted line, the map pin, the postcard, and the next/previous links all update automatically.
4. Pick a hero: `signature: none` gives a clean big-title hero. (The special ones, `chalkboard`, `bike`, `dome`, `capitol`, `card`, are custom-built per city. Ask Claude for a new one.)
5. `map: india` puts the pin on the India card instead of the US map.
6. Put two nearby cities in the same `cluster:` (like `NorCal`) to share one pin that splits when clicked.

---

## Add a project "case file"

Copy `src/content/projects/mgt120.md`, rename it, and change the header. `slides:` is the swipeable deck; add `zoom: true` to slides people should be able to enlarge. The body (below `---`) is the write-up and supports `## headings`, lists and **bold**.

---

## Change words that aren't in content files

| What | Where |
|---|---|
| Homepage intro paragraph, door teasers, stickers | `src/pages/index.astro` |
| Mailroom intro | `src/pages/mailroom.astro` |
| 404 page | `src/pages/404.astro` |
| Colors and fonts | `src/styles/global.css` (top of the file) |
