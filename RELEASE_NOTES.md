# What's Changed

### New Features

- **Variables management page** — A new "Variabili" section lets you view and bulk-edit the variables of a station or group in one editable grid. Pick a station (and optionally a group) to load its variables, then edit any field inline — group, name, class, format, driver, unit, print order, min/max, logs, cumulative, hidden/preview flags and tags — with dedicated select, number, toggle and searchable-dropdown cell editors. Add and remove rows, then commit every create, update and delete in a single batch save (or with ⌘/Ctrl+S).
- **Instant in-memory filtering** — On the variables grid the search box (by name or ID), the class filter and the tag filter all apply client-side: narrowing the view never reloads data or drops pending edits.
- **Unsaved-changes protection** — When a table has uncommitted edits, a pending-changes bar shows how many changes are waiting, with Save and Discard actions. Leaving the page or switching the station/group scope now asks for confirmation before those edits are lost.
- **Explanations for disabled actions** — Hovering a disabled "add" button reveals a short popover explaining why it is unavailable (for example, that a group must be selected first).

### Fixes

- **Consistent controls across the app** — Buttons, text buttons, search fields, filter pills, dropdown menus and table cell selects were normalized to a shared size and style. The separate per-page refresh buttons were replaced by a single reusable "Ricarica" button (with a smoother spinner) on the Deploy, Stations, Groups, Station tags, Group tags, Profilation and Users pages.
- **No more unwanted input correction** — Text and search fields throughout the app no longer trigger browser autocapitalize, autocorrect or spellcheck.
- **More legible placeholders** — Input placeholder text now uses a dedicated color token with better contrast.
