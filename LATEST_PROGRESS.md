# Latest Progress Log

Single source of truth for significant changes. New entries are always prepended at the top.

Policy
- Keep this file concise: retain only the 4 most recent entries. When adding a 5th, delete the oldest one.
- Each entry should be self-contained: what changed, why, impact, and any follow-ups.
- Do not paste secrets. Use placeholders like YOUR_SUPABASE_ANON_KEY.

Entry Template
```
## YYYY-MM-DD — Short title

What changed
- Bullets of concrete changes across files/components

Why
- 1–2 lines on intent and impact

Notes
- Risks, migrations, or manual steps

Follow-ups
- Next actions (if any)
```

---

## 2025-10-29 — Env-driven Supabase client, examples, and agent docs

What changed
- Frontend Supabase client now reads from Vite env (no hardcoded keys): `crm-app/src/lib/supabase.ts`
  - Uses `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Throws a clear error if missing to prevent accidental leaks/misconfig
- Added environment examples with guidance
  - `crm-app/.env.example` (Vite client vars + BUILD_MODE note)
  - `supabase/.env.example` (Edge Functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `ALLOWED_ORIGINS`)
- Added root `.gitignore` to prevent committing env files and build outputs
  - Ignores `.env`, `crm-app/.env*`, `supabase/.env*`, `dist/`, etc.
- Removed `crm-app/dist` to scrub compiled artifacts that embedded previous keys
- Authored and updated AI agent guidance
  - `.github/copilot-instructions.md` created/updated with project-specific patterns and workflows

Why
- Centralize configuration via env to improve security and portability
- Prevent secret sprawl in source/bundles and guide contributors (human/AI) reliably

Notes
- Place your real values in `crm-app/.env.local` (not in tracked `.env`).
- If editor flags `import.meta.env`, it’s fine when running under Vite; `src/vite-env.d.ts` is present.
- The file `crm-app/.env` may contain developer-local values; recommended to move to `.env.local` and keep `.env` as placeholders.

Follow-ups
- Optional: add a short README section that points to `.env.example` files and where to obtain Supabase keys.
- Optional: CI check to fail builds if `VITE_SUPABASE_*` are missing in production builds.
