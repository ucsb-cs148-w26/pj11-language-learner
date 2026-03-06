## Code Contributions
- Made a Logo
    - Used Canva to create, design, and edit logo with a little UCSB flair (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/104)
- Higher level testing (https://github.com/orgs/ucsb-cs148-w26/projects/15/views/1?filterQuery=min&pane=issue&itemId=158580629&issue=ucsb-cs148-w26%7Cpj11-language-learner%7C135)
   - Implemented higher level testing framework for lab 6
   - Used Playwright to test chat and authentication components
   - Documented process and results for lab
- Unit tests (https://github.com/orgs/ucsb-cs148-w26/projects/15/views/1?filterQuery=min&pane=issue&itemId=157044316&issue=ucsb-cs148-w26%7Cpj11-language-learner%7C123)
    - Used Jest to implement and perform unit tests for messages component
    - Documented process and results for lab
- Fixed browser bug (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/128)
    - Noticed tab title perpetually stating the page was on the homepage when it wasn't
    - Fixed the tab title
- Public profile implementation (https://github.com/orgs/ucsb-cs148-w26/projects/15/views/1?filterQuery=min&pane=issue&itemId=153970256&issue=ucsb-cs148-w26%7Cpj11-language-learner%7C92)
    - Implemented a publicly acessible profile page with profile picture, name, bio, language, level, etc for people to view
- Logout/delete account buttons (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/83)
    - Added sign-out and delete buttons to profile
- Profile edit page (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/49)
    - Created a page for users to edit their own profile
- Profile page (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/32)
    - Created general profile page for users (working version, early in project) 
- Fixed sign out bug (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/175)
    - After signing out, header did not properly reload and the user was still able to attempt to access restricted pages. 
    - I added state tracking to ensure that the header would display the correct access for the current state
- (In progress) adding translation to chat
    - Currently attempting to use API to add feature that allows translation in DMs


## Non-Code Contributions
- Fixed Supabase access (profiles would not be created after user signs in with Google oAuth). Used SQL to implement triggers, RLS, and profile database features.
- Added Google oAuth to project for sign in (https://github.com/ucsb-cs148-w26/pj11-language-learner/issues/30)
- Drew project architecture for design document (https://docs.google.com/document/d/18FsU7Cv5MufPqlASusmm09IwLsJYYzbUEppnzWM0o_M/edit?tab=t.0#heading=h.wzadak4hcb9c)
- Wrote entire design document (https://docs.google.com/document/d/18FsU7Cv5MufPqlASusmm09IwLsJYYzbUEppnzWM0o_M/edit?tab=t.0#heading=h.wzadak4hcb9c)
- Documented two team meetings