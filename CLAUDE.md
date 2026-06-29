# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start Vite dev server only (port 1420)
pnpm tauri dev        # Start full Tauri desktop app (dev mode)
pnpm build            # TypeScript check + Vite production build
pnpm tauri build      # Build distributable desktop app
```

There is no test suite. TypeScript strict mode (`tsc --noEmit`) is the only static check, run implicitly by `pnpm build`.

## Architecture

This is a **Tauri 2 desktop application**: React 19 + TypeScript frontend built with Vite, Rust backend for OS-level capabilities (keyring, window management).

**Frontend stack:** React 19, React Router 7, Zustand 5, Axios, Tailwind CSS 4, shadcn/ui (New York style, zinc base color)

**Path alias:** `@/` maps to `src/`

### Environment Variables

Required in `.env`:
- `VITE_AUTH_API_URL` — authentication service
- `VITE_CONSOLE_API_URL` — main API
- `VITE_COOLIFY_BRIDGE_API_URL` — SSE stream endpoint for real-time updates

### Token Storage

Tokens are stored in the OS keyring via Tauri commands defined in `src-tauri/src/lib.rs` (`get_token`, `set_token`, `clear_token`, etc.). The frontend accesses them through `src/client/tokenStore.ts`. Do not use localStorage or sessionStorage for auth tokens.

### API Clients (`src/client/`)

Two Axios instances:
- `client/auth/client.ts` — unauthenticated, hits `VITE_AUTH_API_URL`
- `client/console/client.ts` — authenticated, hits `VITE_CONSOLE_API_URL`

`withAuthInterceptors.ts` wraps the console client to auto-refresh tokens on 401 and emit a custom `auth:unauthorized` event when refresh fails (which triggers logout).

### State Management (`src/store/`)

- `useUserStore` — current user profile
- `useDashboardStore` — real-time snapshot + SSE connection state. Handles `snapshot`, `metrics`, `server_reachability`, and `resource_status` events. Implements optimistic updates for resource actions and exponential backoff reconnect (1s → 30s max).

### Real-Time Updates

`src/layout/StreamController.tsx` manages the SSE connection lifecycle. The stream connects to `VITE_COOLIFY_BRIDGE_API_URL/stream` and feeds events into `useDashboardStore`. 401 responses from the stream trigger the same `auth:unauthorized` path as the REST clients.

### Routing (`src/App.tsx`)

- `/auth` — public
- All other routes are wrapped in `AppPrivateRoute` (requires valid token + loaded user profile); unauthenticated users are redirected to `/auth`

### UI Components

The UI is built on shadcn/ui adapted from the [tailwind-admin](https://tailwind-admin.com/) template. Follow tailwind-admin patterns for layout and component style.

**Always use the semantic CSS tokens from `src/App.css`** — never hard-code colors. The brand palette (mapped via `@theme inline` to Tailwind utilities like `bg-primary`, `text-foreground`, `border-border`, etc.):

| Token | Purpose | Brand value |
|---|---|---|
| `--primary` | Green CTA / active states | #0D7023 |
| `--secondary` | Yellow accent | #F4C03B |
| `--accent` | Subtle green tint | #283C3A |
| `--destructive` | Errors / delete actions | red |
| `--muted` / `--muted-foreground` | Disabled / secondary text | — |
| `--border` / `--input` | Borders and inputs | — |
| `--sidebar-*` | Sidebar-specific variants | — |

Use existing components in `src/components/ui/` before creating new ones: `StatusBadge`, `Search`, `PageHeader`, `FilledButton`, `TextButton`, `EditTable`. Add new shadcn primitives via `pnpm dlx shadcn@latest add <component>`.

**Naming and export rules for `src/components/ui/`:**
- File names must be **PascalCase** (e.g. `Dialog.tsx`, not `dialog.tsx`).
- Every component must be re-exported from `src/components/ui/index.ts`.
- Import from the barrel: `import { ... } from '@/components/ui'`.

### Commit Convention

Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
