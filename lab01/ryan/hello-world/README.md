This is a website satisfying the Hello World portion of lab01 for CMPSC148.

Live production deployment: https://hello-world-beryl-theta-65.vercel.app

## Deployment Instructions

### Prerequisites

Before deploying this application, ensure the following software is installed on your machine:

- Node.js (v18 or later)
  Check installation:
    node -v
  Download from: https://nodejs.org/

- npm (comes bundled with Node.js)
  Check installation:
    npm -v

- Git
  Check installation:
    git --version
  Download from: https://git-scm.com/

- Vercel CLI
  Install globally using npm:
    npm install -g vercel


Running the App Locally

1. Clone the repository:
    git clone <REPOSITORY_URL>
    cd <PROJECT_DIRECTORY>

2. Install dependencies:
    npm install

3. Start the development server:
    npm run dev

4. Open the application in your browser:
    http://localhost:3000


Deploying the App to Vercel (from Localhost)

1. Log in to Vercel:
    vercel login

2. Deploy the application:
    vercel

   - Accept the default project settings when prompted
   - A public deployment URL will be generated after the build completes

3. (Optional) Deploy explicitly to production:
    vercel --prod

Notes for Deployment Reviewers

- This project uses Next.js with Tailwind CSS
- No additional configuration is required beyond the steps above
- Default Next.js build settings are used
- The application is deployed using the Vercel CLI
- A public Vercel URL is provided after deployment

