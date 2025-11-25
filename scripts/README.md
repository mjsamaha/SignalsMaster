# Git Commit & Push Automation Script

Automated PowerShell script for streamlined git workflow with branch-aware prefixing and production deployment safeguards.

## 🚀 Quick Start

### Using npm Scripts (Recommended)

```bash
# Interactive commit (prompts for message)
npm run commit

# then do:
git push origin BRANCHNAME


# Commit and push in one command
npm run commit:push

# Preview what would happen (dry-run)
npm run commit:preview
```

### Direct PowerShell Execution

```powershell
# Interactive mode
.\scripts\git-commit-push.ps1

# With parameters
.\scripts\git-commit-push.ps1 -Message "Add new feature" -Push

# Preview mode
.\scripts\git-commit-push.ps1 -WhatIf

# With description
.\scripts\git-commit-push.ps1 -Message "Fix bug" -Description "Resolved issue with login validation" -Push
```

## 📋 Features

### ✅ Auto-Staging
- Automatically stages all files with `git add -A`
- No need to manually stage changes

### 🏷️ Branch-Aware Auto-Prefixing
Automatically prefixes commit messages based on branch naming conventions:

| Branch Pattern | Auto-Prefix | Example |
|---------------|-------------|---------|
| `feat/*` | `feat: ` | `feat/user-auth` → `feat: Add login` |
| `feature/*` | `feat: ` | `feature/new-ui` → `feat: New UI` |
| `hotfix/*` | `hotfix: ` | `hotfix/critical-bug` → `hotfix: Fix crash` |
| `bug/*` | `fix: ` | `bug/login-error` → `fix: Login validation` |
| `fix/*` | `fix: ` | `fix/styling` → `fix: Button alignment` |
| `refactor/*` | `refactor: ` | `refactor/api` → `refactor: API calls` |
| `perf/*` | `perf: ` | `perf/query` → `perf: Database query` |
| `docs/*` | `docs: ` | `docs/readme` → `docs: Update README` |
| `ci/*` | `ci: ` | `ci/pipeline` → `ci: Update workflow` |
| `exp/*` | `chore: ` | `exp/test-feature` → `chore: Test new lib` |
| `test/*` | `test: ` | `test/unit` → `test: Add unit tests` |
| `style/*` | `style: ` | `style/formatting` → `style: Format code` |
| `chore/*` | `chore: ` | `chore/deps` → `chore: Update deps` |

**Note:** If your commit message already has a conventional commit prefix, auto-prefixing is skipped.

### ⚠️ Production Safeguards
When working on `master` or `main` branches:
- **Pre-commit warning** with confirmation prompt
- **Pre-push warning** with deployment notice
- Reminder that push triggers Firebase production deployment via GitHub Actions

### 🔒 Security Integration
- Respects existing Husky pre-commit hooks
- Runs Gitleaks security scans automatically
- Blocks commits with detected secrets
- Provides clear error messages if hooks fail
- Optional `-Force` flag to bypass (NOT RECOMMENDED)

### 👁️ Dry-Run Preview (`-WhatIf`)
Preview what will happen before execution:
- Current branch and detected branch type
- Files to be staged
- Final commit message (with auto-prefix applied)
- Actions that will be executed
- Production deployment warnings (if applicable)

## 📖 Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `-Message` | String | Commit message (prompts if not provided) |
| `-Description` | String | Optional extended commit description |
| `-Push` | Switch | Automatically push to remote after commit |
| `-Force` | Switch | Bypass git hooks (⚠️ NOT RECOMMENDED) |
| `-WhatIf` | Switch | Preview mode - no actions executed |
| `-NoBranchCheck` | Switch | Skip master/main protection warnings |

## 💡 Usage Examples

### Example 1: Interactive Commit
```powershell
.\scripts\git-commit-push.ps1
```
- Prompts for commit message
- Auto-prefixes based on branch
- Commits locally (no push)

### Example 2: Quick Commit & Push
```powershell
.\scripts\git-commit-push.ps1 -Message "Update documentation" -Push
```
- Commits with message
- Pushes to current branch immediately

### Example 3: Feature Branch with Auto-Prefix
```powershell
# On branch: feat/new-login-ui
.\scripts\git-commit-push.ps1 -Message "Add login form validation"
# Result: "feat: Add login form validation"
```

### Example 4: Preview Before Commit
```powershell
.\scripts\git-commit-push.ps1 -Message "Update config" -WhatIf
```
- Shows what would happen
- No actual git commands executed
- Perfect for testing

### Example 5: Detailed Commit with Description
```powershell
.\scripts\git-commit-push.ps1 `
  -Message "Refactor authentication service" `
  -Description "Improved error handling and added retry logic for API calls" `
  -Push
```

### Example 6: Using npm Scripts
```bash
# Interactive commit
npm run commit

# Commit and push
npm run commit:push

# Preview
npm run commit:preview
```

## 🛡️ Security Notes

### Husky Hooks Integration
The script works **with** your existing Husky security hooks:

**Pre-Commit Hook (`pre-commit`):**
- Runs Gitleaks on staged files
- Blocks environment files
- Detects Firebase API keys, GitHub tokens, AWS keys
- Scans for private keys and generic secret patterns

**Pre-Push Hook (`pre-push`):**
- Runs comprehensive Gitleaks scan on all tracked files
- Final security gate before code reaches remote

### Bypassing Security (NOT RECOMMENDED)
```powershell
# Only use if you're absolutely sure
.\scripts\git-commit-push.ps1 -Message "Emergency fix" -Force
```
⚠️ **Warning:** This bypasses Gitleaks and other security checks. Use only in extreme circumstances.

## 🚀 Production Deployment

When pushing to `master` or `main`:

1. **Pre-commit confirmation** - Warns about production branch
2. **Commit executed** - Husky hooks run security scans
3. **Pre-push confirmation** - Warns about deployment trigger
4. **Push to remote** - Pre-push hook runs comprehensive scan
5. **GitHub Actions triggered** - Automatic deployment workflow starts:
   - Security scanning (Gitleaks, TruffleHog)
   - Production build (`npm run build:prod`)
   - Firebase Hosting deployment

Monitor deployments: [GitHub Actions](https://github.com/mjsamaha/SignalsMaster/actions)

## 🔧 Troubleshooting

### "Commit failed! Pre-commit hooks detected issues"
- Gitleaks found potential secrets in your staged files
- Review the hook output for details
- Remove secrets before committing
- Never use `-Force` to bypass security checks for commits with secrets

### "Push failed! Pre-push hooks detected issues"
- Gitleaks found secrets in tracked files
- Check the comprehensive scan output
- Remove secrets and commit the fix

### "No changes detected"
- Working directory is clean
- Script will prompt if you want to continue
- Use `git status` to verify

### Script Doesn't Auto-Prefix
- Verify your branch name matches a pattern (e.g., `feat/`, `fix/`)
- Branch detection is case-sensitive
- Check if message already has a conventional commit prefix

## 📚 Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Husky Git Hooks](https://typicode.github.io/husky/)
- Project documentation: `AGENTS.md`, `SETUP-COMPLETE.md`

## 🤝 Contributing

When contributing to this script:
1. Test thoroughly on feature branches first
2. Use `-WhatIf` to preview changes
3. Document new features in this README
4. Follow PowerShell best practices
5. Maintain backward compatibility

---

# Test Automation Workflow Script

Automated PowerShell script for local testing workflow with branch validation, multi-stage test execution, and auto-commit on success.

## 🧪 Quick Start

### Using npm Scripts (Recommended)

```bash
# Run all tests (unit + component + E2E)
npm run test:all

# Run only unit tests
npm run test:unit

# Run only component tests
npm run test:component

# Run only E2E tests
npm run test:e2e

# Skip E2E tests (faster)
npm run test:no-e2e

# Preview test plan without execution
npm run test:preview
```

### Direct PowerShell Execution

```powershell
# Run all tests and commit on success
.\scripts\test-before-push.ps1

# Skip E2E tests
.\scripts\test-before-push.ps1 -NoE2E

# Preview mode
.\scripts\test-before-push.ps1 -WhatIf

# Custom commit message
.\scripts\test-before-push.ps1 -Message "Add comprehensive tests"
```

## 📋 Features

### ✅ Branch Validation (Hard Block)
- **Refuses to run on `master`/`main`** (no override possible)
- **Validates branch naming convention** (feat/, fix/, test/, etc.)
- Exits immediately with helpful error messages if validation fails

### 🔧 Bootstrap Mode (Auto-Install Dependencies)
Automatically detects and installs missing test infrastructure:
- **Jest** (`jest`, `@types/jest`, `ts-jest`, `jest-environment-jsdom`)
- **Testing Library** (`@testing-library/angular`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- **Playwright** (`@playwright/test` + browser installation)

No prompts - just auto-installs with a notice. Use `-NoBootstrap` to disable.

### 🎯 Sequential Test Execution (Fail-Fast)
Tests run in order from fastest to slowest:

1. **Jest Unit Tests** - Service layer, pure logic
2. **Testing Library Component Tests** - Component rendering, interactions
3. **Playwright E2E Tests** - Full user flows (optional with `-NoE2E`)

**Sequential Execution Benefits:**
- Reduced resource usage (no parallel test overload)
- Fail-fast at first error (saves time)
- Forces `maxWorkers: 1` for stability

### 🏷️ Auto-Commit with Conventional Commits
On success:
- Stages all changes (`git add -A`)
- Commits with conventional commit message
- Auto-prefixes based on branch (e.g., `test(alpha-2411-008): tests passing`)
- **Stops without pushing** (manual push control)

### 👁️ Preview Mode (`-WhatIf`)
- Shows branch validation status
- Displays test execution plan
- Previews commit message without running tests

## 📖 Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `-NoE2E` | Switch | Skip Playwright E2E tests (faster iteration) |
| `-NoBootstrap` | Switch | Skip automatic dependency installation |
| `-Message` | String | Custom commit message (default: "tests passing") |
| `-WhatIf` | Switch | Preview mode - no execution |

## 🚫 Branch Validation Rules

### **Hard Block: Master/Main**
```
❌ Cannot run on master/main
✅ Must checkout feature branch first
```

### **Required Branch Patterns:**

| Pattern | Prefix | Example |
|---------|--------|---------|
| `feat/*` | `feat` | `feat/add-tests` |
| `feature/*` | `feat` | `feature/new-feature` |
| `fix/*` | `fix` | `fix/bug-123` |
| `bug/*` | `fix` | `bug/login-error` |
| `test/*` | `test` | `test/add-e2e` |
| `refactor/*` | `refactor` | `refactor/services` |
| `perf/*` | `perf` | `perf/optimize` |
| `docs/*` | `docs` | `docs/readme` |
| `style/*` | `style` | `style/formatting` |
| `chore/*` | `chore` | `chore/deps` |
| `ci/*` | `ci` | `ci/pipeline` |
| `hotfix/*` | `hotfix` | `hotfix/critical` |
| `exp/*` | `chore` | `exp/experiment` |

**Invalid branch names are rejected immediately.**

## 💡 Usage Examples

### Example 1: Full Test Suite
```powershell
.\scripts\test-before-push.ps1
```
- Validates branch
- Checks test infrastructure
- Runs Jest → Testing Library → Playwright
- Commits on success

### Example 2: Quick Test Without E2E
```powershell
.\scripts\test-before-push.ps1 -NoE2E
```
- Skips Playwright (saves ~1-2 minutes)
- Perfect for rapid iteration

### Example 3: First-Time Setup
```powershell
.\scripts\test-before-push.ps1
```
- Detects missing packages
- Auto-installs Jest, Testing Library, Playwright
- Installs Playwright browsers
- Runs tests

### Example 4: Preview Test Plan
```powershell
.\scripts\test-before-push.ps1 -WhatIf
```
- Shows branch info
- Displays test stages
- Previews commit message
- No actual execution

### Example 5: Custom Commit Message
```powershell
.\scripts\test-before-push.ps1 -Message "Add FlagService tests"
```
- Runs tests
- Commits with: `test(ticket): Add FlagService tests`
- Auto-prefixed based on branch

## 🔄 Workflow Integration

### Complete Feature Development Flow

```bash
# 1. Create feature branch
git checkout -b feat/add-tests

# 2. Make changes and add tests
# ... code, code, code ...

# 3. Run tests and commit
npm run test:all
# ✅ All tests pass → Auto-commits

# 4. Push to remote
git push origin feat/add-tests

# 5. Open pull request on GitHub
```

### Integration with Existing Scripts

```bash
# Testing workflow (this script)
npm run test:all              # Run tests + commit

# Git workflow (git-commit-push.ps1)
npm run commit                # Commit without testing
npm run commit:push           # Commit + push without testing

# Combined workflow
npm run test:all              # Tests + commit
git push origin BRANCH        # Manual push
```

**Key Difference:**
- `test-before-push.ps1` → Tests first, then commits
- `git-commit-push.ps1` → Commits directly without tests

## 🧪 Test Infrastructure

### Test Files Created
This script works with these example tests:

**Unit Tests (Jest):**
- `src/app/core/services/platform.service.test.ts`
- `src/app/core/services/flag.service.test.ts`

**Component Tests (Testing Library):**
- `src/app/shared/components/timer/timer.component.test.tsx`
- `src/app/pages/home/home.page.test.tsx`

**E2E Tests (Playwright):**
- `src/app/pages/home/home.page.e2e.ts`

### Configuration Files
- `jest.config.js` - Jest with `maxWorkers: 1`
- `setup-jest.ts` - Testing Library matchers
- `playwright.config.ts` - Playwright with `workers: 1`

### Running Individual Test Types

```bash
# Just unit tests
npm run test:unit

# Just component tests
npm run test:component

# Just E2E tests
npm run test:e2e
```

## 🛡️ Security & Hooks

### No Conflicts with Existing Hooks
- Tests run **before** commit
- Husky hooks run **after** commit (pre-push)
- Security scans still execute normally
- No `-Force` bypass needed

### Workflow Order
1. `test-before-push.ps1` runs tests
2. Script stages and commits
3. Husky `pre-commit` hook runs (Gitleaks)
4. Commit succeeds
5. Manual `git push` triggers `pre-push` hook

## 🔧 Troubleshooting

### "Tests cannot run on master/main"
✅ **Solution:** Checkout a feature branch
```bash
git checkout -b test/your-feature
```

### "Invalid branch naming convention"
✅ **Solution:** Use valid branch prefix
```bash
git checkout -b feat/your-feature
```

### "Missing test infrastructure"
✅ **Solution:** Let bootstrap mode auto-install
```bash
.\scripts\test-before-push.ps1
# Auto-installs missing packages
```

Or install manually:
```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom
npm install --save-dev @testing-library/angular @testing-library/jest-dom
npm install --save-dev @playwright/test
npx playwright install
```

### "Unit tests failed"
- Script stops immediately (fail-fast)
- Fix tests before proceeding
- Component and E2E tests won't run until unit tests pass

### "E2E tests taking too long"
✅ **Solution:** Skip E2E during development
```bash
npm run test:no-e2e
```

### "Playwright browsers not installed"
✅ **Solution:**
```bash
npx playwright install
```

## 📊 Performance

Typical execution times (sequential):
- **Unit Tests:** ~10-30 seconds
- **Component Tests:** ~15-45 seconds
- **E2E Tests:** ~30-90 seconds
- **Total (with E2E):** ~1-3 minutes
- **Total (no E2E):** ~25-75 seconds

## 🎯 Best Practices

### When to Use This Script
✅ Before pushing feature branches
✅ Before opening pull requests
✅ After completing a coding session
✅ When adding new tests

### When to Skip E2E (`-NoE2E`)
✅ Rapid iteration on unit tests
✅ Service-only changes
✅ Documentation updates
✅ Style/formatting changes

### When to Use Preview (`-WhatIf`)
✅ Learning the script
✅ Verifying branch validation
✅ Checking commit message format
✅ Understanding test flow

## 📚 Related Documentation

- **Testing Guide:** `TESTING.md`
- **Test Commands:** `TEST-COMMANDS.md`
- **Git Workflow:** This README (git-commit-push.ps1 section above)
- **Setup Guide:** `SETUP-COMPLETE.md`

---

**Version:** 1.0.0  
**Last Updated:** November 25, 2025  
**Maintained by:** SignalsMaster Team
