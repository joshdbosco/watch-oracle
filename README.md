# The Watch Oracle

A watch gift recommendation quiz. Seven questions, no watch knowledge needed.

Built with **Next.js 14**, **Notion** as the database, and **Resend** for email.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Notion |
| Email | Resend |
| Auth | iron-session (password cookie) |
| Styling | CSS variables + Tailwind |

---

## Setup — zero to deployed in 10 steps

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/watch-oracle.git
cd watch-oracle
npm install
```

### 2. Create your Notion databases

You need **two** Notion databases. Create them in your workspace:

**Watches database** — one row per watch. Add these properties:

| Property name | Type |
|---|---|
| Name | Title |
| Brand | Text |
| Price | Text |
| Pitch | Text |
| Tags | Multi-select |

**Submissions database** — one row per quiz submission:

| Property name | Type |
|---|---|
| Name | Title |
| Email | Email |
| Extra | Text |
| Tags | Text |

### 3. Create a Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration** → give it a name → **Submit**
3. Copy the **Internal Integration Secret** (starts with `secret_`)
4. Go to each database → click **...** → **Add connections** → select your integration

### 4. Get your database IDs

Open each database in Notion. The URL looks like:
```
https://notion.so/yourworkspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...
```
The 32-character string is the database ID. Copy both.

### 5. Set up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain (or use the sandbox for testing)
3. Create an API key at **API Keys** → copy it

### 6. Generate your admin password hash

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('your-password-here', 10))"
```

Copy the output hash (starts with `$2a$`). Keep the actual password somewhere safe.

### 7. Generate your session secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 8. Create your `.env.local` file

```bash
cp .env.example .env.local
```

Fill in every value:

```env
NOTION_API_KEY=secret_xxxx
NOTION_WATCHES_DB_ID=xxxx
NOTION_SUBMISSIONS_DB_ID=xxxx

RESEND_API_KEY=re_xxxx
RESEND_TO_EMAIL=you@yourdomain.com
RESEND_FROM_EMAIL=oracle@yourdomain.com

ADMIN_PASSWORD_HASH=$2a$10$...the hash you generated...
SESSION_SECRET=...the hex string you generated...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 9. Populate Notion with the watches

The quickest way: copy the CSV from the repo into a Notion database import, or add them manually. Each watch needs all five fields filled in.

**Tags format** — add these as multi-select options, one per tag. Example for the Tudor Black Bay 58:
```
budget_personal, level_2, level_3, diver, water, casual, smart_casual,
med_wrist, case_39_42, mono, colourful, heritage, precision, collector
```

### 10. Run locally

```bash
npm run dev
```

- Quiz: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel and it deploys automatically on every push.

**Add environment variables in Vercel:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add every variable from your `.env.local`
3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL

---

## Adding watches via the admin editor

1. Go to `/admin` on your deployed site
2. Enter your password
3. Click **+ Add** → fill in Name, Brand, Price, Pitch, Budget tier, and Tags
4. Click **Save** — it writes directly to Notion

The quiz page revalidates every 5 minutes, so new watches appear within 5 minutes of being added.

---

## Adding watches via GitHub (open source contributions)

For community contributions, the recommended flow is:

1. Fork the repo
2. Edit `CONTRIBUTING.md` with the watch details
3. Open a Pull Request — you review it and add the watch via the admin editor

This keeps the Notion database as the single source of truth while allowing public suggestions.

---

## GDPR compliance

- No cookies are set on visitors (the quiz is fully client-side state)
- The admin session cookie is `httpOnly`, `secure`, and expires after 8 hours
- No analytics or tracking unless you add them
- Email submissions are stored in Notion under your control
- Add a privacy policy page at `/privacy` before launching publicly

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Quiz — fetches watches from Notion, renders QuizApp
│   ├── admin/page.tsx        # Admin — session-guarded, renders editor or login
│   ├── api/
│   │   ├── watches/          # GET all, POST create
│   │   ├── watches/[id]/     # PUT update, DELETE archive
│   │   ├── submit/           # Quiz email submission → Resend + Notion
│   │   └── admin/login/      # Password check → session cookie
│   └── globals.css           # Oracle design tokens
├── components/
│   ├── QuizApp.tsx           # The full quiz UI (client component)
│   ├── AdminEditor.tsx       # The database editor (client component)
│   └── AdminLogin.tsx        # Password form (client component)
└── lib/
    ├── types.ts              # Shared TypeScript types
    ├── notion.ts             # All Notion API calls
    ├── quiz.ts               # Questions, recommendation engine, persona builder
    └── session.ts            # iron-session config
```
