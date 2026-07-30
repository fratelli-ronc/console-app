# What's Changed

### New Features

- **Server tree management** — New "Alberatura server" page for organizing servers into a parent/child hierarchy. Drag and drop a server onto another to re-parent it, or use the "Sposta" menu to search for a target and move it without dragging. Branches can be collapsed/expanded, search highlights matches plus their ancestors, and pending moves are staged locally with "Salva modifiche"/"Annulla" before being persisted.
- **User profilation page** — New "Profilazione" page listing each user's access scope (Completo/Limitato) with search and an access-level filter.
- **Users table filters and delete** — The users table now supports filtering by role and by active/disabled status, shows each user's phone number alongside their email, and supports deleting a user (with a confirmation dialog).

### Fixes

- **Concurrent 401s could clear valid tokens** — Token refresh is now serialized across all API clients, so simultaneous 401s from different requests share a single refresh instead of racing independent ones; a stale refresh could previously overwrite tokens a prior refresh had just set, effectively logging the user out.
- **Logout wasn't calling the auth service** — Logging out now correctly calls the auth service's logout endpoint before clearing local tokens, instead of only clearing them locally.
- **Server tree guide lines** — Fixed misplaced and "ghost" vertical guide lines in the server tree view.
