# Team 11: Lingo Connect Contributions

"by-person": Summary of each individual's contributions

"by-area": Same contributions, but organized by area (signing-in, chatting, friending, non-code, etc.) rather than person

# By-Person

## Natalie Forte

### Natalie's Code Contributions

* **Chat Page**

  * Created the Chat Page  (message bubbles, message composer, list of recent chats with the most recent text and its time) in [PR #57](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/57).
  * Set up corresponding Chat database tables and connected the database to the UI in [PR #79](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/79).
  * Added an AI Tutor option to messages, to let users get direct feedback on their grammar/spelling in [PR #192](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/192).
  * Built the button UI (but not the functionality) for translate, text-to-speech, and phonetics in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/7aceb8ec101a1eac396aafb316217132ebe4dc58) and [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/6fc67fd72d5a020c87632e316679c4717e8ac708), as well as the hamburger icon to optionally hide them in [PR #192](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164).
  * Fixed text-to-speech, so that it would work in languages other than English in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/ee39c3c4e39b7920065d13cb57580f9c046d669c). 

* **Friends Integration**

  * Wrote the calls to the Friends database in the backend in [PR #130](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/130).
  * Moved old calls out of the frontend and into the backend for security purposes in [PR #164](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164).
  * Added both existing friend components to a new "Friends" page in [PR #164](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164).
  * Added notifications for friend requests to the header and requests component in [PR #192](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164)

* **Misc**

  * Populated "Recent Chats" in the Dashboard in [PR #126](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/126)
  * Added a summary of the website's features to the landing page in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/270cc53344161203adfcadd73cc693c8c955d086) and [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/a0bc3036bcce53484561e77913dd39e216b68fd0).
  * Fixed errors with avatar uploading, including making default avatars consistent across the website and making the header update when an avatar is changed in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/4e161e9d68c7394f7663922b8e70844cf6c48d98).
  * Fixed errors with displaying one target language instead of multiple on several parts of the website in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/3067eda74fe282a82e727e4c63355679369363e1).
  * Restricted profanity in written text on the website in [PR #164](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164).

### Natalie's Non-Code Contributions

* Reviewed [50+ PRs](https://github.com/ucsb-cs148-w26/pj11-language-learner/pulls?q=is%3Apr+reviewed-by%3Afortenatalie), including solving merge conflicts, protecting security practices, ensuring UI consistency, and finding and resolving edge cases.
* Authored [40 issues](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues?q=is%3Aissue%20author%3Afortenatalie) with detailed acceptance criteria.
* Designed [CONTRIBS.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/contributions/CONTRIBS.md), [MANUAL.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/docs/MANUAL.md), [MVP_FOLLOWUP.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/MVP_FOLLOWUP.md), [AGREEMENTS.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/AGREEMENTS.md), [LEADERSHIP.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/LEADERSHIP.md), [LEARNING.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/LEARNING.md), [EVAL_RESPONSE.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/evaluation/EVAL_RESPONSE.md), and [LICENSE.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/LICENSE.md).
* Documented two team meetings: [sec02.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/sec02.md) and [lect09.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect09.md).

---

## Julia Lin

### Julia's Code Contributions

* Set up SSR and proxy in [PR #114](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/114).
* Implemented the Discover frontend and the initial backend iteration for filtering, search, and on-page request making in [PR #58](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/58), [PR #81](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/81), and [PR #132](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/132).
* Implemented onboarding-phase login redirection in [PR #132](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/132).
* Tuned the header appearance, including colors, logo, and profile icon, in [PR #146](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/146).
* Added voice messages in [PR #196](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/196).

### Julia's Non-Code Contributions

* Documented [problem_scenario.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/problem_scenario.md).
* Documented two team meetings: [lect03.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect03.md) and [lect11.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect11.md).
* Led Retro 2 in [RETRO_02.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_02.md).
* Reviewed [8 PRs](https://github.com/ucsb-cs148-w26/pj11-language-learner/pulls?q=is%3Apr+reviewed-by%3Ajml557+)

---

## Jovia Low

### Jovia's Code Contributions

* Created the Dashboard in [PR #62](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/62).
* Created the personal profile page for [Issue #32](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/32).
* Created the profile edit page for [Issue #49](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/49).
* Implemented a public profile page in [PR #111](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/111).
* Added logout and delete-account buttons in [Issue #83](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/83).
* Added the translation feature to chat messages in [PR #187](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/187).
* Created the app logo using Canva for [issue #104](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/104).
* Implemented higher-level testing using Playwright for chat and authentication components, documented in [PR #137](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/137).
* Implemented unit tests for the messages component using Jest, documented in [PR #124](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/124).
* Bugs
  * Adjusted the browser tab title in [PR #129](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/129).
  * Fixed a sign-out in [PR #176](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/176) by adding state tracking so the header reloads correctly and restricted pages are no longer accessible after sign-out.

### Jovia's Non-Code Contributions

* Fixed Supabase access so profiles are created after Google OAuth sign-in by using SQL triggers, RLS, and profile database features.
* Added Google OAuth to the project for sign-in in [Issue #30](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/30).
* Drew the project architecture for the [design document](https://docs.google.com/document/d/18FsU7Cv5MufPqlASusmm09IwLsJYYzbUEppnzWM0o_M/edit?tab=t.0#heading=h.wzadak4hcb9c).
* Wrote the entire [design document](https://docs.google.com/document/d/18FsU7Cv5MufPqlASusmm09IwLsJYYzbUEppnzWM0o_M/edit?tab=t.0#heading=h.wzadak4hcb9c).
* Documented two team meetings: [lect02.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect02.md), and [lect12.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect12.md).
* Added project set-up instructions to [README.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/README.md)

---

## Kun Cheng

### Kun's Code Contributions

* **Backend**

  * Developed the [Profile backend API](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/64), including the database schema for user profiles and backend endpoints for profile management.
  * Refactored API architecture to separate frontend and backend calls for security, applied to [profile](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/154), [dashboard](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/162), and [chats](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/163) in separate PRs.
  * Added support for multiple target languages in [PR #141](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/141).
  * Developed the [phonetic pronunciation feature](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/177), including message ID fetching, language detection, phonetic generation, and a button bubble component.
* **Infrastructure**

  * Developed a script for automatically fetching logs from failed deployments.
  * Implemented a bypass for Vercel preview access using token and version information stored in cookies; preview server: [https://172.236.253.25](https://172.236.253.25).
  * Fixed Row-Level Security policies to resolve Supabase database security vulnerabilities.

### Kun's Non-Code Contributions

* Documented the retrospective in [RETRO_01.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_01.md).
* Authored the [vercel sharing doc](https://docs.google.com/document/d/12bR_fIMT6Sfb8ZqAwHO4UGjKN-k7G67H4C0hedCtdwA/edit?tab=t.0).
* Created the [profile database schema](https://docs.google.com/document/d/1bR3xnFi6NT4vCoEXhvFsMZajdKARRHftYGmF2yp_Gbo/edit?tab=t.0).

---

## Benny (Luandayou) Zhang

### Benny's Code Contributions

* Added a Header component in [PR #60](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/60).
* Implemented client-side avatar upload functionality on the profile edit page and integrated the upload feature with the Supabase storage and database in [PR #109](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/109).

### Benny's Non-Code Contributions

* Documented one team meeting: [lect07.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect07.md)

---

## Ryan Choi

### Ryan's Code Contributions

* Added discover sorting for matches to filter out the current user, prioritize relevant matches, and exclude irrelevant profiles in [PR #121](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/121) and [PR #188](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/188).
* Added a functional profile button whose state changes based on friend request status, showing chat and related actions in [PR #144](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/144)
* Initialized the Supabase repo in [PR #53](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/53).
* Added profile details on the discover page cards for clarity in [PR #189](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/189).

### Ryan's Non-Code Contributions

* Screen-recorded and uploaded the MVP video.

---

## Annie (Shuhan) Yang

### Annie's Code Contributions

* Added initial attempt at Google OAuth login and integrated Google sign-in end to end in [PR #52](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/52).
* Built a homepage for logged-out users in [PR #75](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/75).
* Created the Friends List component and added it to the Dashboard. The component includes clickable profile names, a go-to-chat button, and placeholders for requests and remove. [PR #122](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/122).
* Standardized app-wide theming with consistent color tokens and created a dark mode in [PR #147](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/147).
* Revised the landing page and added a slogan, as well as making the site logo transparent in [PR #178](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/178).

### Annie's Non-Code Contributions

* Updated the [README.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/README.md) with the project plan, including MVP scope and long-term direction.
* Documented one team meeting: [lect04.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect04.md)

---

## Abhiram Agina

### Abhiram's Code Contributions

* Initialized the home page in [PR #50](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/50).
* Added the header sign-in button in [PR #77](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/77).
* Added friends tables to the database in [PR #127](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/127).
* Made the friend requests list component in [PR #133](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/133).
* Added English text-to-speech in [PR #184](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/184).

### Abhiram's Non-Code Contributions

* Created [user_journey.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/user_journey.md).
* Led the third retrospective in [RETRO_03.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_03.md).

# By-Area

## Landing Page

* **Abhiram:** Initialized the home page in [PR #50](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/50).
* **Annie:** Built a logged-out homepage with project name and short product intro in [PR #75](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/75), and later revised the landing page in [PR #178](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/178).
* **Natalie:** Added feature cards to the landing page, summarizing the website's purpose in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/270cc53344161203adfcadd73cc693c8c955d086) and [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/a0bc3036bcce53484561e77913dd39e216b68fd0).

## Sign In / Authentication

* **Annie:** Added first iteration of Google OAuth login and integrated Google sign-in end to end in [PR #52](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/52).
* **Jovia:** Added final iteration of Google OAuth to the project for sign-in in [PR #74](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/74), and fixed Supabase profile creation after sign-in with SQL triggers, RLS, and database features.
* **Julia:** Implemented onboarding-phase login redirection in [PR #132](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/132).
* **Abhiram:** Added the header sign-in button in [PR #77](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/77).

## Header

* **Benny:** Initialized the header in [PR #60](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/60).
* **Julia:** Tuned header appearance, including colors, logo, and profile icon, in [PR #146](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/146).
* **Jovia:** Fixed a sign-out bug in [Issue #175](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/175) so the header reloads correctly after sign-out.
* **Abhiram:** Added the header sign-in button in [PR #77](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/77).

## Dashboard

* **Jovia**: Created the Dashboard page in [PR #62](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/62).
* **Annie:** Integrated the Friends List component with the dashboard in [PR #122](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/122).
* **Natalie:** Integrated the Recent Chats component with the dashboard in [PR #126](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/126).
* **Kun:** Refactored dashboard API architecture for backend separation and security in [PR #162](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/162).

## Profile

* **Jovia:** Created the [profile page](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/32), a [profile edit page](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/49), a [public profile page](https://github.com/orgs/ucsb-cs148-w26/projects/15/views/1?filterQuery=min&pane=issue&itemId=153970256&issue=ucsb-cs148-w26%7Cpj11-language-learner%7C92), and [logout/delete account buttons](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/83).
* **Kun:** Developed the [Profile backend API](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/64), added [multiple target languages](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/141), and refactored profile API architecture for security in [PR #154](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/154).
* **Benny:** Implemented [avatar uploading](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/109).
* **Ryan:** Added a button to public profiles whose state changes based on friend request status in [PR #144](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/144).

## Discover

* **Julia:** Created the Discover page (including filtering people, then connecting with them) and connected it to the backend in [PR #58](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/58), [PR #81](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/81), and [PR #132](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/132).
* **Ryan:** Added discover sorting and relevance improvements in [PR #121](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/121) and [PR #188](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/188), and added native language to discover cards in [PR #189](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/189).

## Friends / Friend Requests

* **Abhiram:** Added friends tables to the database in [PR #127](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/127) and made the friend requests list component in [PR #133](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/133).
* **Natalie:** Wrote Friends backend calls in [PR #130](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/130), moved calls to the backend for security in [PR #164](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164), set up the Friends page with existing components in [PR #164](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164), and added notifications for friend requests to the header and requests component in [PR #192](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164).
* **Annie:** Created the friends list component in [PR #122](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/122).
* **Ryan:** Added button state changes based on friend request status to public profiles in [PR #144](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/144).
* **Julia:** Added button state changes based on friend request status to the discover page in [PR #136](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/136).

## Chats

* **Natalie:** Built the [chat page components](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/57), connected the [database](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/79), restricted [profanity](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164), added an AI Tutor option to messages in [PR #192](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/192), built button UI for translate, text-to-speech, and phonetics in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/7aceb8ec101a1eac396aafb316217132ebe4dc58) and [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/6fc67fd72d5a020c87632e316679c4717e8ac708), as well as the hamburger icon to optionally hide them in [PR #192](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164), and fixed text-to-speech, so that it would work in languages other than English in [commit](https://github.com/ucsb-cs148-w26/pj11-language-learner/commit/ee39c3c4e39b7920065d13cb57580f9c046d669c).
* **Kun:** Refactored chats API architecture for backend separation and security in [PR #163](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/163).
* **Julia:** Added [voice messages](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/196).
* **Jovia:** Added [translation](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/187).
* **Kun:** Added [phonetics](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/177).
* **Abhiram:** Added [English text-to-speech](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/184).

## Testing

* **Jovia:** Implemented higher-level Playwright testing for chat and authentication and Jest unit tests for messages, as well as all accompanying documentation.

## Infrastructure / Backend / Security

* **Julia:** Set up SSR and proxy in [PR #114](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/114).
* **Ryan:** Initialized the Supabase repo in [PR #144](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/144).
* **Kun:** Refactored API architecture for security ([PR #154](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/154), [PR #162](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/162), [PR #163](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/163)), fixed RLS policies, developed deployment-log tooling, and implemented a Vercel preview bypass.
* **Natalie:** Moved friends frontend database calls into the backend [PR #164](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/164).
* **Jovia:** Fixed Supabase profile creation and access control using SQL triggers and RLS.

## Theming / Branding

* **Jovia:** Created the project [logo](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/104).
* **Annie:** Standardized app-wide theming and created dark mode in [PR #147](https://github.com/ucsb-cs148-w26/pj11-language-learner/pull/147). Also made logo version #1 (main logo) transparent.
* **Julia:** Made transparent logos versions #2 and #3 (medium header logo and favicon).

# Team Non-Code Contributions

* **Natalie:** [MANUAL.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/docs/MANUAL.md), [CONTRIBS.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/contributions/CONTRIBS.md), [MVP_FOLLOWUP.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/MVP_FOLLOWUP.md), [AGREEMENTS.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/AGREEMENTS.md), [LEADERSHIP.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/LEADERSHIP.md), [LEARNING.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/LEARNING.md), [EVAL_RESPONSE.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/evaluation/EVAL_RESPONSE.md), [LICENSE.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/LICENSE.md), [sec02.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/sec02.md), [lect09.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect09.md), [50+ PR reviews](https://github.com/ucsb-cs148-w26/pj11-language-learner/pulls?q=is%3Apr+reviewed-by%3Afortenatalie), and [40 authored issues](https://github.com/ucsb-cs148-w26/pj11-language-learner/issues?q=is%3Aissue%20author%3Afortenatalie).
* **Julia:** [problem_scenario.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/problem_scenario.md), [lect03.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect03.md), [lect11.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect11.md), and [RETRO_02.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_02.md).
* **Jovia:** [DESIGN.md](https://docs.google.com/document/d/18FsU7Cv5MufPqlASusmm09IwLsJYYzbUEppnzWM0o_M/edit?tab=t.0#heading=h.wzadak4hcb9c) (including project architecture diagram), [TESTING.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/TESTING.md), project set-up instructions in [README.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/README.md), [lect02.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect02.md), and [lect12.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect12.md).
* **Kun:** [RETRO_01.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_01.md), [vercel sharing doc](https://docs.google.com/document/d/12bR_fIMT6Sfb8ZqAwHO4UGjKN-k7G67H4C0hedCtdwA/edit?tab=t.0), and [profile database schema](https://docs.google.com/document/d/1bR3xnFi6NT4vCoEXhvFsMZajdKARRHftYGmF2yp_Gbo/edit?tab=t.0).
* **Benny:** [lect07.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect07.md).
* **Ryan:** Screen-recorded MVP video and documented project audience.
* **Annie:** Documented project plan and [lect04.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/sprint01/lect04.md).
* **Abhiram:** [user_journey.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/user_journey.md) and [RETRO_03.md](https://github.com/ucsb-cs148-w26/pj11-language-learner/blob/main/team/retrospectives/RETRO_03.md).
