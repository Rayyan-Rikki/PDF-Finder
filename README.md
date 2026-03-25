# Rayyan Gen Alpha Builders MVP

A production-ready web application built for the next generation of builders. Manage sessions, share projects, and interact with the community.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Validation**: Zod + React Hook Form
- **Testing**: Vitest (Unit) + Playwright (E2E)

## Core Features
- **Role-Based Access**: Admin, Parent, and Kid roles with strict RLS enforcement.
- **Onboarding**: Parents can create managed Kid profiles for ages < 13.
- **Session Management**: Admins can create and manage building sessions.
- **Presentation Lifecycle**: Draft -> Submit -> Admin Review -> Approved Gallery.
- **Interactions**: Voting (1 per user) and soft-deletable comments.
- **File Storage**: Upload project thumbnails and PDF documentation.

## Local Setup

### 1. Prerequisites
- Node.js 18+
- Supabase account and a new project

### 2. Database Setup
1. Copy the contents of `supabase/migrations/20240130184000_init_schema.sql` into the Supabase SQL Editor and run it.
2. (Optional) Run `supabase/seed.sql` to populate initial sessions.

### 3. Environment Variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
*Note: Service role key is required for parents to create kid accounts via admin client.*

### 4. Admin Bootstrap
To mark yourself as an admin:
```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'your_auth_user_id';
```

### 5. Install & Run
```bash
npm install
npm run dev
```

## Testing

### Unit Tests (Server Actions)
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npx playwright install
npm run e2e
```

## Manual Test Plan

### Parent Flow
1. Sign up on `/auth`.
2. Navigate to Dashboard.
3. Use "Add Kid Builder" form to create a child account.
4. Verify the kid account is listed (coming soon) or usable by logging in.

### Kid / Presenter Flow
1. Log in with kid credentials.
2. Go to `/sessions` and register for an active session as "Presenter".
3. Go to `/presentations/create` and save a project as Draft.
4. Upload a thumbnail and PDF.
5. Click "Submit for Review" on the project detail page.

### Admin Flow
1. Log in as an Admin.
2. Navigate to `/admin`.
3. Review submitted projects in the "Review Queue".
4. Approve a project and verify it appears in the public Gallery (`/presentations`).
5. Create a new Session in "Session Management".

### Community Interaction
1. On any "Approved" project page:
2. Vote for the project (verify you cannot vote twice).
3. Post a comment.
4. (As author/admin) Delete a comment.
