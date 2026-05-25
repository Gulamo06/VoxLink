# VoxLink

A mobile-first voice communication frontend built with React 18, Vite, TypeScript, Tailwind CSS, Socket.io, Agora RTC, Zustand, React Router, React Hook Form, Zod, QR code scanning, React Query, and Vite PWA.

## Project structure

- `src/main.tsx` — Vite app entry
- `src/App.tsx` — router + auth gating
- `src/pages/` — `Home`, `Login`, `Profile`
- `src/components/` — UI controls, chat, QR, call screen
- `src/hooks/` — socket, voice call, recorder, QR scanner
- `src/services/` — Axios API client, auth/contact/message/group/Agora flows
- `src/store/` — Zustand auth, contacts, chat, call stores
- `src/types/` — shared data models
- `src/utils/` — formatting helpers and deep-link generation

## Setup

1. Open the folder:
   ```bash
   cd c:\Users\gchih\OneDrive\Desktop\WEBSITES44\VoxLink
   code .
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example` and add your values.
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Deploying to Vercel

1. Create a Vercel project from this repository.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add these environment variables in Vercel settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (if you deploy a backend or use a remote API)
   - `VITE_SOCKET_URL` (if using a remote socket server)
   - `VITE_AGORA_APP_ID`
4. Deploy and verify the site at the generated Vercel URL.

## Cloud data storage

This app is already wired to Supabase for profile/auth persistence via `src/lib/supabase.ts` and `src/services/authService.ts`.

To save more application data in the cloud, use a Supabase project and create the `profiles` table with columns such as:
- `id` (primary key)
- `username`
- `status`
- `avatar_url`
- `created_at`

If you want chat history, contacts, or groups to persist beyond a single server session, you should replace the current in-memory backend store in `server/src/store/index.ts` with a real database backend (Supabase, PostgreSQL, etc.).

## Backend contract

The app is wired for a Node/Express backend with endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /contacts`
- `POST /contacts/add`
- `DELETE /contacts/:id`
- `GET /messages/:chatId`
- `POST /messages/send`
- `POST /messages/voice`
- `GET /groups`
- `POST /groups/create`
- `POST /groups/join`
- `GET /agora/token?channel=xxx&uid=xxx`

Socket events supported:
- `user:online`
- `user:offline`
- `message:new`
- `contact:add`

## Notes

- Auth tokens are stored in memory, not in local storage.
- The PWA is configured via `vite.config.ts` and `public/manifest.webmanifest`.
- The QR scanner uses `html5-qrcode` and the QR generator uses `qrcode.react`.
