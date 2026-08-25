# What's Changed

### New Features

- **Station management** — New "Stazioni" section for full station CRUD: list with search, active/disabled filter, tag badges, maintenance mode, create/edit forms with photo upload, and a tag picker for assigning existing tags.
- **Station tag management page** — New "Gestisci tag" page (reachable from the Stazioni toolbar) listing station tags with search, showing each tag's assigned stations on hover, and supporting create/rename/delete.
- **Groups management** — New "Gruppi" section mirroring the stations CRUD: list with search and active/disabled filter, associated station and protocol/network-type info, create/edit forms, and a dedicated group tag management page with its own picker.
- **Users sync status indicator** — Admins now see a live sync-status badge in the Utenti page header, polling every 30s and showing per-node bootstrap state, pending operations, and failing sync events on hover.
- **Splash screen and lazy-loaded pages** — Routes are now code-split and lazy-loaded behind a splash screen shown while a page chunk is loading, reducing initial load time.
- **Maintenance mode as a dropdown** — The station form's "Modalità manutenzione" field is now a select (Nessuna/Stazione/Gruppo) instead of free text, and the stations table renders the corresponding label instead of the raw value.
- **Clearer edit breadcrumbs** — Editing a user or station now shows "Modifica <nome>" in the breadcrumb instead of a generic "Modifica utente"/"Modifica stazione".

### Fixes

- **Numeric sort in image version/tag pickers** — Deploy image versions and tags are now sorted numerically-aware, so e.g. "10" sorts after "9" instead of before it.
- **Coolify start/stop/restart used the wrong HTTP method** — Resource start, stop, and restart requests now correctly `POST` instead of `GET`, matching the Coolify API.
- **Station tag picker allowed accidental deletion** — Removed the inline delete button from the station tag picker used in the station form; tags are now only deleted from the dedicated tag management page.
