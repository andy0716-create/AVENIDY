# AVENIDY

AVENIDY is a focused AI workspace with three distinct collaboration modes:
Think, Learn, and Build.

## Included

- AVENIDY landing page
- `/workspace` Think / Learn / Build interface with mode-aware prompts
- `/login` local account prototype
- Local saved sessions using browser localStorage
- Server-side `/api/chat` route with input limits, timeouts, and safe provider errors
- Provider-agnostic OpenAI-compatible AI endpoint support
- Traditional Chinese responses by default
- Responsive design
- Hidden ANDY easter egg in A-VE-N-I-D-Y

## Run

```bash
npm install
npm run dev
```

Open:

- Home: http://localhost:3000
- Login: http://localhost:3000/login
- Workspace: http://localhost:3000/workspace

## Connect a real AI model

Copy `.env.example` to `.env.local` and provide values for:

```env
AI_API_KEY=...
AI_BASE_URL=...
AI_MODEL=...
```

The server route expects an OpenAI-compatible `POST /chat/completions` API.

For Vercel, add the same variables in **Project Settings → Environment
Variables**, then redeploy the project. Keep API keys only in `.env.local` or
your hosting provider's server-side environment variables. Never place secret
API keys in client-side code, browser storage, or chat messages.

If the variables are absent or invalid, the API returns a structured setup
error and the workspace shows safe setup guidance without exposing provider
responses or secret values.
