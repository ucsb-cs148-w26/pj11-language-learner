# Testing Documentation

## 1. Unit Test Implementation (Previous Lab)

### Testing Library
We implemented unit tests using **Jest + React Testing Library**. This stack was chosen because:
- Jest has built-in support for Next.js through `next/jest`
- React Testing Library encourages testing user-visible behavior rather than implementation details
- Excellent TypeScript support
- Widely adopted in the React ecosystem

### Code Tested
We implemented unit tests for the `MessageBubble` component located at `components/chat/MessageBubble.tsx`.

**Test File**: `components/chat/__tests__/MessageBubble.test.tsx`

**Test Coverage**: 9 test cases covering:
1. Message text rendering
2. Avatar display logic (shown for partner messages, hidden for user's own messages)
3. Time display (conditional rendering)
4. Default avatar fallback when `partnerAvatarUrl` is null
5. CSS styling for user messages (`bg-blue-950`, `text-white`)
6. CSS styling for partner messages (`bg-zinc-100`, `text-zinc-900`)
7. Multiline text handling

**Testing Approach**: Tests use React Testing Library's `render()` function and semantic queries (`getByText`, `getByAltText`, `queryByAltText`) to verify component behavior from a user's perspective.

### Configuration
- Jest configuration: `jest.config.js` (uses Next.js's `next/jest` setup)
- Setup file: `jest.setup.js` (extends Jest with `@testing-library/jest-dom` matchers)
- Test environment: `jest-environment-jsdom` for React component testing

## 2. Unit Test Plans Going Forward

**Decision**: We will take a **selective approach** to unit testing, focusing on critical and reusable components rather than achieving 100% coverage.

**Reasoning**:
1. **Time constraints**: As a small team, comprehensive unit testing for every component would slow down feature development significantly
2. **Component complexity**: We'll prioritize unit tests for:
   - Complex components with significant business logic (e.g., `MessageBubble` with conditional rendering logic)
   - Reusable components used across multiple pages
   - Components with user interactions that need verification (form validation, state management)
3. **Integration tests complement**: Our Playwright E2E tests will catch many issues that unit tests would catch, making exhaustive unit testing less critical
4. **Focus on user value**: We prefer spending time on E2E tests that verify complete user flows, which provide more confidence that features work end-to-end

**Planned additions**:
- Unit tests for form components (profile editing, message composer)
- Unit tests for utility functions and data transformation logic
- Unit tests for complex state management logic

## 3. Component/Integration/End-to-End Test Implementation (This Lab)

### Testing Library
We implemented higher-level testing using **Playwright**. This was chosen because:
- Real browser testing (Chromium, Firefox, WebKit) provides confidence that features work in actual user environments
- Excellent support for testing complete user flows across multiple pages
- Built-in auto-waiting reduces flaky tests
- Can intercept network requests for testing error scenarios
- Supports visual regression testing

### Code Tested
We created E2E test files in the `e2e/` directory:

1. **`e2e/landing.spec.ts`**: Tests landing page functionality and navigation
2. **`e2e/discover.spec.ts`**: Tests discover page, including search functionality and recommended section
3. **`e2e/example-auth.spec.ts`**: Template for authentication flow testing (sign in, redirects)
4. **`e2e/chat-component.spec.ts`**: Examples for testing chat component interactions in a browser environment

**Testing Approach**: Tests use Playwright's page object model and semantic selectors (`getByRole`, `getByText`, `getByLabel`) to interact with the application as a real user would.

### Configuration
- Playwright configuration: `playwright.config.ts`
- Automatically starts Next.js dev server before running tests
- Configured for Chromium, Firefox, and WebKit browsers
- Base URL: `http://localhost:3000`
- HTML reporter enabled for test results

## 4. Higher-Level Testing Plans Going Forward

**Decision**: We will **actively use Playwright for E2E testing** as our primary higher-level testing strategy, focusing on critical user journeys rather than comprehensive page coverage.

**Reasoning**:
1. **User journey focus**: E2E tests verify that complete user flows work correctly, which is more valuable than testing every page in isolation
2. **Catch integration issues**: E2E tests catch issues that unit tests miss (routing, API integration, authentication flows)
3. **Cross-browser confidence**: Testing in multiple browsers ensures our app works for all users
4. **CI/CD integration**: Playwright tests can run in CI/CD pipelines to catch regressions before deployment

**Planned test coverage**:
- **Critical user flows**:
  - User registration and authentication flow
  - Discovering and connecting with language partners
  - Sending and receiving messages in chat
  - Profile creation and editing
- **Error scenarios**:
  - Network failures
  - Authentication errors
  - Invalid form submissions
- **Cross-browser testing**: Run critical flows in Chromium, Firefox, and WebKit

**Not planning**:
- Comprehensive E2E tests for every page (too time-consuming)
- Visual regression testing initially (may add later if needed)
- Playwright Component Testing (we'll continue using Jest + React Testing Library for isolated component tests)

**Maintenance strategy**:
- Keep E2E tests focused on happy paths and critical error cases
- Update tests when user flows change significantly
- Use Playwright's UI mode for debugging failing tests
- Run E2E tests before major releases and in CI/CD
