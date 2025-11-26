# 🚀 Quick Test Commands Reference

## Daily Development Workflow

```powershell
# Start development
ionic serve                     # Dev server

# Before committing
npm run test:unit               # Run unit tests
npm run test:component          # Run component tests
npm run lint                    # Check code quality

# Before pushing (comprehensive)
npm run test:all                # Run complete test suite
# OR for faster iteration
npm run test:no-e2e             # Skip E2E tests
```

## 🧪 Test Commands

| Command | Use Case | Speed |
|---------|----------|-------|
| `npm run test:unit` | Run Jest unit tests | ⚡ Fast |
| `npm run test:component` | Run Jest component tests | ⚡ Fast |
| `npm run test:e2e` | Run Playwright E2E tests | ⚡⚡⚡ Slow |
| `npm run test:all` | Complete test suite | ⚡⚡⚡ Slow |
| `npm run test:no-e2e` | All tests except E2E | ⚡⚡ Medium |
| `npm run test:preview` | Preview test plan | ⚡ Fast |

## 🎭 Playwright E2E Commands

| Command | Use Case | Speed |
|---------|----------|-------|
| `npm run test:e2e` | Run E2E tests (headless) | ⚡⚡⚡ Slow |

For UI mode or headed browser:
```powershell
npx playwright test --ui        # Interactive UI mode
npx playwright test --headed    # Run with visible browser
```

## 🔥 Firebase Emulator Commands

| Command | Use Case |
|---------|----------|
| `firebase emulators:start` | Start emulators manually |
| `ionic serve` | Start dev server (with emulators if configured) |

See `docs/guides/FIREBASE-EMULATOR-GUIDE.md` for complete setup.

## 📦 Build & Deploy Commands

| Command | Use Case |
|---------|----------|
| `npm run build` | Dev build |
| `npm run build:prod` | Production build |
| `npm run deploy:hosting` | Deploy to Firebase |
| `npm run deploy:preview` | Deploy to preview channel |

## 🎯 Quick Checks

### ✅ Pre-Commit Checklist
```powershell
npm run lint && npm run test:unit
```

### ✅ Pre-Push Checklist (Fast)
```powershell
npm run test:no-e2e
```

### ✅ Pre-Push Checklist (Complete)
```powershell
npm run test:all
```

### ✅ Preview Test Plan
```powershell
npm run test:preview
```

## 🐛 Quick Fixes

### Tests failing?
```powershell
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Emulators won't start?
```powershell
# Check ports
netstat -ano | findstr :8080
# Kill if needed, then restart
npm run emulator:start
```

### Build failing?
```powershell
# Clear Angular cache
rm -rf .angular
npm run build
```

## 📊 Coverage Shortcuts

```powershell
# Generate and open coverage
npm run test:coverage
start coverage/app/index.html      # Windows
# or
open coverage/app/index.html       # Mac/Linux
```

## 🎓 Learn More

- See `TESTING.md` for complete testing documentation
- See `../scripts/README.md` for test workflow automation details
- See `../guides/FIREBASE-EMULATOR-GUIDE.md` for emulator setup

---

**Quick Tip:** Use `npm run test:preview` to see what tests will run before executing the full suite!
