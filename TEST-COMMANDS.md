# 🚀 Quick Test Commands Reference

## Daily Development Workflow

```powershell
# Start development with tests
npm run test:watch              # Terminal 1: Watch mode tests
npm start                       # Terminal 2: Dev server

# Before committing
npm run test:ci                 # Run all unit tests
npm run lint                    # Check code quality
npm run e2e                     # Run E2E tests (optional)

# Check coverage
npm run test:coverage
# Open: coverage/app/index.html
```

## 🧪 Test Commands

| Command | Use Case | Speed |
|---------|----------|-------|
| `npm test` | Default test run | ⚡ Fast |
| `npm run test:watch` | Development/TDD | ⚡ Fast |
| `npm run test:ci` | Before commit/PR | ⚡⚡ Medium |
| `npm run test:coverage` | Check coverage | ⚡⚡ Medium |
| `npm run test:headless` | Headless testing | ⚡⚡ Medium |
| `npm run test:debug` | Debug failing tests | 🐌 Interactive |

## 🎭 Cypress Commands

| Command | Use Case | Speed |
|---------|----------|-------|
| `npm run e2e:open` | Interactive testing | 🐌 Interactive |
| `npm run e2e` | Full E2E suite | ⚡⚡⚡ Slow |
| `npm run e2e:headed` | Watch E2E run | ⚡⚡⚡ Slow |

## 🔥 Firebase Emulator Commands

| Command | Use Case |
|---------|----------|
| `npm run emulator:start` | Start emulators for manual testing |
| `npm run emulator:test` | Run tests with emulators |
| `npm run emulator:e2e` | Run E2E with emulators |

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
npm run lint && npm run test:ci
```

### ✅ Pre-Push Checklist
```powershell
npm run lint && npm run test:ci && npm run build
```

### ✅ Full Test Suite
```powershell
npm run test:all
```

### ✅ With Emulators
```powershell
npm run test:all:emulators
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

See `TESTING.md` for complete documentation.

---

**Quick Tip:** Use `npm run test:watch` during development for instant feedback!
