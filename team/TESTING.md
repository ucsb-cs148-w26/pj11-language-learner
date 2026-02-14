# Testing Documentation

## Testing Libraries and Approach

### Chosen Stack: Jest + React Testing Library

We chose Jest + the React Testing Library as our testing framework for the following reasons:

1. Jest has built-in support for Next.js through `next/jest`
2. Jest is the most widely used testing framework in the React ecosystem
3. Good TypeScript support with `@types/jest`
4. Includes test runner, assertion library, mocking capabilities, and code coverage

### Libraries Installed

- jest
- jest-environment-jsdom
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- @types/jest

## Configuration

### Jest Configuration (`jest.config.js`)

Our Jest configuration uses Next.js's built-in Jest setup:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

Key features:
- Uses `next/jest` for automatic Next.js configuration
- Configures `jsdom` environment for React component testing
- Maps `@/` path alias to `<rootDir>/` for consistent imports
- Matches test files in `__tests__` directories or files ending in `.test` or `.spec`

### Setup File (`jest.setup.js`)

```javascript
import '@testing-library/jest-dom'
```

This setup file extends Jest with additional DOM matchers from `@testing-library/jest-dom`, providing matchers like `toBeInTheDocument()`, `toHaveClass()`, etc.

### NPM Scripts

Added to `package.json`:
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode (re-runs on file changes)

## Unit Tests Implemented

### MessageBubble Component Test

**Location**: `components/chat/__tests__/MessageBubble.test.tsx`

**Component Under Test**: `components/chat/MessageBubble.tsx`

**Test Coverage**: 9 test cases covering:

1. **Rendering**: Verifies that message text is rendered correctly
2. **Avatar Display Logic**: Tests that partner avatar is shown for partner messages but not for user's own messages
3. **Time Display**: Ensures time is displayed when provided, and not displayed when omitted
4. **Default Avatar Fallback**: Verifies that default avatar (`/default-avatar.jpg`) is used when `partnerAvatarUrl` is null
5. **Styling for User Messages**: Confirms correct CSS classes (`bg-blue-950`, `text-white`) are applied for messages sent by the user
6. **Styling for Partner Messages**: Confirms correct CSS classes (`bg-zinc-100`, `text-zinc-900`) are applied for partner messages
7. **Multiline Text Handling**: Tests that multiline text (with `\n` characters) is properly rendered

**Testing Approach**:
- Uses React Testing Library's `render()` function to mount components
- Uses `screen` queries (`getByText`, `getByAltText`, `queryByAltText`) to find elements
- Uses `container.querySelector()` for CSS class verification
- Follows React Testing Library best practices by testing user-visible behavior rather than implementation details

**Example Test Case**:
```typescript
it('displays partner avatar when message is not from me', () => {
  render(<MessageBubble {...defaultProps} />)
  const avatar = screen.getByAltText('John Doe avatar')
  expect(avatar).toBeInTheDocument()
  expect(avatar).toHaveAttribute('src', '/test-avatar.jpg')
})
```

## Running Tests

### Run all tests:
```bash
npm test
```


### Current Test Status
All 9 tests passing in `MessageBubble.test.tsx`
