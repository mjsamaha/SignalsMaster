# Git Commit & Push Automation Script

Automated PowerShell script for streamlined git workflow with branch-aware prefixing and production deployment safeguards.

## 🚀 Quick Start

### Using npm Scripts (Recommended)

```bash
# Interactive commit (prompts for message)
npm run commit

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

**Version:** 1.0.0  
**Last Updated:** November 25, 2025  
**Maintained by:** SignalsMaster Team
