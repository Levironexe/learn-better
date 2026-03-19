# Quickstart: AI-Powered Learning Platform

**Feature**: 001-ai-learning-platform
**Date**: 2026-03-18

---

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- An Anthropic API key

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Configure environment variables

Create `.env.local` at the project root:

```env
# Supabase — from your Supabase project dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase DB connections — from dashboard > Connect
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
DATABASE_URL_UNPOOLED=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 3. Run database migrations

```bash
npx drizzle-kit generate   # creates SQL files in drizzle/migrations/
npx drizzle-kit migrate    # applies migrations to Supabase via direct connection
```

---

## 4. Set up Supabase Auth trigger

In the Supabase SQL editor, run this once to auto-create profile rows on signup:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 6. Validate the happy path

1. Go to `/register`, create an account
2. You are redirected to the main app (split-view layout)
3. Type "I want to learn Git basics" in the right chat panel
4. A structured lesson plan appears in the left docs panel
5. Click on section headings in the sidebar — content scrolls correctly
6. Toggle the theme button in the navbar — interface switches instantly
7. Log out, log back in — the lesson plan is still there

---

## 7. Run end-to-end tests

```bash
npx playwright install   # first time only
npx playwright test
```

---

## Common issues

| Problem | Fix |
|---------|-----|
| `drizzle-kit migrate` fails | Make sure `DATABASE_URL_UNPOOLED` points to the direct connection (port 5432), not the pooler |
| AI responses not streaming | Check `ANTHROPIC_API_KEY` is set in `.env.local` |
| Session not persisting after page refresh | Confirm `middleware.ts` is at the project root (not inside `src/`) |
| Profile not created after signup | Run the Supabase trigger SQL in step 4 |
