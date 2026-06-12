# Contributing to NeuralBrief

Thank you for taking the time to contribute. This document explains how to set up your environment,
how we structure branches and commits, and what reviewers look for in a pull request.

---

## Development Environment Setup

### 1. Fork and clone

```bash
git clone https://github.com/your-org/neuralbrief.git
cd neuralbrief
```

### 2. Install dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in every required value. Refer to the comments in `.env.example` for where to
obtain each credential. You will need a Firebase project, a Gemini API key, and Gmail OAuth2
credentials to run the full stack locally.

### 4. Start the development servers

```bash
# Start frontend (Vite) + backend (Express) concurrently
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3001`.

### 5. Verify the setup

- Open `http://localhost:5173` and sign in with Google.
- Open `http://localhost:3001/health` — you should receive `{ "ok": true }`.

---

## Branch Naming Convention

All branches should follow this format: `<type>/<short-description>`.

Use hyphens to separate words in the description. Keep descriptions concise (2–4 words).

| Type | When to use | Example |
|---|---|---|
| `feature/` | New functionality | `feature/bookmark-sync` |
| `fix/` | Bug fix | `fix/auth-popup-blocked` |
| `docs/` | Documentation changes only | `docs/update-env-example` |
| `refactor/` | Code restructuring with no behavior change | `refactor/filter-agent-types` |
| `test/` | Adding or updating tests | `test/summary-agent-unit` |
| `chore/` | Tooling, deps, config — no production code | `chore/bump-firebase-sdk` |

---

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<optional scope>): <short summary in imperative mood>

[optional body — wrap at 72 characters]

[optional footer — e.g. Closes #42]
```

### Types

| Type | Description |
|---|---|
| `feat` | A new feature visible to users or developers |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `chore` | Build process, dependency updates, tooling |
| `perf` | A code change that improves performance |

### Examples

```bash
# Good
feat(filter-agent): add semantic deduplication using embedding similarity
fix(auth): handle popup-blocked error on Safari mobile
docs(readme): add cloud run deployment steps
refactor(email-agent): extract template rendering into separate service
test(scraper-agent): add unit tests for RSS parsing edge cases
chore: upgrade @google/genai to 2.4.0

# Bad — too vague
fix: bug fix
update stuff
WIP
```

### Rules

- Use the **imperative mood** in the summary: "add feature" not "added feature" or "adds feature".
- Do not capitalize the first letter of the summary.
- Do not end the summary with a period.
- Keep the summary line under **72 characters**.
- Reference issues in the footer: `Closes #42` or `Refs #17`.

---

## Pull Request Checklist

Before opening a PR, confirm that every item below is true. Reviewers will check these.

### Code quality

- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` (or `tsc --noEmit`) passes with zero errors
- [ ] `npm test` passes with no failing tests
- [ ] Zero `console.log` calls in any non-test file (use the `logger` utility instead)
- [ ] Zero `// TODO`, `// FIXME`, or `// IMPLEMENT THIS` comments
- [ ] Zero empty `catch` blocks — every `catch` handles or logs the error explicitly

### TypeScript compliance

- [ ] No use of `any` — use `unknown` with a type guard if the shape is uncertain
- [ ] All exported functions have explicit return types
- [ ] All new interfaces follow `PascalCase` naming

### React & styling

- [ ] Only functional components with hooks — no class components
- [ ] Tailwind CSS v4 utility classes used for all styling
- [ ] No arbitrary Tailwind values like `[#ff0000]` or `[500px]`
- [ ] Inline styles only for values that are genuinely runtime-computed
- [ ] All animations use Framer Motion (`motion/react`) — no CSS transitions for UI interactions

### Files & imports

- [ ] Every new file is complete and production-ready — no placeholder code
- [ ] Path aliases used consistently: `@/components`, `@/contexts`, `@/lib`
- [ ] Firebase is only accessed through `src/lib/firebase.ts` exports
- [ ] Imports are grouped and ordered: external → internal → types

### Documentation

- [ ] Every exported function and component has a JSDoc comment block
- [ ] If a new environment variable was added, `.env.example` has been updated with a comment

---

## Code Review Guidelines

Reviewers check for the following beyond the automated checklist:

**Correctness** — Does the code do what the PR description says? Are edge cases handled (empty arrays,
null values, network timeouts, Firestore permission errors)?

**TypeScript strictness** — Is the TypeScript idiomatic and strict? Reviewers will reject `any` types
and missing return type annotations on exported functions.

**Error handling** — Every `async` function must have a `try/catch`. Errors must be logged via the
`logger` utility with sufficient context to diagnose the problem in production.

**Component boundaries** — One component per file. Components should not import Firebase directly.
Business logic belongs in services, not in React components.

**Performance** — Are expensive computations memoized with `useMemo` or `useCallback` where
appropriate? Are Firestore listeners properly unsubscribed in cleanup functions?

**Security** — Server-side secrets (`GEMINI_API_KEY`, `GMAIL_*`, `FIREBASE_PRIVATE_KEY`) must never
appear in frontend code or be prefixed with `VITE_`.

---

## Running Tests Locally

```bash
# Run all tests (frontend + backend)
npm test

# Run only frontend tests
npm run test:frontend

# Run only backend tests
npm run test:server

# Run tests in watch mode during development
npm run test:watch

# Generate a coverage report
npm run test:coverage
```

Test files live next to the code they test using the `.test.ts` / `.test.tsx` suffix convention.
Integration tests that require Firebase emulators live in `server/src/__tests__/integration/`.

To run integration tests, start the Firebase emulators first:

```bash
npx firebase emulators:start --only firestore,auth
npm run test:integration
```

---

## Questions?

Open a [GitHub Discussion](https://github.com/your-org/neuralbrief/discussions) for questions about
architecture or approach. Use [GitHub Issues](https://github.com/your-org/neuralbrief/issues) for
bug reports and feature requests.
