# Lingo Connect

A website for students learning the same language to connect and practice together. 

## Deployment 
URL: [https://pj11-language-learner.vercel.app/](https://pj11-language-learner-natalie-fortes-projects.vercel.app?_vercel_share=35X2ayZwlC2iBYuwHVsbvtMFCIj6RG8R)

## Team

| Name          | GitHub ID    |
|---------------|--------------|
| Jovia Low     | mintoku      |
| Julia Lin     | jml557       |
| Annie Yang    | GuaziBai     |
| Natalie Forte | fortenatalie |
| Abhiram Agina | abhirama02   |
| Benny Zhang   | BennyZll     |
| Kun Cheng     | BruceGorman  |
| Ryan Choi     | ryanchoi07   |

## Framework

**Technologies:** React, next.js, Vercel.

**Reason:** We chose React since it allows us to create a modern, component-based UI development. Next.js is        full-stack capatible and most of our teammate are familar with it. By using Vercel, we are able to deploy       instantly and review the features in the URLS in time.

## Setup (from scratch)

**Prerequisites**

- **Node.js**: v20 or newer (LTS recommended)
- **Package manager**: `npm` (comes with Node)
- **Accounts/services**:
  - A **GitHub** account (to host the repo)
  - A **Vercel** account (for deployment)
  - A **Supabase** project (for auth/database)

**1. Clone the repo**

```bash
git clone <your-repo-url>
cd pj11-language-learner/language-learning
```

**2. Configure environment variables**

Inside the `language-learning` directory:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in the Supabase values (e.g. URL, anon key, and any other listed keys) from your Supabase project.

**3. Install dependencies**

```bash
npm install
```

**4. Run the app locally**

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. The app will hot-reload as you edit files.

**5. Run tests (optional)**

```bash
npm test          # unit/integration tests
npm run test:e2e  # Playwright end-to-end tests
```

## Deploying to Vercel

**1. Create a new Vercel project**

- Go to Vercel and create a new project by importing this GitHub repository.
- When prompted for the project root, select the `language-learning` folder (this is where the Next.js app lives).

**2. Set environment variables**

- In the Vercel project settings, add the same variables you set in `.env.local` (Supabase URL, anon key, etc.).

**3. Build & deploy**

- Vercel will auto-detect Next.js and use:
  - **Install command**: `npm install`
  - **Build command**: `npm run build`
  - **Output directory**: `.next`
- Once the first build succeeds, Vercel will give you a production URL.
- Every push to the main branch (or whichever branch you connect) will trigger a new deployment.

## Documentation

- **[Design Document (architecture, modules, design process, UX)](docs/DESIGN.md)** — High-level system architecture, software design, design process (with meeting refs), and user flows.

## Plan

We will build a messaging-based language learning web app where users create profiles (native/target language and interests), find compatible peers, and chat to practice together. Our MVP focuses on profile + matching + messaging, and we’ll add light game-like features to support long-term motivation.

## Audience

Our users will be college students (UCSB) looking to learn languages through chatting with a native speaker who is also a college student (UCSB). This will be the bulk of our userbase, and some secondary roles can be moderators who could delete unruly profiles.
