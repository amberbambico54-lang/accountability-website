# Our Space

Our Space is a private, warm, and modern accountability website for Fernan and Alpha. It is designed as a shared digital home for faith, growth, business, wedding planning, financial stewardship, and future life planning.

## Tech stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Browser local storage
- Supabase Auth with SSR-compatible session cookies
- Recharts
- Lucide React

## Included experience

The app includes a responsive shell with desktop sidebar and mobile navigation, protected login flow, and the following modules:

- Dashboard
- Our Devotion
- UpSkill Progress
- Business Dump Ideas/Progress
- Faith Goals (5F's)
- Wedding Planning
- Marriage Plans
- Wedding Budget Piggy Bank
- Settings

This project is a front-end prototype. Supabase authentication can be configured, but no database schema, row-level policies, or cloud storage bucket is included.

Dashboard, Our Devotion, UpSkill Progress, Business Dump Ideas/Progress, Faith Goals, and Settings are permanent pages. UpSkill Progress uses learning tracks with checklists and automatically calculated progress; Business Dump Ideas/Progress uses descriptions and manually adjustable progress. In Settings, Wedding Planning, Marriage Plans, and Wedding Budget can be renamed, have their descriptions edited, or be removed from navigation. You can also create custom pages with a title and description, then add topics with checklists, mark tasks complete, and track progress. Topic and task cards are color-coded by author. For content cards, only the author can edit or delete the post or manage its checklist; other signed-in users can view it and create their own posts. This is a client-side UI rule while content remains in browser storage, not a security boundary. Database-backed access control still requires Supabase tables and row-level security. Page configuration and module content are stored in this browser's local storage. Wedding images are resized and stored as browser data URLs. Changes are available only in the same browser profile and are not backed up or synchronized across devices.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from its API settings.
3. In Supabase Authentication, invite only Fernan (`amberbambico.54@gmail.com`) and Alpha (`alpha.v.sugano@gmail.com`). Public sign-up is not enabled in the app.
4. Install dependencies:

```bash
npm install
```

5. Run the app:

```bash
npm run dev
```

6. Open http://localhost:3000 and sign in with the invited account credentials.

The app maps the authenticated email to Fernan or Alpha automatically and uses a different card color for each author's topics. Authentication requires a configured Supabase project. Keep `.env.local` out of version control; it is ignored by Git.

Until Supabase is configured, the login page offers temporary Fernan and Alpha demo profiles. These only set a browser-local identity for previewing author colors and attribution; they do not authenticate or protect private information. Demo content remains in browser `localStorage`. Reflections marked private are hidden from the other profile in the interface, but are not access-controlled.

Current module content is stored in browser `localStorage`, so it is not synchronized between separate devices/browsers. Do not store sensitive information in demo mode, and do not put a Supabase service-role key in client-side environment variables.

## Production deployment

This app is designed for Vercel deployment with environment variables configured in the project settings.

## Security requirements

- Keep secrets out of the repository.
- Use Supabase Auth for user sessions.
- Protect routes and database access using Row Level Security.
- Keep the shared workspace restricted to Fernan and Alpha only.
