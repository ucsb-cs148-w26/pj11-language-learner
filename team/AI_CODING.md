# Our AI Coding Experiments

### Natalie Forte
* AI Tool: ChatGPT
* Outcomes Produced: Database schema / SQL for the conversation tables. 
* Reflection: The AI output was correct, although I gave a second prompt to ask for clarification. I gave specific instructions to ask the model to be verbose in its reasoning, to make the code understandable, and the initial prompt was also lengthy to avoid misunderstandings. 

### Julia Lin
* AI Tool: Gemini
* Outcomes Produced: User authentication function for discover route. Debugged retrieval of stale session data in supabase browser client. 
* Reflection: I initially read through and referenced a supabase docs guide to server side rendering setup. This gave me the foundational code, but Gemini helped explain the concept to me and helped me adjust it to our specific project architecture. I was confused about how the page file used “use client” while the route file database session query had to be intercepted by the proxy. Gemini offered some clarity on the issue, resulting in me using a new SSR import for the browser client utility. Gemini gave me the methods for getting server sessions, which I used for the user authentication function. I initially tried to go directly to Gemini for the entire setup and solution, but the answers were just not as structured as the supabase doc and included deprecated methods. 

### Ryan Choi 
* AI Tool: Cursor
* Outcomes Produced: Implemented Discover ranking, exclusions (self + existing chats), pagination (10/page), and fixed a production build/type issue.
* Reflection: Cursor was very useful for speed and debugging, but I still had to manually review all changes, test behavior locally, run npm run build, and verify schema assumptions for correctness and fair use. There were also a few bugs in how the API was queried, as well as Vercel deployment that I had to review and change. Additionally, before prompting code changes I ensured that the sorting algorithm for profiles in the Discover page was one that made logical sense, and I specified the needs before coding.


### Kun Cheng
* AI Tool: ChatGPT
* Outcomes Produced: Database refactor and code refactor
* Reflection: The AI output was eventually correct and useful, but it was not correct on the first pass. The biggest value was speed: it helped me quickly map my old code to the new schema and gave workable Supabase query patterns (embedded selects, aliasing, inner joins, etc.). However, it took multiple prompts to converge—especially around Postgresjoin/filter semantics and RLS behavior. Early versions mistakenly tried to insert into languages from the client, which failed under RLS and was conceptually wrong for my “dropdown-only” requirement. Once I clarified the desired behavior (no inserts, only selecting existing languages + storing language_id), the changes became straightforward.

### Annie Yang
* AI Tool: 
* Outcomes Produced: Built a friends list, clickable names → profile, “Go to chat” button, and placeholder “Remove friend”.
* Reflection: ChatGPT was useful for quickly generating a first draft, but the output wasn’t correct out of the box. The initial UI was very minimal and the formatting was inconsistent with our app, and the navigation paths were wrong. I had to give multiple follow-up prompts to specify the exact formatting expectations and the correct routing behavior for profile/chat navigation, and even then some details still needed manual fixes. To ensure correctness, I ran npm run dev, passed a mock friends list prop, and manually tested click behavior, as well as layout states. I also reviewed TypeScript props/types so the component stays decoupled from backend work. So the AI output was a good starting point, but I still had to manually refine the UI and correct routing to match our project conventions.

### Jovia Low
* AI Tool: Cursor and ChatGPT
* Outcomes Produced: Fixed Supabase connection
* Reflection: We were having issues with Supabase making new accounts in the database. I tried using Cursor to figure out the issue with Supabase, but even after giving it as much information as I could about the context of where we were at with Supabase, its advice didn’t work. I then asked ChatGPT. Chat was not able to figure out the solution immediately either. I had to give it a lot of context, screenshots, and prompts. I did a lot of blind copy-pasting into Supabase’s SQL tool. Eventually (through a lot of debugging with ChatGPT), I found that it was a perms/settings issue with the database where tables needed to be explicitly told they could create new accounts. When I told Cursor, it was able to help solve the issue as well. I learned a lot about how different LLMs have different strengths, and sometimes you can use multiple in tandem to solve a particularly multifaceted issue. I also learned you need to provide a lot of context to AI tools when we’re dealing with multiple platforms/services. So, the AI output was initially incorrect and eventually it gave the right answer after many prompts/context. After figuring out the issue, though, the code Cursor provided to fix and integrate the changes were well written and readable.

### Abhiram Agina
* AI Tool: ChatGPT
* Outcomes Produced: Refactored components/Header.tsx to conditionally render navigation links based on the user’s authentication state so that logged-out users no longer see authenticated-only pages.
* Reflection: The AI output was mostly correct on the first pass for conditional rendering patterns, but I gave multiple follow-up prompts to refine the logic and make sure it aligned with how auth state is handled in our project. Since I do not have Supabase credentials locally, I validated the logic by reviewing render paths rather than testing real session switching. The code was understandable after refinement, and I ensured it followed our project conventions. I did not paste proprietary code into the tool, and I reviewed all output to ensure correctness and fair use.

### Benny Zhang
* AI Tool: ChatGPT
* Outcomes Produced: Header/Navigation bar for users to jump from one page to another
* Reflection: At first, I did not have idea about how to code with the ideal outcome, so I asked ChatGPT to give me a structure of codes and add the navigation bar at the top of our pages. It saved me a lot of time to learn about how to write the frontend code for the navigation bar. However, when I really copy all the original codes that ChatGPT generated, I found that it can not fit in our project perfectly, since there is some error like no defined variables, and the link it generated is random. Therefore, the way to adapt it is to tell ChatGPT what the real lind of the other pages. What’s more, I adapt the code it gives to me and make it looks better in the page, like making header looks better.
