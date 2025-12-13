# Testing Notes

## Guard Test Files

The guard test files (`*.spec.ts`) are structured for Angular Testing but cannot currently run with Jest due to ESM module compatibility issues with `@angular/core/testing`, `@angular/router`, and related Angular modules.

### Current State

- **Test Files Created**: `auth.guard.spec.ts` with comprehensive test coverage
- **Test Framework**: Tests use manual mocking approach compatible with Jest patterns
- **Issue**: Angular's ESM modules (`@angular/router`, `@angular/core`) cannot be transformed by Jest's current configuration

### Test Coverage Included

The `auth.guard.spec.ts` file includes 23 test cases covering:

1. **authGuard** (5 tests):
   - Allow navigation when auth is initializing
   - Allow navigation when user is authenticated
   - Redirect to registration when not authenticated
   - Preserve returnUrl in query params
   - Log all guard checks

2. **guestGuard** (5 tests):
   - Allow navigation when auth is initializing
   - Allow navigation when user is not authenticated
   - Redirect to home when user is authenticated
   - Log all guard checks
   - Prevent double registration

3. **adminGuard** (9 tests):
   - Redirect to registration when not authenticated
   - Redirect to home when user is not admin
   - Allow navigation when user is admin
   - Handle null getCurrentUser return
   - Handle undefined is_admin field
   - Preserve returnUrl for admin routes
   - Log all guard checks

4. **Integration Tests** (4 tests):
   - Direct guard invocation
   - authGuard and guestGuard opposite behavior (authenticated)
   - authGuard and guestGuard opposite behavior (unauthenticated)
   - Guards respect initialization state

### Solutions

#### Option 1: Karma/Jasmine (Recommended for Angular)
Angular projects traditionally use Karma + Jasmine for testing. These tests would work out of the box with:
```bash
ng test
```

#### Option 2: Jest ESM Support
Update Jest configuration to support ES Modules:
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  // ... other config
};
```

#### Option 3: Manual Validation
Guards can be validated through:
- Integration testing with E2E tests (Playwright)
- Manual testing in browser
- Code review of logic

### Validation Strategy for Batch 5

For now, guards are validated through:
1. ✅ TypeScript compilation (type safety)
2. ✅ Code structure review (follows Angular best practices)
3. ✅ Logic review (correct authentication checks)
4. ⏳ Runtime testing (requires E2E or manual testing)

### Future Work

- Consider setting up Karma/Jasmine for Angular-specific tests
- Or migrate to Jest with `jest-preset-angular` package
- Or rely on E2E tests for guard behavior validation

