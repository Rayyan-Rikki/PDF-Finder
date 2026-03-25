# Prompt for Vercel v0 / AI Generator

**Project Name:** Gen Alpha Builders - Online Training Platform
**Tech Stack:** Next.js (App Router), TailwindCSS, Lucide React, Supabase (Context provided below).

## Core Concept
An **online training and upskilling platform** specifically designed for Gen Alpha (ages 8-14). The goal is to teach modern skills (coding, robotics, design, space engineering) through interactive "Sessions" (Workshops). Students watch lessons, build projects to match the theme, and upload them for feedback and peer review.

## Design Aesthetic
-   **Theme:** "Future Academy" meets "Cyberpunk Light". Dark mode default.
-   **Visuals:** High-energy, motivating. Progress bars, achievement badges, and neon accents (Cyan, Electric Purple).
-   **Typography:** Modern, tech-focused (e.g., 'Space Grotesk' headers, 'Inter' body).
-   **Vibe:** Professional enough to be real education, cool enough to keep kids engaged.

## Core Features & Pages to Generate

1.  **Navigation Bar**:
    -   Logo ("Gen Alpha Builders Academy").
    -   Links: Academy Home, Browse Workshops (Sessions), Student Showcase (Gallery).
    -   Auth Roles: Kids (Students), Parents (Supervisors), Admin (Teachers).

2.  **Landing Page (`/`)**:
    -   **Hero:** "Master Future Skills Today." Video background or dynamic 3D element.
    -   **Value Prop:** learn by doing, earn badges, build a portfolio.
    -   **Featured Workshops:** Horizontal scroll of active training cohorts (Sessions).
    -   **Success Stories:** Top "Presentations" (Student Projects) from recent workshops.

3.  **Workshop Browser (`/sessions`)**:
    -   **Concept:** This uses the `sessions` table.
    -   **UI:** Grid of Course Cards.
    -   **Card Details:** Title (e.g., "Mars Rover Design 101"), Theme tag, "Enrolled Students" count, Start Date.
    -   **Filter:** "Live Now", "Upcoming", "Archived".

4.  **Workshop Classroom (`/sessions/[id]`)**:
    -   **Header:** Workshop Title & Syllabus (Description).
    -   **Learning Area:** Placeholder for video lesson content or assignment details.
    -   **Action:** "Enroll in Class" (creates `registration`) / "Submit Assignment" (creates `presentation`).

5.  **Project/Assignment Submission (`/submit`)**:
    -   **Context:** Submitting work for a specific Workshop.
    -   **Form:**
        -   "Project Title"
        -   "What did you learn?" (Abstract)
        -   "Demo Video URL" (Loom/YouTube link)
        -   "Screenshot/Thumbnail" upload.
    -   **Gamification:** "Submit to earn 50 XP" badge next to the button.

6.  **Student Showcase (`/gallery`)**:
    -   **Concept:** A gallery of all approved Student Projects (`presentations`).
    -   **UI:** Masonry grid of projects.
    -   **Card:** Thumbnail, verified student badge, "Loves/Votes" count.

7.  **Project Detail (`/gallery/[id]`)**:
    -   **Layout:** Split screen. Left: Video Player. Right: Project info, Student reflection, Peer Comments.
    -   **Feedback:** "Give Feedback" button (Comments).

8.  **Student Dashboard (`/dashboard`)**:
    -   **My Learning:** List of enrolled Workshops.
    -   **My Portfolio:** List of own Submissions.
    -   **Progress:** "Level 5 Builder" - visualization of skills learned.

## Database Schema Mapping
The terminology in the database is generic (`sessions`, `presentations`) but maps perfectly to the education model:

*   **Sessions** = Workshops / Training Cohorts / Classes.
*   **Registrations** = Enrollment records.
*   **Presentations** = Student Assignments / Projects submitted for a class.
*   **Votes** = Peer 'Likes' or Kudos.

```sql
-- Profiles: distinct roles (admin, parent, kid)
create table profiles (
  user_id uuid references auth.users not null primary key,
  role text not null check (role in ('admin', 'parent', 'kid')),
  display_name text,
  age int,
  parent_user_id uuid, -- For kids linking to parents
  consent_for_under13 boolean default false
);

-- Sessions: The Workshops / Classes
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  title text not null, -- e.g. "Intro to Python"
  theme text, -- e.g. "Coding"
  description text, -- Syllabus / Learning goals
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('draft', 'published', 'closed'))
);

-- Registrations: Student Enrollment
create table registrations (
  session_id uuid references sessions(id) not null,
  user_id uuid references profiles(user_id) not null,
  type text not null -- 'attendee' (Student) or 'presenter' (Teacher/Guest)
);

-- Presentations: Student Assignment Submissions
create table presentations (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) not null,
  owner_user_id uuid references profiles(user_id) not null,
  title text not null,
  abstract text, -- "What I learned"
  status text not null, -- 'draft', 'submitted', 'approved' (Graded)
  video_url text,
  thumbnail_path text
);

-- Social: Peer Review & Feedback
create table votes (
  presentation_id uuid references presentations(id) not null,
  user_id uuid references profiles(user_id) not null
);

create table comments (
  presentation_id uuid references presentations(id) not null,
  user_id uuid references profiles(user_id) not null,
  body text not null,
  is_deleted boolean default false
);
```

## Instructions for AI
-   **Tone:** Empowering, educational, futuristic.
-   **Visuals:** Use high-contrast cards, progress rings, and clear typography.
-   **Functionality:** Ensure the "Enroll -> Submit -> Gallery" flow is clear in the UI navigation.
