# SkillSphere — Frontend

React + Vite + TypeScript SPA for the SkillSphere skill assessment platform.

- **Live**: https://skillsphere.pfuat.xyz
- **Backend repo**: [Mverick98/skillsphere-backend](https://github.com/Mverick98/skillsphere-backend) (FastAPI, deployed alongside this SPA on the same EC2 instance)
- **Default branch**: `main` (= the deployed code). The previous divergent `main` is preserved as `main-archive` for reference.

## Stack

- **Vite 5** + **React 18** + **TypeScript**
- **Bun** for package management (`bun.lockb` is the source of truth — not `package-lock.json`)
- **shadcn/ui** components + **Tailwind CSS**
- **axios** for API calls (auth token via interceptor; auto-redirect on 401)
- **react-router-dom 6**
- Auth state in `sessionStorage` (per-tab independence; admin and candidate can be open simultaneously in different tabs)

## Local development

Install Bun once: https://bun.sh/

```sh
bun install
bun run dev          # Vite dev server on http://localhost:8080
```

Optionally set `VITE_API_URL` to point at a non-default backend:

```sh
# .env
VITE_API_URL=http://localhost:8000/api    # local backend
# or (production behind Cloudflare; backend serves the SPA)
VITE_API_URL=/api
```

## Build & deploy

The production deploy serves this SPA from the **backend's** `static/` folder (FastAPI mounts it at `/`). To deploy:

```sh
# 1. Build (produces dist/)
bun run build

# 2. On the EC2:
sudo cp -r dist/* /home/ssm-user/skillsphere/static/
sudo docker restart skillsphere-api
```

There's no separate frontend host — backend serves the bundle. CORS, auth, and routing all assume same-origin.

## Project structure

```
src/
├── App.tsx                 # routes
├── context/AuthContext.tsx # sessionStorage-backed auth state
├── services/api.ts         # axios client + endpoint helpers
├── pages/
│   ├── candidate/          # Login, Dashboard, Tests, PreTest, Assessment, Results, ...
│   └── admin/              # Login, Dashboard, Templates, Candidates, Reports, Users, ...
├── components/
│   ├── assessment/         # FitToRoleGauge, ProficiencyGauge, StarRating, ...
│   ├── proctoring/         # ProctoringEvidence
│   └── ui/                 # shadcn primitives
├── hooks/
│   ├── useBrowserProctoring.ts
│   ├── useFaceDetection.ts
│   ├── useProctoringRecorder.ts
│   ├── useAssessmentBlocker.ts
│   └── use-toast.ts
└── layouts/
    └── CandidateLayout.tsx
```

## Key flows

### Candidate (invite-driven)
1. Email contains invite link `https://skillsphere.pfuat.xyz/invite/<token>`
2. `InviteLanding` validates the token. If logged out, stashes the resolved `invite_id` in `sessionStorage.pending_invite` and redirects to `/login`.
3. After login (or registration), if `pending_invite` is set → redirect straight to `/tests/{invite_id}` (the pre-test page) instead of `/dashboard`.
4. `PreTest` shows test details + camera/proctoring warning → "Begin Assessment" → `/assessment/{invite_id}/proctoring` (consent) → assessment runs → results + auto-POST to n8n by backend.

### Admin
- `/admin/login` → admin-only login (backend rate-limited to 3/min).
- `/admin/templates`, `/admin/candidates`, `/admin/users`, `/admin/dashboard`, per-candidate `/admin/reports/{invite_id}`.

## Auth

- Held in `AuthContext` (React) and mirrored to `sessionStorage` (`auth_token`, `user_type`, `user_data`).
- `sessionStorage` is per-tab — admin and candidate tabs can be open at the same time without colliding.
- Backend issues JWTs (60-min expiry). Axios response interceptor catches `401` and bounces back to `/login` (or `/admin/login` based on `user_type`).
- `pending_invite` is also in `sessionStorage`; cleared on logout AND on admin-login to prevent stale-redirect bugs.

## Backend integration cheatsheet

| What | URL |
|------|-----|
| API base | `/api` (same-origin) |
| Candidate login | `POST /api/candidate/login` |
| Admin login | `POST /api/admin/login` |
| List candidate's tests | `GET /api/candidate/tests` (returns only that user's invites) |
| Test details | `GET /api/candidate/tests/{invite_id}` — returns **403** with detail if invite belongs to a different user; frontend toasts the message and redirects to dashboard |
| Assessment lifecycle | `POST /api/assessments/start` → `submit-answer` → `complete` |
| Proctoring | `POST /api/assessments/{id}/proctoring/{event,snapshot,upload-chunk,finalize-recording,...}` |
| Pull endpoint (n8n) | `GET /api/webhook/report/by-invite/{id}` (requires `X-API-Key`) |

Backend sends `Cache-Control: no-store, no-cache, must-revalidate, private` and `Vary: Authorization` on all `/api/*` responses, so cross-user response caching can't happen.

## Conventions

- TypeScript strict mode; no `any` — use `unknown` + narrowing.
- Tailwind via shadcn — extend `tailwind.config.ts`, don't write raw CSS.
- One feature per branch off `main`; merge with `--no-ff` so the merge commit is visible.
