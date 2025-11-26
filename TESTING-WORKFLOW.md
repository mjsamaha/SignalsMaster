# Testing Workflow Guide

## Overview

The automated test workflow script (`test-before-push.ps1`) runs your test suite sequentially and auto-commits on success. It works just like `git-commit-push.ps1` but for testing.

## How It Works

### The Flow

1. **Branch Validation** - Verifies you're on a valid branch (feat/, fix/, test/, etc.) and blocks master/main
2. **Bootstrap Check** - Auto-detects missing test packages and installs them automatically
3. **Sequential Testing:**
   - ✅ Unit tests (Jest) - Fastest, runs first
   - ✅ Component tests (Testing Library) - Medium speed
   - ✅ E2E tests (Playwright) - Slowest, runs last with auto-server startup
4. **Auto-Server Management** - Starts Ionic dev server for E2E tests, stops it when done
5. **Auto-Commit** - On success, stages all changes and commits with conventional message based on branch prefix
6. **Opens Report** - Displays Playwright HTML report in browser with detailed test results

**Fail-Fast:** If any stage fails, the workflow stops immediately and no commit is made.

## Usage

### Run All Tests

```powershell
# Recommended: Use npm script
npm run test:all

# Or directly
.\scripts\test-before-push.ps1
```

**What happens:**
- Runs unit tests → component tests → E2E tests
- Auto-starts dev server for E2E tests
- On success: commits with message like `feat: your changes`
- Opens Playwright report in browser

### Skip E2E Tests (Faster for Development)

```powershell
# Use this during active development
npm run test:no-e2e

# Or
.\scripts\test-before-push.ps1 -NoE2E
```

**When to use:** Quick validation during development when you don't need full E2E coverage.

### Preview Mode (Dry-Run)

```powershell
# See what would happen without running tests
npm run test:preview

# Or
.\scripts\test-before-push.ps1 -WhatIf
```

**Shows:** Branch validation, test plan, and commit message preview.

### Run Individual Test Types

```powershell
# Just unit tests
npm run test:unit

# Just component tests
npm run test:component

# Just E2E tests (requires server running)
npm run test:e2e
```

## Typical Workflow

### Standard Feature Development

```powershell
# 1. Create feature branch
git checkout -b feat/add-quiz-timer

# 2. Make your changes
# ... edit files ...

# 3. Run tests (validates + auto-commits)
npm run test:all
# ✅ Tests pass → Auto-commits with "feat: add quiz timer"

# 4. Push to remote
git push origin feat/add-quiz-timer
```

### Quick Iteration During Development

```powershell
# Working on UI changes
git checkout -b feat/update-home-layout

# Quick test cycles (skip E2E)
npm run test:no-e2e
# Faster feedback loop

# Final validation before push
npm run test:all
# Full test suite including E2E
```

## Writing Tests

### Do You Need to Write Tests Each Time?

**No!** Here's the approach:

#### ✅ Write Tests When:

**E2E Tests (User Workflows):**
- Adding new pages/routes
- Implementing important user workflows (quiz flow, results, leaderboard)
- Critical UI interactions (button clicks, navigation, form submissions)
- Accessibility features

**Unit Tests (Business Logic):**
- Complex functions (scoring calculations, validations)
- Data transformations (quiz results, leaderboard rankings)
- Service methods with business logic
- Utility functions

#### ⏭️ Skip Tests When:

- Simple styling/layout changes
- Configuration file updates
- Documentation changes
- Small bug fixes covered by existing tests
- Refactoring with no behavior changes

### Current Test Coverage

**Unit Tests (6 total):**
- Demo tests validating Jest infrastructure
- Located in `src/app/demo.test.ts`

**Component Tests (2 total):**
- Demo tests validating Testing Library setup
- Located in `src/app/demo.component.test.tsx`

**E2E Tests (13 total: 9 active, 4 skipped):**
- HomePage navigation and buttons
- Accessibility checks
- Responsive layout validation
- Performance testing
- Located in `src/app/pages/home/home.page.e2e.ts`

## Branch Naming Requirements

The script only runs on properly named branches:

### ✅ Allowed Patterns:

- `feat/` or `feature/` - New features
- `fix/` or `bug/` - Bug fixes
- `test/` - Test-related changes
- `refactor/` - Code refactoring
- `perf/` - Performance improvements
- `docs/` - Documentation
- `style/` - Styling changes
- `chore/` - Maintenance tasks
- `ci/` - CI/CD changes
- `hotfix/` - Urgent fixes
- `exp/` - Experiments

### ❌ Blocked Branches:

- `master` or `main` - Protected branches (script will refuse to run)
- Any non-standard branch name

**Tip:** Add ticket numbers for tracking: `feat/TICKET-123-add-timer`

## Commit Messages

Commits are automatically generated based on your branch prefix:

```
feat/add-quiz-timer     → "feat: add quiz timer"
fix/button-alignment    → "fix: button alignment"
test/e2e-navigation     → "test: e2e navigation"
```

**No AI generation** - Predictable, consistent commit messages based on branch names.

## Bootstrap Mode

### Auto-Installation of Missing Packages

If test infrastructure is missing, the script automatically installs:

- `jest` and related packages
- `@testing-library/angular`
- `@playwright/test`

**No prompts** - Just a warning message, then auto-installs.

**First-time setup:** May take 2-3 minutes to install all packages and Playwright browsers.

## Troubleshooting

### Tests Failing on Clean Branch?

```powershell
# Check if packages are installed
npm list jest @testing-library/angular @playwright/test

# Reinstall if needed
npm install
```

### Server Won't Start for E2E Tests?

```powershell
# Kill any stuck processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Check if port 8100 is available
Get-NetTCPConnection -LocalPort 8100 -ErrorAction SilentlyContinue

# Try running server manually
ionic serve
```

### E2E Tests Timing Out?

The script waits up to 2 minutes for the server to start. If it times out:

1. Check your `environment.ts` file exists in `src/environments/`
2. Verify `ionic` CLI is installed: `npm install -g @ionic/cli`
3. Try starting server manually to see errors: `ionic serve`

### Script Won't Run on My Branch?

```powershell
# Check branch name
git branch --show-current

# Rename if needed
git branch -m feat/your-feature-name
```

## Files Created by This Setup

### Configuration Files:
- `jest.config.js` - Jest test runner configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `setup-jest.ts` - Global test environment setup
- `src/environments/environment.ts` - Development environment config

### Scripts:
- `scripts/test-before-push.ps1` - Main workflow script (667 lines)

### Test Files:
- `src/app/demo.test.ts` - Unit test examples
- `src/app/demo.component.test.tsx` - Component test examples
- `src/app/pages/home/home.page.e2e.ts` - E2E test suite

### Generated Artifacts:
- `playwright-report/` - HTML test reports
- `test-results/` - Playwright test artifacts
- `.last-run.json` - Test run metadata

## Tips & Best Practices

### During Active Development:

1. Use `npm run test:no-e2e` for faster feedback
2. Run `npm run test:all` before final commit
3. Review Playwright report to verify E2E tests passed

### Before Pushing to Remote:

1. Ensure all tests pass: `npm run test:all`
2. Review the auto-generated commit message
3. Push with confidence knowing tests validated everything

### Adding New Tests:

1. **E2E:** Create `*.e2e.ts` files in page directories
2. **Unit:** Create `*.test.ts` files next to your source files
3. **Component:** Create `*.test.tsx` files for component testing
4. Run `npm run test:all` to validate new tests

### Performance:

- **Unit tests:** ~2-3 seconds
- **Component tests:** ~2 seconds
- **E2E tests:** ~30 seconds (including server startup)
- **Total workflow:** ~40-100 seconds

## Integration with Git Workflow

### Works Together With:

This testing script complements your existing `git-commit-push.ps1`:

```powershell
# Option 1: Test + Manual Push
npm run test:all          # Validates and commits
git push origin feat/...  # Manual push

# Option 2: Combined Flow
npm run test:all          # Validates and commits
npm run commit:push       # Uses git-commit-push.ps1 to push
```

### Recommended Flow:

1. `npm run test:all` - Validate and commit
2. Review commit: `git show HEAD`
3. Push when ready: `git push origin <branch>`

## Getting Help

### View Test Output Details:

```powershell
# Open Playwright report manually
npx playwright show-report

# View Jest output with verbose
npm run test:unit -- --verbose

# See all npm test scripts
npm run
```

### Script Options:

```powershell
# Show help
Get-Help .\scripts\test-before-push.ps1 -Full

# Preview without running
.\scripts\test-before-push.ps1 -WhatIf

# Skip E2E tests
.\scripts\test-before-push.ps1 -NoE2E
```

---

**You're all set!** The workflow is validated and ready to use. Happy testing! 🎉
