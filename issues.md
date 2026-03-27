# Major Issues

## 1. Admin-only actions are effectively public

- `app/admin/layout.tsx:4-42` renders the entire admin area with no auth or role check.
- `app/api/worksheets/upload/route.ts:6-97` accepts uploads from any caller and immediately uses the service-role client.
- `app/api/worksheets/[id]/publish/route.ts:5-57` accepts arbitrary worksheet IDs from any caller and publishes them with the service-role client.
- `schema.sql:68-79` defines unconditional `FOR ALL USING (true)` policies on `worksheets`, `questions`, and `raw_processing`.

Why this is major:
- Anyone who can reach the site can hit the upload and publish endpoints.
- The browser-side admin pages use the anon client, but the current RLS rules expose admin data anyway.
- This is a full authorization failure, not just a missing UI guard.

Recommended fix:
- Enforce auth and admin-role checks in `app/admin/*` layouts and in both API routes before doing any work.
- Replace the unconditional RLS policies with explicit admin-only policies tied to authenticated user roles.

## 2. Draft PDFs are publicly exposed before review

- `lib/supabase/storage.ts:14-16` creates the `worksheets` bucket as `public: true`.
- `app/api/worksheets/upload/route.ts:39-50` stores `pdf_url` as a public URL immediately after upload, even while the worksheet is still `processing`.
- `app/admin/review/[id]/page.tsx:247-252` uses that public URL directly in the review UI.

Why this is major:
- Any uploaded worksheet becomes accessible before human review or approval.
- If worksheets contain licensed, internal, or student-specific material, this is a direct data exposure problem.
- Public storage also makes it harder to revoke access later because the URL is not permission-gated.

Recommended fix:
- Use a private bucket.
- Store the storage path, not a permanent public URL.
- Generate signed URLs only for authorized admins and only when needed.

## 3. The setup docs and database artifacts describe a different product than the code

- `README.md` describes a session/presentation platform with auth, parents, kids, voting, and comments.
- `supabase/migrations/20240130184000_init_schema.sql` creates tables such as `profiles`, `sessions`, `presentations`, `votes`, and `comments`.
- The running app code expects `worksheets`, `questions`, and `raw_processing` instead, matching `schema.sql`.

Why this is major:
- A fresh setup that follows the README or migration file will not create the tables the app actually queries.
- This blocks reproducible deployment and makes the repository misleading for the next maintainer.
- It also makes it unclear which schema is authoritative.

Recommended fix:
- Decide which product this repo is supposed to be.
- Delete obsolete docs/migrations or replace them with a single canonical schema and setup path.

## 4. Publishing can destroy existing question data because the write path is not transactional

- `app/api/worksheets/[id]/publish/route.ts:16-50` deletes existing questions first, then inserts the new set, then updates worksheet status.

Why this is major:
- If the insert fails after the delete, the worksheet loses all of its published questions.
- If the status update fails after insertion, the worksheet can contain published questions while still showing the wrong worksheet status.
- Re-publishing is therefore not atomic and can leave the system inconsistent.

Recommended fix:
- Wrap delete/insert/status-update in a single database transaction or stored procedure.
- Validate the payload before deleting existing questions.

## 5. Reprocessing is fragile because raw extraction rows are not unique, but the review page assumes exactly one row

- `schema.sql:45-52` defines `raw_processing` without a uniqueness constraint on `worksheet_id`.
- `app/api/worksheets/upload/route.ts:68-71` always inserts a new `raw_processing` row.
- `app/admin/review/[id]/page.tsx:41-47` fetches with `.single()`, which fails if more than one extraction record exists.

Why this is major:
- Any retry, duplicate processing run, or manual backfill can create multiple extraction rows for one worksheet.
- At that point, the review screen breaks instead of loading the latest result.
- This prevents recovery from failed or repeated processing attempts.

Recommended fix:
- Enforce one current extraction row per worksheet, or query the latest row explicitly with ordering and `limit 1`.
- If historical processing is needed, model it intentionally and update the review page accordingly.

## 6. Upload processing has no size/rate/auth controls despite invoking storage and paid AI

- `app/api/worksheets/upload/route.ts:8-97` accepts a file from the request, uploads it, base64-encodes it, and sends it to Gemini.
- There is no authentication check, file-size limit, rate limit, or quota enforcement in this path.

Why this is major:
- A public caller can drive storage growth and AI cost.
- Large PDFs can create memory pressure because the file is read multiple times into memory.
- This endpoint is an easy abuse target even if the rest of the app is small.

Recommended fix:
- Require admin auth before upload.
- Enforce file-size caps and request throttling.
- Avoid reading the same file into memory multiple times.

## Validation Notes

- `npm.cmd run lint` passed.
- `npm.cmd run test` did not complete in this sandbox because `vitest` failed to start `esbuild` (`spawn EPERM`), so the findings above come from code inspection rather than a full test run.
- `npm.cmd run build` was blocked by sandboxed network access to Google Fonts, so build output here is not a reliable signal about the app itself.
