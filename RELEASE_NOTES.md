# What's Changed

### New Features

- **Update service image tag from the deploy page** — Clicking the new update icon on an `ImageCard` opens an `UpdateImageDialog` where you can pick a tag from the registry (or enter a custom one), select which services to update, and apply it. Progress is tracked per service with polling against `listServicesByImage` until each one comes back up on the new tag, showing success/failed indicators live. Backed by new `updateServiceImageTag` and `listImageTags` API calls.
- **Manual refresh on the Deploy page** — An "Aggiorna" button reloads the images list on demand, and it's also triggered automatically once an image update completes.
- **Splash screen on app load** — `AppPrivateRoute` now shows a new `SplashScreen` (logo + spinner) while the session is being validated, instead of rendering nothing. The private outlet only mounts once `/me` has resolved, avoiding a race where other authenticated requests could fire in parallel and trigger a duplicate token refresh.
- **Pending/running status indicators** — `StatusBadge` gained a `pending` state that swaps its static dot for an animated `RunSpinner`, and a new `StatusIndicator` module (`Spinner`, `RunSpinner`, `StatusDot`) is now shared across `ResourceCard`, `ServerCard`, and the deploy update flow. Transitional resource states (`starting`, `stopping`, `restarting`) now render with a spinner instead of a static dot.
- **`degraded:unhealthy` resource status** — Added to `resourceStatusConfig` with its own yellow badge/label, alongside the existing `running:unhealthy` state.

### Fixes

- **Stale SSE data after reconnects** — `infraStore`'s stream logic now tracks a `streamGeneration` counter so that a superseded connection attempt (e.g. after a fast `disconnect`/reconnect) can no longer resolve and apply state from an old, in-flight request.
- **Refresh token field naming** — Standardized on `refreshToken` (was inconsistently `refresh_token` in places) across `client/auth/client.ts`, `dtos.ts`, `withAuthInterceptors.ts`, `AuthPage.tsx`, and the SSE reconnect path in `infraStore.ts`.
