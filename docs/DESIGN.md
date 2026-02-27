# Language Learner — Design Document

**Design Document Coordinator:** Julia Lin (see [team/LEADERSHIP.md](../team/LEADERSHIP.md)).

This file is the **canonical design document** for the project, version-controlled in GitHub. The team may also maintain a copy in another format (e.g. Google Doc) for easier collaboration; if so, add the link below.

- **Living document (optional):** *[Add link here if the team maintains a Google Doc or other shared copy, e.g. for in-meeting edits.]*

---

## 1. Opening / Overview

### 1.1 Purpose and scope

**Language Learner** is a messaging-based language learning web app. Users create profiles (native language, target language(s), and interests), find compatible peers, and chat to practice together. The MVP focuses on **profile**, **matching/discovery**, and **messaging**; future work may add light game-like features for long-term motivation.

**Primary audience:** College students (e.g. UCSB) learning a language by chatting with peers who are native speakers of their target language.

### 1.2 High-level system architecture

The system is a **three-tier web application**: browser client, Next.js application (hosted on Vercel), and Supabase (auth, database, realtime). The diagram below shows the main components and data flow.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                     │
│  (React UI, client state, Supabase JS client with anon key + JWT)        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              NEXT.JS APPLICATION (Vercel)                                 │
│  • App Router: /, /dashboard, /profile, /discover, /chats, /requests…    │
│  • Server Components & API Routes (/api/friends/action, /api/discover)   │
│  • Middleware: session refresh (lib/proxy.ts)                            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   SUPABASE      │     │   SUPABASE       │     │   SUPABASE REALTIME      │
│   AUTH          │     │   POSTGRES       │     │   (WebSockets)           │
│   (OAuth,       │     │   • profiles     │     │   • messages channel     │
│    session/JWT) │     │   • languages   │     │   • presence (optional)  │
└─────────────────┘     │   • friends,    │     └─────────────────────────┘
                        │     friend_     │
                        │     requests   │
                        │   • conversa-  │
                        │     tions,     │
                        │     messages   │
                        │   RLS on all   │
                        └────────────────┘
```

**Explanations of the parts**

- **User browser:** The front end is a Next.js React app. It uses the Supabase **browser client** (`createBrowserClient` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Authenticated requests include the user’s JWT. The client talks to Supabase for auth, CRUD, and realtime subscriptions (e.g. chat messages). Some flows also call Next.js API routes (e.g. discover, friend actions).

- **Next.js on Vercel:** The app is deployed on Vercel. It serves pages (landing, sign-in, dashboard, profile, discover, chats, friend requests), server-renders where useful, and exposes API routes that use the **server** Supabase client (session from cookies). Middleware refreshes the Supabase session so protected routes see an up-to-date user.

- **Supabase Auth:** Handles identity (e.g. Google OAuth). The app does not store passwords; it relies on Supabase session and JWT. After sign-in, the JWT is sent with every Supabase request and is used by Row Level Security (RLS).

- **Supabase Postgres:** Stores all application data: users’ profiles, languages, friend relationships, friend requests, conversations, and messages. **Row Level Security (RLS)** is enabled on tables so that each request only returns or modifies rows allowed for `auth.uid()` (and any other policy conditions). The front end can “reach” the database with the anon key, but RLS and auth together prevent unauthorized access.

- **Supabase Realtime:** Used for live chat: the client subscribes to a channel for a conversation and receives new messages without polling. This keeps the architecture simple while still providing a responsive chat experience.

---

## 2. More detailed software architecture

### 2.1 Main modules

| Layer / directory   | Role |
|---------------------|------|
| **`app/`**          | Next.js App Router: routes, pages, and API handlers. Key areas: `app/page.tsx` (landing), `app/auth/` (sign-in, callback), `app/dashboard/`, `app/profile/` (view/edit, `[userId]`), `app/discover/`, `app/chats/`, `app/requests/`. API routes under `app/api/` (e.g. `friends/action`, `discover`) use the server Supabase client and cookies. |
| **`components/`**   | Reusable UI: e.g. `Header`, chat (`MessageBubble`, etc.), friends (e.g. requests UI). Components typically use the browser Supabase client or receive data from pages. |
| **`lib/`**          | Core infra: `supabaseClient.ts` (browser client), `supabaseServer.ts` (server client from cookies), `proxy.ts` (middleware for session refresh), `chatRoutes.ts` (routing helpers). |
| **`utils/`**       | Domain logic and types: `utils/friends/` (`friendService.ts`, types) for friend requests and friend list operations; `utils/chat/` (`chatService.ts`, types) for conversations and messages. Both rely on a Supabase client (browser or server) passed in by the caller. |
| **Supabase (external)** | Auth, Postgres (with RLS), and Realtime. Schema and RLS are defined in SQL (e.g. `supabase_friends.sql`, `supabase_fix_trigger.sql`) and applied in the Supabase project. |

### 2.2 Data and security

- **Auth:** Supabase Auth issues JWTs. The browser client sends the JWT on each request; the server client gets the session from cookies (set/refreshed by middleware).
- **RLS:** Tables (e.g. `profiles`, `friend_requests`, `friends`, `conversation_participants`, `messages`) have RLS policies that restrict select/insert/update/delete by `auth.uid()` (and relationship rules, e.g. only participants can read a conversation). The anon key does not bypass RLS.
- **Sensitive keys:** Only the **anon** key is used in the front end. The **service role** key (if used) is server-only and never exposed to the browser.

### 2.3 Key flows

- **Profile and discovery:** Pages load profile and discovery data via the browser Supabase client (and optionally `/api/discover`). RLS ensures users only see allowed profiles and matches.
- **Friends:** Friend requests and friend list are implemented in `friendService`; policies in `supabase_friends.sql` enforce that only the requester can send/cancel, only the recipient can accept/deny, and each user only sees their own requests and friend list.
- **Chat:** Conversations and messages are created/read via `chatService` and Supabase; realtime subscription in the chats UI updates the message list as new messages arrive.

---

## 3. Design process documentation

This section summarizes important **team decisions** and points to **meetings and artifacts** logged in the GitHub repo.

### 3.1 Process and traceability (Retro 1 — 01/23/26)

- **Decision:** All code changes must be tracked end-to-end on GitHub: create/claim an Issue before coding; when opening a PR, link the issue (e.g. `#issue-id`), add labels, and include a short “How to review” section; keep the board updated (To Do → In Progress → In Review → Done).
- **Reference:** [team/retrospectives/RETRO_01.md](../team/retrospectives/RETRO_01.md) — action items and traceability goal (100% PRs linked to issues).

### 3.2 Sprint scope and auth (Sprint meeting — 01/16/26)

- **Decision:** First sprint focused on “See Homepage” and “Make a New Account,” with acceptance criteria: users can open the app and log in with a UCSB account (OAuth).
- **Reference:** [team/sprint01/sec02.md](../team/sprint01/sec02.md) — sprint meeting (Natalie Forte led).

### 3.3 Profile and backend (Scrum — 01/26/26)

- **Decision:** Profile tables were designed and owned by one developer; backend of profile features and database tables for chat were scoped for follow-up work. Google OAuth and navigation were completed in the same period.
- **Reference:** [team/sprint01/lect06.md](../team/sprint01/lect06.md) — Kun Cheng “Designed profile tables”; Natalie “figuring out and finalizing database tables for chat pages.”

### 3.4 Testing strategy

- **Decision (unit):** Selective unit testing (Jest + React Testing Library) — focus on critical and reusable components (e.g. `MessageBubble`), not 100% coverage.
- **Decision (E2E):** Use Playwright as the primary higher-level testing strategy, focusing on critical user journeys (auth, profile, discover, chat).
- **Reference:** [team/TESTING.md](../team/TESTING.md).

### 3.5 Design document and UX (Scrum — 02/23/26)

- **Decision:** Design document and user flow were explicitly assigned as upcoming work (design document/user flow; friend task and design document).
- **Reference:** [team/sprint01/lect12.md](../team/sprint01/lect12.md) — Jovia Low, Abhiram Agina.

### 3.6 Meeting and role log

A full log of who led which meeting (stand-ups, sprint, retros) is kept in [team/LEADERSHIP.md](../team/LEADERSHIP.md). Design Document Coordinator is Julia Lin.

---

## 4. User interface and user experience (UX)

### 4.1 High-level user / task flow

A typical flow is:

1. **Landing** (`/`) — User sees the app and can choose to sign in (or is redirected if already signed in).
2. **Sign-in** (`/auth/signin`) — User signs in with Google (OAuth). Supabase Auth and callback create or load the user and ensure a profile exists (`/auth/callback`).
3. **Dashboard** (`/dashboard`) — Authenticated user sees an overview: their profile summary, conversations, and friends. Entry point to profile, discover, and chats.
4. **Profile** (`/profile`, `/profile/edit`, `/profile/[userId]`) — User views/edits their own profile (native language, target language(s), interests, etc.) or views another user’s profile. From another user’s profile they can send a friend request or start a conversation.
5. **Discover** (`/discover`) — User sees recommended peers (e.g. by language match). They can send friend requests or start conversations from here.
6. **Friend requests** (`/requests`) — User sees incoming (and optionally outgoing) friend requests and can accept or deny.
7. **Chats** (`/chats`, conversation view) — User sees their conversations, opens one, and sends/receives messages. Realtime updates keep the message list in sync.

This flow supports the MVP goals: **profile → matching/discovery → messaging**, with friends as a way to manage who you can easily chat with.

### 4.2 UX considerations

- **Auth:** Low friction via Google OAuth; first-time users get a profile created (or prompted) after callback so they can complete onboarding.
- **Navigation:** Persistent header/nav (e.g. dashboard, profile, discover, chats, requests) so core tasks are one click away.
- **Discover:** Recommendations and filters (e.g. by target/native language) help users find compatible partners quickly.
- **Chat:** Realtime delivery and clear distinction between “me” and “partner” (e.g. in `MessageBubble`) support a natural conversation experience.
- **Consistency:** Team has worked on unified colors and UI (e.g. lect12) and on branding (logo, product name) with plans to gather user feedback (see [team/evaluation/USER_FEEDBACK_NEEDS.md](../team/evaluation/USER_FEEDBACK_NEEDS.md)).

---

*This design document lives in the repo at `docs/DESIGN.md`. Update it as the architecture and process evolve, and link a Google Doc (or other living copy) at the top if the team maintains one.*
