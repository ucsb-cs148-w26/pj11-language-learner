# Response

We are eager to learn from our teammates, and we have added all of their suggestions to our Kanban board to be resolved! Two are already complete, two more are currently in PRs, and the rest we aim to complete by our code freeze.

# Action

## General Decisions

Messaging ease: Someone suggested that "shift+enter" should make a newline, and that "shift" should send. Between this suggestion and writing this response, we have already implemented this recommmendation. We could also add overlay keyboards for different languages.

Matching reason: It's not totally clear if the matching recommends by target or native language, and language levels are vague. Our action will be to add native language (in addition to target language) to the discover screen. We should also hide irrelevant matches, and consider adding availability / learning preferences / reading,writing,speaking strengths, and multiple fluent languages. 

Logo: We don't have a logo yet in our browser tab (its still the next-js favicon), so we will fix this in a new PR. However, our feedback also mentions that our name is not very unique. 

## Additional Decisions

Reviewing Form Section 2: Based on our feedback, we will add language grammar suggestions. Time permitting, we will also add "typing" and "read/delivered" indicators.

Reviewing Form Section 3: 
- In the current state of the product at the time of the review, the profile picture upload was not working. We are already in action to fix this. 
- Also, we will make our landing page more robust, to clarify the purpose of the app.
- Initially auto-fill the profile with first name / last name from people's Google accounts. 
- Add a notification badge (like a red circle with a number on it) on the friends tab and requests component when there are incoming requests. 

Reviewing Form Section 4: No action needed.

Reviewing Form Section 5: The team found that we have security issues in our app. We have swiftly resolved this.