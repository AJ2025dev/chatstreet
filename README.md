# ChatStreet

ChatStreet is a contextual conversational advertising unit for publisher pages. It includes:

- a public product demonstration;
- an embeddable conversational widget;
- publisher, GAM and iframe delivery tags;
- a campaign configuration Studio;
- OpenAI Responses API integration; and
- event, lead and analytics endpoints prepared for persistent storage.

## Vercel deployment

Deploy this repository as a Next.js project. Configure these server-side environment variables in Vercel:

- `OPENAI_API_KEY` — required for live model responses;
- `OPENAI_MODEL` — optional, defaults to `gpt-5.6-terra`.

Never expose `OPENAI_API_KEY` as a `NEXT_PUBLIC_` variable.

The recovered application retains its original Cloudflare D1 adapter. Without that binding, public pages and live chat work, campaign reads fall back to the included demonstration campaign, and database writes remain unavailable until the persistence adapter is migrated to Supabase or another Vercel-compatible database.

## Local development

```bash
npm install
npm run dev
```

The production gate is:

```bash
npm run build
```
