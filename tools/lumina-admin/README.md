# Lumina SIM Admin shortcuts

Double-click any of these to open the **Lumina test user** dashboard (`/lumina-sim-admin/`).

| File | Opens |
|------|--------|
| `Open Lumina Admin.url` | Production: https://www.heeriseacademy.com/lumina-sim-admin/ |
| `Open Lumina Admin (local).url` | Local Hugo: http://localhost:1313/lumina-sim-admin/ |
| `Open-Lumina-Admin.bat` | Same as production (pass `local` for localhost) |
| `Open-Lumina-Admin.html` | Browser redirect to production |

## First time

1. Set `LUMINA_ADMIN_KEY` in `backend/.env` (and Cloud Run / GitHub Secrets for production).
2. Open the dashboard via a shortcut above.
3. Enter the admin key and check **Remember on this device**.
4. Later clicks of the shortcut go straight into the user list (same browser).

To pin on Windows desktop: right-click `Open Lumina Admin.url` → **Send to → Desktop (create shortcut)**.
