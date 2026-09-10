This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

This project requires the following environment variables:

### Database (Neon PostgreSQL)

The app connects to [Neon](https://neon.tech) PostgreSQL through Prisma's Neon driver adapter. Provide these environment variables:

```bash
# Pooled connection for the application (hostname includes -pooler)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"

# Direct (unpooled) connection for Prisma CLI migrations
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require"
```

- `DATABASE_URL` is used at runtime via `@prisma/adapter-neon`.
- `DIRECT_DATABASE_URL` is used by Prisma CLI commands (`migrate`, `db push`) so schema changes bypass Neon's pooler.

### Prisma commands

- Generate client: `npx prisma generate`
- Apply schema to a fresh database: `npx prisma migrate deploy`
- Reset development database: `npx prisma migrate reset`

### Google reCAPTCHA

For the sign-up page, you need to provide Google reCAPTCHA credentials:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-site-key-here"
RECAPTCHA_SECRET_KEY="your-secret-key-here"
```

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Your Google reCAPTCHA site key (public, used on the client-side)
- `RECAPTCHA_SECRET_KEY`: Your Google reCAPTCHA secret key (private, used for server-side verification)

**Important:** Make sure to add all domains where reCAPTCHA will be used in your Google reCAPTCHA admin console:
- `localhost` (for local development)
- `127.0.0.1` (for local development)
- `easymath-lms.vercel.app` (for production)
- Any other domains you use

**Note:** This implementation uses **reCAPTCHA v2 (Checkbox)** - "I'm not a robot". Make sure your reCAPTCHA site in Google Console is configured as **reCAPTCHA v2**, not v3. When creating a new site, select "reCAPTCHA v2" → "I'm not a robot" Checkbox.

You can get these keys from [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
