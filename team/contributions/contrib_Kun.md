## Code Contributions

### Backend

* **Developed the [Profile backend API](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/64)**
  - Designed the **database schema for user profiles**
  - Implemented backend endpoints for profile management

* **Refactored API architecture to separate frontend and backend calls**
  - Addressed security concerns caused by direct frontend access
  - Applied the refactor to:
    - [profile](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/154)
    - [dashboard](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/162)
    - [chats](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/163)

* **Added support for [multiple target languages](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/141)**
  - Refactored backend code to enable multilingual functionality
  - Updated language handling logic across relevant endpoints

* **Led development of the [phonetic pronunciation feature](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/177)**
  - Fetches message IDs
  - Detects message language automatically
  - Generates phonetic pronunciation
  - Added a **button bubble component next to message bubbles** to trigger pronunciation

### Infrastructure

* **Developed a script for automatically fetching logs from failed deployments**
  - Simplifies debugging of CI/CD failures
  - Enables faster investigation of deployment issues

* **Implemented a bypass for Vercel preview access**
  - Allowed team members to view preview pages despite free-plan restrictions
  - Authentication handled through **token and version information stored in cookies**
  - Preview server: https://172.236.253.25

* **Fixed Row-Level Security (RLS) policies**
  - Resolved database security vulnerabilities
  - Ensured proper access control for Supabase tables

## Non-Code Contributions

* **Documented retrospective**
  - [RETRO_01.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_01.md)

* **Authored project documentation**
  - [Project doc](https://docs.google.com/document/d/12bR_fIMT6Sfb8ZqAwHO4UGjKN-k7G67H4C0hedCtdwA/edit?tab=t.0)

* **Created design documentation**
  - [Design doc](https://docs.google.com/document/d/1bR3xnFi6NT4vCoEXhvFsMZajdKARRHftYGmF2yp_Gbo/edit?tab=t.0)

* **Active participation in team discussions**
  - Contributed regularly to project coordination and technical discussions