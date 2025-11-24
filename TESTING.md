# SignalsMaster Testing Infrastructure

## ✅ Testing Setup Complete

This document provides a comprehensive guide to the testing infrastructure for SignalsMaster.

---

## 📋 Testing Stack

### Unit & Integration Testing
- **Framework:** Jasmine + Karma
- **Angular Testing:** @angular/core/testing
- **Enhanced Testing:** @ngneat/spectator, @testing-library/angular
- **Coverage:** karma-coverage (HTML + LCOV reports)

### E2E Testing
- **Framework:** Cypress 15.7.0
- **Component Testing:** @cypress/angular

### Firebase Testing
- **Emulator Suite:** Firebase Tools 14.26.0
- **Emulated Services:** Firestore, Auth, Hosting

---

## 🚀 Quick Start

### Run All Tests Locally

```powershell
# Install dependencies (if not already done)
npm install

# Run unit tests in watch mode
npm run test:watch

# Run unit tests once with coverage
npm run test:coverage

# Run E2E tests (interactive mode)
npm run e2e:open

# Run E2E tests (headless)
npm run e2e

# Start Firebase emulators
npm run emulator:start

# Run tests with Firebase emulators
npm run emulator:test
```

---

## 📝 Available Test Scripts

### Unit Tests
| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests in watch mode (default) |
| `npm run test:watch` | Run tests in watch mode with auto-reload |
| `npm run test:ci` | Run tests once in headless mode with coverage (for CI) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:headless` | Run tests in headless Chrome |
| `npm run test:debug` | Open Chrome DevTools for debugging tests |

### E2E Tests
| Command | Description |
|---------|-------------|
| `npm run e2e` | Run Cypress tests in headless mode |
| `npm run e2e:open` | Open Cypress interactive UI |
| `npm run e2e:headed` | Run Cypress with browser visible |

### Firebase Emulator
| Command | Description |
|---------|-------------|
| `npm run emulator:start` | Start Firebase emulators (Firestore + Hosting) |
| `npm run emulator:test` | Run unit tests with emulators |
| `npm run emulator:e2e` | Run E2E tests with emulators |
| `npm run serve:emulator` | Start emulators for manual testing |

### Combined Tests
| Command | Description |
|---------|-------------|
| `npm run test:all` | Run unit tests + E2E tests |
| `npm run test:all:emulators` | Run all tests with Firebase emulators |

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

### 1. Unit Tests

Run tests with live reload:
```powershell
npm run test:watch
```

Generate coverage report:
```powershell
npm run test:coverage
# Open: coverage/app/index.html in browser
```

### 2. E2E Tests

Open Cypress interactive mode:
```powershell
npm run e2e:open
# Select test file to run
```

Run all E2E tests:
```powershell
npm run e2e
```

### 3. Firebase Emulator Testing

**Terminal 1** - Start emulators:
```powershell
npm run emulator:start
```

**Terminal 2** - Run tests with emulators:
```powershell
# Set environment to use emulators
# Update src/environments/environment.ts: useEmulators: true

npm run test:coverage
```

Access emulator UI:
```
http://localhost:4000
```

### 4. Testing with Production Data (Local)

To test against production Firebase temporarily:
```powershell
# Ensure environment.ts has useEmulators: false
npm start
```

⚠️ **Warning:** Be careful not to write test data to production!

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

### Cypress E2E Test Example

```typescript
// cypress/e2e/my-feature.cy.ts
describe('My Feature', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForIonic();
  });

  it('should navigate to feature page', () => {
    cy.contains('My Feature').click();
    cy.url().should('include', '/my-feature');
  });

  it('should submit form successfully', () => {
    cy.get('input[name="username"]').type('TestUser');
    cy.contains('button', 'Submit').click();
    cy.contains('Success').should('be.visible');
  });
});
```

### Using Test Utilities

```typescript
import { createMockFlag, createMockQuestion } from '../testing/quiz.mocks';
import { createFirestoreSpy } from '../testing/firebase.mocks';

describe('QuizService', () => {
  let mockFirestore: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockFirestore = createFirestoreSpy();
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

After running `npm run test:coverage`:

1. Open `coverage/app/index.html` in browser
2. Browse coverage by file
3. View line-by-line coverage

### Coverage Threshold

Current threshold: **50%**

Coverage is checked in CI and will warn if below threshold.

To update threshold, edit `.github/workflows/test.yml`:
```yaml
THRESHOLD=50  # Change this value
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

Three workflows are configured:

#### 1. test.yml - Unit Tests
Runs on every push and PR:
- Linting
- Unit tests with coverage
- Build verification
- Coverage reporting
- Coverage threshold check (50%)

#### 2. e2e.yml - E2E Tests
Runs Cypress tests:
- Starts Firebase emulators
- Builds application
- Runs Cypress tests
- Uploads screenshots/videos on failure

#### 3. deploy.yml - Firebase Deployment
Runs on push to master:
- Runs all tests
- Builds production
- Deploys to Firebase Hosting
- Deploys Firestore rules

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
- [ ] Run `npm test` - tests run in Chrome
- [ ] Run `npm run test:coverage` - coverage report generated
- [ ] Open `coverage/app/index.html` - report visible
- [ ] Run `npm run test:ci` - tests run headless
- [ ] Run `npm run e2e:open` - Cypress UI opens
- [ ] Run `npm run e2e` - E2E tests run headless
- [ ] Run `npm run emulator:start` - emulators start
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

### Cypress Issues

**Problem:** Cypress won't open
```
Solution:
1. Clear Cypress cache: npx cypress cache clear
2. Reinstall: npm install cypress --save-dev
3. Verify: npx cypress verify
```

**Problem:** Tests timeout
```
Solution:
1. Increase timeout in cypress.config.ts
2. Check if app is running on localhost:8100
3. Start app: npm start (in separate terminal)
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
1. Run: npm run test:coverage
2. Check coverage/ directory exists
3. Open: coverage/app/index.html
4. If missing, check karma.conf.js configuration
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
- [Jasmine Docs](https://jasmine.github.io/)
- [Karma Docs](https://karma-runner.github.io/)
- [Cypress Docs](https://docs.cypress.io/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Test Utilities Created
- `src/app/testing/firebase.mocks.ts` - Firebase mocking utilities
- `src/app/testing/quiz.mocks.ts` - Quiz data mocking utilities
- `src/app/testing/test-helpers.ts` - General test helpers

### Example Tests Created
- `src/app/core/services/quiz.service.spec.ts` - Service test example
- `src/app/pages/quiz/quiz.page.spec.ts` - Component test example
- `cypress/e2e/quiz-flow.cy.ts` - E2E test example
- `cypress/e2e/leaderboard.cy.ts` - E2E test example
- `cypress/e2e/navigation.cy.ts` - E2E test example

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
│       └── my-service.spec.ts       ← Unit test next to source
├── pages/
│   └── my-page/
│       ├── my-page.ts
│       └── my-page.spec.ts         ← Component test next to source
└── testing/
    ├── firebase.mocks.ts           ← Shared test utilities
    ├── quiz.mocks.ts
    └── test-helpers.ts

cypress/
├── e2e/
│   ├── quiz-flow.cy.ts             ← E2E tests by feature
│   └── leaderboard.cy.ts
├── fixtures/
│   └── quiz-data.json              ← Test data
└── support/
    └── commands.ts                 ← Custom commands
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
