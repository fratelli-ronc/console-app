# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Desktop app (starts Vite dev server + Rust dev build)
pnpm tauri dev

# Frontend only
pnpm dev          # Vite dev server at http://localhost:1420
pnpm build        # TypeScript check + Vite production build → dist/

# Desktop release build
pnpm tauri build

# Rust only
cargo build --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
```

Environment variables go in `.env` (copy from `.env.example`): `VITE_AUTH_API_URL`, `VITE_CONSOLE_API_URL`.

## Architecture

This is a **Tauri 2.x** desktop app. The frontend (React 19 + TypeScript) runs in a WebView; the Rust backend exposes Tauri commands over IPC. The two sides communicate exclusively via `invoke()` calls — there is no shared memory.

### Frontend (`src/`)

**Routing** — React Router 7, two routes:

- `/auth` → `AuthPage` (public)
- `/` → `HomePage` (private, guarded by `AppPrivateRoute` which checks the Tauri keyring)

**HTTP layer** (`src/client/`) — Axios instances per domain:

- `auth/client.ts` — two instances: unauthenticated (`authClient`) and authenticated (`authenticatedAuthClient`)
- `console/client.ts` — `consoleClient` with the same auth interceptor pattern
- `withAuthInterceptors.ts` — factory that attaches a Bearer token and handles 401 → token refresh → retry; on refresh failure it dispatches `auth:unauthorized` (caught by the router to redirect to `/auth`)
- `tokenStore.ts` — thin wrappers around `invoke('get_token')` / `invoke('set_token')` etc.

New API domains follow the same pattern: a `client.ts` with an axios instance, a `requests.ts` with typed functions, and a `dtos.ts` for interfaces.

**Styling** — Tailwind CSS 4 (via `@tailwindcss/vite`). Design tokens live in `src/App.css` as CSS custom properties (OKLch palette: primary green `#0D7023`, secondary yellow `#F4C03B`). shadcn/ui New York style. Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classes.

**Path alias** — `@/` resolves to `src/`.

### Backend (`src-tauri/src/lib.rs`)

All Tauri commands live in `lib.rs`. Currently six commands for token management:

| Command                                                           | Description   |
| ----------------------------------------------------------------- | ------------- |
| `set_token` / `get_token` / `clear_token`                         | Access token  |
| `set_refresh_token` / `get_refresh_token` / `clear_refresh_token` | Refresh token |

Tokens are stored in the OS native keyring (via the `keyring` crate, service ID `it.fratellironc.consoleapp`) with an in-memory `Mutex<Option<String>>` cache for performance. `keyring::Error::NoEntry` is treated as a `None` (not an error).

New Tauri commands must be registered in the `.invoke_handler()` call inside `run()`.

## Conventions

- **Commits** follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Formatting** — Prettier: no semicolons, single quotes, trailing commas
- **No global state library** yet — use React `useState`; token state lives in the Rust keyring
- **No test files exist yet** — Rust unit tests go in `lib.rs` modules; frontend tests would use Vitest
