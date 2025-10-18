# Gridfinity Label Maker

Design, personalize, and print labels for your Gridfinity storage system right
from the browser. The live experience is hosted on GitHub Pages and always
available at **<https://2wenty2wo.github.io/>**.

## Navigation

- [Using the Label Maker](#using-the-label-maker)
- [Feature Walkthrough](#feature-walkthrough)
- [Sharing and Collaboration](#sharing-and-collaboration)
- [Additional Pages](#additional-pages)
- [FAQ](#faq)
- [Project Structure](#project-structure)
- [Change Log](#change-log)

## Using the Label Maker

1. Visit the hosted label maker at <https://2wenty2wo.github.io/>.
2. Pick a **Preset** (for example, screws, inserts, or fully custom) to load the
   matching layout and helper text.
3. Enter your hardware details, adjust measurements, and tailor the text shown
   on the label preview.
4. Choose between **Light** and **Dark** themes using the theme toggle in the
   toolbar. Your preference is stored for the next visit.
5. Use the live preview pane to confirm spacing, alignment, and iconography.
6. Select **Download** for an SVG you can archive or edit, or **Print** for a
   printer-friendly sheet using the current label settings.

### Fine-tune each section

- **Label Layout** – Rearrange fields, toggle optional panels, and adjust slot
  sizing for complex drawers.
- **Hardware Details** – Quickly swap between common thread sizes, bearing
  dimensions, or electronics footprints. Preset metadata keeps measurements
  accurate.
- **Visual Enhancements** – Add icons, pick Font Awesome glyphs, and configure
  optional QR codes without leaving the page.

## Feature Walkthrough

Gridfinity Label Maker is a static web application powered entirely by modular
JavaScript, modern HTML, and layered CSS. Highlights include:

- **Theme persistence** that remembers your dark or light preference.
- **Preset-driven forms** that auto-populate fields for screws, nuts, inserts,
  fuses, bearings, electronics, and more.
- **Contextual validation** to keep the preview aligned with your selections and
  warn when inputs fall outside recommended ranges.
- **On-demand QR codes** that lazy-load the generator only when a code is
  enabled, keeping the base experience lightweight.
- **Unified SVG rendering** to ensure the onscreen preview matches downloaded
  and printed output.
- **Shareable label URLs** with Web Share API integration and clipboard
  fallbacks for browsers without native sharing.

## Sharing and Collaboration

Use the **Share** button next to Download and Print to capture the entire label
configuration in a link. When supported, the Web Share API opens native share
sheets so you can message or airdrop labels directly. Browsers without Web Share
support copy the link to your clipboard and display a confirmation. Opening a
shared URL hydrates every input and immediately restores the label preview.

## Additional Pages

- **Label Maker** – <https://2wenty2wo.github.io/> is the main interface for
  designing, downloading, and printing labels.
- **Printable TODO List** – <https://2wenty2wo.github.io/todo.html> offers a
  matching checklist template rendered with the same styling utilities.

## To-do vote service

The project now includes a serverless endpoint (`netlify/functions/todo-votes.js`)
that stores per-user votes for each to-do item. When deployed to Netlify, the
function is exposed at `/api/todo-votes` for both reads and writes.

### Environment variables

Configure the following variables in your Netlify site (or equivalent hosting
platform) before deploying:

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL used to persist votes. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key with `todo_votes` table access. |
| `TODO_VOTES_TABLE` (optional) | Name of the Supabase table (defaults to `todo_votes`). |
| `TODO_VOTES_ALLOWED_ORIGINS` (optional) | Comma-delimited list of origins allowed by CORS. Leave blank to allow any origin. |

Create the backing table with a unique constraint to enforce one vote per user
and to-do ID:

```sql
create table if not exists public.todo_votes (
  todo_id text not null,
  user_id text not null,
  value integer not null check (value in (-1, 0, 1)),
  updated_at timestamptz not null default now()
);

create unique index if not exists todo_votes_todo_id_user_id_idx
  on public.todo_votes (todo_id, user_id);
```

### Deployment

1. Deploy the repository to Netlify with Functions enabled (no build step is
   required for this static site).
2. Set the environment variables above in the Netlify dashboard.
3. Redeploy to make the new settings available to the function.
4. From the static site, issue `fetch('/api/todo-votes', { method: 'GET' })` to
   read totals and `fetch('/api/todo-votes', { method: 'POST', body: '{"todoId":"...","vote":1}' })`
   to upsert a vote. Include an optional `userId` in the JSON payload or rely on
   the hashed IP + User Agent fallback.

## FAQ

**Do I need to install anything?**  
No. Everything runs in the browser and works on desktops, tablets, and phones.

**Which browsers are supported?**  
Modern Chromium, Firefox, and Safari releases are tested regularly. Earlier
versions may function but are not officially supported.

**Can I contribute improvements?**  
Absolutely! Review [`CONTRIBUTING.md`](CONTRIBUTING.md) for development, testing,
and deployment guidance.

## Project Structure

```
├── index.html             # Application shell, form markup, and feature toggles
├── js/
│   ├── actions.js               # Shared action handlers invoked by UI events
│   ├── collapsible-sections.js  # Expand/collapse helpers for grouped settings
│   ├── controls.js              # Entry point that bootstraps modules and listeners
│   ├── data.js                  # Static measurements, presets, and asset lookups
│   ├── dom-elements.js          # Cached DOM references for easier querying
│   ├── events.js                # Wiring for form, download, and print events
│   ├── fontawesome-icons.js     # Icon mapping for lazy-loaded Font Awesome glyphs
│   ├── forms.js                 # Field population, validation, and UI helpers
│   ├── label/
│   │   ├── layoutEditor.js      # Drag-and-drop layout editing for advanced labels
│   │   ├── layoutPresets.js     # Predefined label layouts and slot definitions
│   │   └── renderLabelSVG.js    # SVG assembly for label previews and exports
│   ├── lazy-loaders.js          # On-demand loading of the QR code library
│   ├── render.js                # Label preview updates and export orchestration
│   ├── state.js                 # Centralized application state store
│   ├── theme.js                 # Theme toggle behavior and persistence helpers
│   ├── threadSizes.js           # Thread-size presets for hardware options
│   ├── todo/
│   │   └── todo-renderer.js     # Rendering helpers for the printable TODO list
│   ├── todo-page.js             # Bootstraps the TODO page and its interactions
│   ├── url-state.js             # URL serialization and parsing for shareable labels
│   └── warning-message.js       # Utility for inline warning banners and alerts
├── style.css              # Custom styling layered on Bootstrap defaults
├── style-print.css        # Print-specific overrides for labels
├── print.css              # Utility styles applied to print views
├── manifest.json          # Progressive Web App metadata
└── images/
    └── icons/             # Favicons and touch icons used across devices
```

## License

This project is available under the terms of the MIT License. See
[`LICENSE`](LICENSE) for the full text.

## Change Log

Release history is tracked in [`CHANGELOG.md`](CHANGELOG.md) using the
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) convention. Refer to
that file for a detailed summary of notable updates.
