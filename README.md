# fp-and-a-webinar
Working GitHub repository for the FP&A webinar demo apps.

## Repo layout

- `apps/catie-dashboard`: primary Next.js app currently deployed to Vercel
- `Achyuth`: secondary Next.js app/prototype

## Vercel

This repo is a monorepo. For the main deployment, set the Vercel project Root Directory to:

`apps/catie-dashboard`

If the AI routes are enabled, also set:

`OPENAI_API_KEY`
