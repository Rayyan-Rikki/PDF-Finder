# PDF Finder

PDF Finder turns worksheet PDFs into reviewable quiz content and publishes them to authenticated users.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth, Postgres, Storage
- Gemini for PDF question extraction

## What Changed

- User access now requires authentication.
- Admin pages and worksheet management are protected by server-side role checks.
- Worksheet PDFs are stored in a private bucket and served through signed URLs.
- The database schema now matches the actual application.

## Supabase Setup

1. Apply the canonical migration:

```sql
-- File:
-- supabase/migrations/20260326190000_auth_and_worksheet_security.sql
```

This migration is written as the canonical reset for this project. If your Supabase instance was using the older mixed schema from this repo, apply it on a clean database or run a reset first.

2. Set these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

3. Run the app:

```bash
npm install
npm run dev
```

## Authentication

### Admin login

- Admin ID: `admin`
- Password: `rayyan123`

Internally this maps to the seeded Supabase account:

- Email: `admin@pdffinder.local`
- Password: `rayyan123`

### Demo user

- Email: `user@example.com`
- Password: `rayyan123`

### User self-registration

- Users can register directly from `/auth`.
- New registrations create a `profiles` row automatically through a database trigger.

## Commands

```bash
npm run lint
npm run test
npm run build
```

## Notes

- `npm run test` may fail in restricted sandboxes because `vitest` depends on spawning `esbuild`.
- `npm run build` needs outbound access for Google Fonts unless you switch to local fonts.
