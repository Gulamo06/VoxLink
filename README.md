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
