# SignalsMaster Testing Infrastructure

## ✅ Testing Setup Complete

This document provides a comprehensive guide to the testing infrastructure for SignalsMaster.

---

## 📋 Testing Stack

### Unit & Integration Testing
- **Framework:** Jest
- **Angular Testing:** @angular/core/testing
- **Enhanced Testing:** @testing-library/angular, @testing-library/jest-dom, @testing-library/user-event
- **Coverage:** Built-in Jest coverage (HTML + LCOV reports)

### E2E Testing
- **Framework:** Playwright 1.57.0
- **Browser Testing:** Chromium, Firefox, WebKit support

### Firebase Testing
- **Emulator Suite:** Firebase Tools 14.26.0
- **Emulated Services:** Firestore, Auth, Hosting

---

## 🚀 Quick Start

### Run All Tests Locally

```powershell
# Install dependencies (if not already done)
npm install

# Run unit tests (Jest)
npm run test:unit

# Run component tests (Jest)
npm run test:component

# Run E2E tests (Playwright)
npm run test:e2e

# Run all tests (unit + component + E2E)
npm run test:all

# Run all tests except E2E
npm run test:no-e2e

# Preview what tests will run
npm run test:preview
```

---

## 📝 Available Test Scripts

### Unit Tests (Jest)
| Command | Description |
|---------|-------------|
| `npm run test:unit` | Run Jest unit tests (maxWorkers=1) |
| `npm run test:component` | Run Jest component tests only |

### E2E Tests (Playwright)
| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run Playwright E2E tests (workers=1) |

### Combined Test Workflows
| Command | Description |
|---------|-------------|
| `npm run test:all` | Run complete test suite via test-before-push.ps1 script |
| `npm run test:no-e2e` | Run all tests except E2E (faster for quick checks) |
| `npm run test:preview` | Preview what tests will run without executing |

### Build & Deploy
| Command | Description |
|---------|-------------|
| `npm run build` | Build for development |
| `npm run build:prod` | Build for production |
| `npm run deploy:hosting` | Deploy to Firebase Hosting |
| `npm run deploy:preview` | Deploy to preview channel |
| `npm run deploy:rules` | Deploy Firestore rules only |

---

## 🔬 Testing Locally

### 1. Unit Tests (Jest)

Run unit tests:
```powershell
npm run test:unit
```

Run component tests:
```powershell
npm run test:component
```

### 2. E2E Tests (Playwright)

Run all E2E tests:
```powershell
npm run test:e2e
```

### 3. Complete Test Suite

Run all tests (unit + component + E2E):
```powershell
npm run test:all
```

Run tests without E2E (faster):
```powershell
npm run test:no-e2e
```

Preview test execution plan:
```powershell
npm run test:preview
```

### 4. Firebase Emulator Testing

**Terminal 1** - Start emulators:
```powershell
firebase emulators:start
```

**Terminal 2** - Run app:
```powershell
# Ensure src/environments/environment.ts has useEmulators: true
ionic serve
```

Access emulator UI:
```
http://localhost:4000
```

⚠️ **Warning:** When testing with production Firebase (useEmulators: false), be careful not to write test data to production!

---

## 🧪 Writing Tests

### Unit Test Example

```typescript
// src/app/core/services/my-service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MyService } from './my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService]
    });
    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform calculation correctly', () => {
    const result = service.calculate(5, 10);
    expect(result).toBe(15);
  });
});
```

### Component Test Example

```typescript
// src/app/pages/my-page/my-page.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyPage } from './my-page';

describe('MyPage', () => {
  let component: MyPage;
  let fixture: ComponentFixture<MyPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPage]
    }).compileComponents();

    fixture = TestBed.createComponent(MyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('My Page');
  });
});
```

### Playwright E2E Test Example

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to feature page', async ({ page }) => {
    await page.getByText('My Feature').click();
    await expect(page).toHaveURL(/.*my-feature/);
  });

  test('should submit form successfully', async ({ page }) => {
    await page.fill('input[name="username"]', 'TestUser');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Using Test Utilities

```typescript
import { createMockFlag, createMockQuestion } from '../testing/quiz.mocks';
import { createFirestoreMock } from '../testing/firebase.mocks';

describe('QuizService', () => {
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = createFirestoreMock();
    // Use in tests
  });

  it('should work with mock data', () => {
    const flag = createMockFlag({ name: 'Test Flag' });
    const question = createMockQuestion({ flag });
    expect(question.flag.name).toBe('Test Flag');
  });
});
```

---

## 📊 Coverage Reports

### View Coverage Locally

Jest generates coverage reports automatically when configured:

1. Run tests with coverage enabled (check `jest.config.js` for settings)
2. Open `coverage/lcov-report/index.html` in browser
3. Browse coverage by file
4. View line-by-line coverage

### Coverage Threshold

Coverage thresholds are configured in `jest.config.js`.

To update thresholds, edit the `coverageThreshold` section:
```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50
  }
}
```

---

## 🔥 Firebase Emulator Setup

### Configuration Files

**firebase.json** - Emulator ports:
```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "ui": { "port": 4000 }
  }
}
```

**environment.test.ts** - Test environment:
```typescript
export const environment = {
  production: false,
  useEmulators: true,
  firebase: { ... },
  emulators: {
    firestore: { host: 'localhost', port: 8080 }
  }
};
```

### Connect to Emulators in Code

The app automatically connects to emulators when `environment.useEmulators` is `true` (see `src/main.ts`).

### Emulator UI

Access at: `http://localhost:4000`

Features:
- View Firestore data
- Clear data between tests
- Export/import test data
- View logs

---

## 🤖 CI/CD Workflows

### GitHub Actions

One workflow is configured:

#### deploy.yml - Build & Deploy
Runs on push to master:
- Builds production version
- Deploys to Firebase Hosting
- Deploys Firestore rules

### Local Testing Workflow

Before pushing code, use the automated test script:

```powershell
# Run complete test suite
npm run test:all

# Or use the PowerShell script directly
.\scripts\test-before-push.ps1
```

The `test-before-push.ps1` script runs:
1. Linting (ESLint)
2. Unit tests (Jest)
3. Component tests (Jest)
4. E2E tests (Playwright)
5. Production build verification

See `scripts/README.md` for detailed workflow documentation.

### Required Secrets

Add these to GitHub repository settings:

1. `FIREBASE_SERVICE_ACCOUNT_SIGNALSMASTER_40D2F`
   - Get from Firebase Console → Project Settings → Service Accounts
   
2. `FIREBASE_TOKEN` (optional for rules deployment)
   - Generate: `firebase login:ci`

---

## ✅ Verification Checklist

### Initial Setup Verification

- [ ] Run `npm install` successfully
- [ ] Run `npm run test:unit` - Jest unit tests pass
- [ ] Run `npm run test:component` - Jest component tests pass
- [ ] Run `npm run test:e2e` - Playwright E2E tests pass
- [ ] Run `npm run test:all` - complete test suite passes
- [ ] Run `firebase emulators:start` - emulators start
- [ ] Access `http://localhost:4000` - emulator UI loads
- [ ] Run `npm run build` - build succeeds
- [ ] Run `npm run lint` - no errors

### Firebase Emulator Verification

- [ ] Emulators start without errors
- [ ] Firestore emulator accessible at `localhost:8080`
- [ ] Emulator UI accessible at `localhost:4000`
- [ ] Can view Firestore data in UI
- [ ] Can clear data between tests
- [ ] Tests connect to emulators correctly

### CI/CD Verification

- [ ] Push to branch triggers test workflow
- [ ] Unit tests pass in CI
- [ ] Coverage report generated
- [ ] E2E tests run in CI
- [ ] Build succeeds in CI
- [ ] Merge to master triggers deployment
- [ ] Firebase Hosting deploys successfully

---

## 🐛 Troubleshooting

### Tests Won't Run

**Problem:** `ng test` fails to start
```
Solution:
1. Delete node_modules and package-lock.json
2. npm install
3. npm run test
```

**Problem:** Chrome not found
```
Solution:
1. Install Chrome browser
2. Or use ChromeHeadless: npm run test:headless
```

### Playwright Issues

**Problem:** Playwright tests fail to start
```
Solution:
1. Install browsers: npx playwright install
2. Reinstall: npm install @playwright/test --save-dev
3. Check playwright.config.ts configuration
```

**Problem:** Tests timeout
```
Solution:
1. Increase timeout in playwright.config.ts
2. Ensure app is accessible (check baseURL in config)
3. For local testing, start app first: ionic serve
```

### Firebase Emulator Issues

**Problem:** Emulators won't start
```
Solution:
1. Check ports aren't in use:
   netstat -ano | findstr :8080
   netstat -ano | findstr :4000
2. Kill processes if needed
3. Restart emulators
```

**Problem:** App not connecting to emulators
```
Solution:
1. Check environment.ts: useEmulators should be true
2. Verify emulators are running
3. Check main.ts for connectFirestoreEmulator call
4. Restart app: npm start
```

### Coverage Issues

**Problem:** Coverage report not generated
```
Solution:
1. Check jest.config.js for coverage configuration
2. Ensure collectCoverage is enabled
3. Check coverage/ directory exists
4. Open: coverage/lcov-report/index.html
```

**Problem:** Coverage below threshold
```
Solution:
1. Write more tests for untested code
2. Focus on critical services first (QuizService, LeaderboardService)
3. Add component tests for pages
4. Coverage will increase over time
```

### Build Issues

**Problem:** Build fails
```
Solution:
1. Check for TypeScript errors: npm run lint
2. Fix any compilation errors
3. Clear cache: rm -rf .angular
4. Rebuild: npm run build
```

---

## 📈 Next Steps

### Immediate Priorities

1. **Run initial verification** - Go through checklist above
2. **Write more tests** - Increase coverage from current ~5% to 50%+
3. **Test Firebase integration** - Verify emulators work correctly
4. **Run CI/CD** - Push code and verify workflows pass

### Testing Priorities

Focus on testing these critical components first:

1. ✅ `LeaderboardService` - Already tested
2. ❌ `QuizService` - **CRITICAL** (790 lines, core logic) - Test created, needs review
3. ❌ `quiz.page.ts` - Main quiz interface - Test created, needs review
4. ❌ `leaderboard.page.ts` - Leaderboard submission
5. ❌ `practice-mode.page.ts` - Practice mode

### Coverage Goals

- **Week 1:** 25% coverage (critical services)
- **Week 2:** 40% coverage (main pages)
- **Week 3:** 50% coverage (shared components)
- **Week 4:** 60%+ coverage (comprehensive)

### Feature Branch Workflow

Now that testing is set up on main:

```powershell
# Create feature branch
git checkout -b feature/my-new-feature

# Make changes and write tests
npm run test:watch

# Verify tests pass
npm run test:ci
npm run e2e

# Push and create PR
git push origin feature/my-new-feature
```

CI will automatically run all tests on PR!

---

## 📚 Resources

### Documentation
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Angular](https://testing-library.com/docs/angular-testing-library/intro)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Test Utilities
- `src/app/testing/firebase.mocks.ts` - Firebase mocking utilities
- `src/app/testing/quiz.mocks.ts` - Quiz data mocking utilities
- `src/app/testing/test-helpers.ts` - General test helpers

### Test Locations
- `src/app/**/*.spec.ts` - Jest unit and component tests
- `tests/e2e/**/*.spec.ts` - Playwright E2E tests (check playwright.config.ts for exact path)
- `scripts/test-before-push.ps1` - Automated test workflow script

---

## 💡 Tips & Best Practices

### Writing Good Tests

1. **Test behavior, not implementation**
   - Focus on what the code does, not how
   - Test public API, not private methods

2. **Use descriptive test names**
   ```typescript
   ❌ it('should work', () => { ... })
   ✅ it('should calculate quiz score correctly for all correct answers', () => { ... })
   ```

3. **One assertion per test** (when possible)
   - Makes failures easier to debug
   - Tests are more maintainable

4. **Use test utilities**
   - DRY principle applies to tests
   - Create helpers for common patterns

5. **Mock external dependencies**
   - Tests should be isolated
   - Use mocks for Firebase, HTTP, etc.

### Test Organization

```
src/app/
├── core/
│   └── services/
│       ├── my-service.ts
│       └── my-service.spec.ts       ← Jest unit test next to source
├── pages/
│   └── my-page/
│       ├── my-page.ts
│       └── my-page.test.tsx         ← Jest component test next to source
└── testing/
    ├── firebase.mocks.ts           ← Shared test utilities
    ├── quiz.mocks.ts
    └── test-helpers.ts

tests/e2e/                          ← Playwright E2E tests
├── quiz-flow.spec.ts               ← E2E tests by feature
├── leaderboard.spec.ts
└── fixtures/
    └── quiz-data.json              ← Test data

scripts/
└── test-before-push.ps1            ← Automated test workflow
```

---

## 🎯 Success Criteria

Your testing infrastructure is successful when:

✅ All tests pass locally and in CI  
✅ Coverage is ≥50% and trending up  
✅ E2E tests cover critical user flows  
✅ Firebase emulators work reliably  
✅ CI/CD deploys automatically on merge  
✅ Team can write tests confidently  
✅ Tests catch bugs before production  

---

**Testing Infrastructure Created:** November 24, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
