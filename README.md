# AVENIDY v3

AVENIDY v3 adds a functional AI-ready workspace architecture.

## Included

- AVENIDY landing page
- `/workspace` Think / Learn / Build interface
- `/login` local account prototype
- Local saved sessions using browser localStorage
- Server-side `/api/chat` route
- Provider-agnostic OpenAI-compatible AI endpoint support
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

Keep API keys only in `.env.local` or your hosting provider's environment variables.
Never place secret API keys inside client-side code.
