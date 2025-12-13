/**
 * Unit tests for authentication guards.
 * Tests route protection, redirects, and initialization handling.
 *
 * Note: These tests use manual mocking instead of Angular TestBed
 * to avoid ESM module compatibility issues with Jest.
 */

import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// Mock the dependencies before importing the guards
const mockAuthService = {
  isInitialized: jest.fn(),
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
};

const mockRouter = {
  navigate: jest.fn(),
};

// Mock Angular's inject function
jest.mock('@angular/core', () => ({
  inject: jest.fn((token: any) => {
    if (token.name === 'AuthService' || token === 'AuthService') {
      return mockAuthService;
    }
    if (token.name === 'Router' || token === 'Router') {
      return mockRouter;
    }
    return null;
  }),
}));

// Now import the guards after mocks are set up
import { authGuard, guestGuard, adminGuard } from './auth.guard';

describe('Auth Guards', () => {
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // Create mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {
      url: '/test-route'
    } as RouterStateSnapshot;

    // Reset all mocks
    jest.clearAllMocks();

    // Clear console.log spy
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authGuard', () => {
    it('should allow navigation when auth is still initializing', () => {
      mockAuthService.isInitialized.mockReturnValue(false);

      const result = authGuard(mockRoute, mockState);

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[AuthGuard] Auth still initializing, allowing navigation (APP_INITIALIZER will handle)'
      );
    });

    it('should allow navigation when user is authenticated', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = authGuard(mockRoute, mockState);

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[AuthGuard] User authenticated, allowing navigation'
      );
    });

    it('should redirect to registration when user is not authenticated', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = authGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration'], {
        queryParams: { returnUrl: '/test-route' }
      });
      expect(console.log).toHaveBeenCalledWith(
        '[AuthGuard] User not authenticated, redirecting to registration'
      );
    });

    it('should preserve returnUrl in query params', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockState.url = '/profile/settings';

      const result = authGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration'], {
        queryParams: { returnUrl: '/profile/settings' }
      });
    });

    it('should log all guard checks', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      authGuard(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith(
        '[AuthGuard] Checking authentication for:', '/test-route'
      );
    });
  });

  describe('guestGuard', () => {
    it('should allow navigation when auth is still initializing', () => {
      mockAuthService.isInitialized.mockReturnValue(false);

      const result = guestGuard(mockRoute, mockState);

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[GuestGuard] Auth still initializing, allowing navigation'
      );
    });

    it('should allow navigation when user is not authenticated', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = guestGuard(mockRoute, mockState);

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[GuestGuard] User not authenticated, allowing navigation to guest page'
      );
    });

    it('should redirect to home when user is authenticated', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = guestGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
      expect(console.log).toHaveBeenCalledWith(
        '[GuestGuard] User already authenticated, redirecting to home'
      );
    });

    it('should log all guard checks', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      guestGuard(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith(
        '[GuestGuard] Checking authentication for:', '/test-route'
      );
    });

    it('should prevent double registration by redirecting authenticated users', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockState.url = '/registration';

      const result = guestGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });
  });

  describe('adminGuard', () => {
    it('should redirect to registration when user is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = adminGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration'], {
        queryParams: { returnUrl: '/test-route' }
      });
      expect(console.log).toHaveBeenCalledWith(
        '[AdminGuard] User not authenticated, redirecting to registration'
      );
    });

    it('should redirect to home when user is not admin', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockReturnValue({
        user_id: 'user123',
        device_id: 'device123',
        rank: 'PO1',
        first_name: 'John',
        last_name: 'Doe',
        is_admin: false,
        created_date: new Date(),
        last_login: new Date()
      });

      const result = adminGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
      expect(console.log).toHaveBeenCalledWith(
        '[AdminGuard] User is not admin, redirecting to home'
      );
    });

    it('should allow navigation when user is admin', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockReturnValue({
        user_id: 'admin123',
        device_id: 'device123',
        rank: 'CPO1',
        first_name: 'Admin',
        last_name: 'User',
        is_admin: true,
        created_date: new Date(),
        last_login: new Date()
      });

      const result = adminGuard(mockRoute, mockState);

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[AdminGuard] User is admin, allowing navigation'
      );
    });

    it('should redirect to home when getCurrentUser returns null', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const result = adminGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });

    it('should redirect to home when user has undefined is_admin', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockReturnValue({
        user_id: 'user123',
        device_id: 'device123',
        rank: 'PO1',
        first_name: 'John',
        last_name: 'Doe',
        is_admin: undefined,
        created_date: new Date(),
        last_login: new Date()
      } as any);

      const result = adminGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });

    it('should preserve returnUrl when redirecting unauthenticated admin access', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockState.url = '/admin/dashboard';

      const result = adminGuard(mockRoute, mockState);

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration'], {
        queryParams: { returnUrl: '/admin/dashboard' }
      });
    });

    it('should log all guard checks', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockReturnValue({
        user_id: 'admin123',
        device_id: 'device123',
        rank: 'CPO1',
        first_name: 'Admin',
        last_name: 'User',
        is_admin: true,
        created_date: new Date(),
        last_login: new Date()
      });

      adminGuard(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith(
        '[AdminGuard] Checking admin access for:', '/test-route'
      );
    });
  });

  describe('Guard Integration', () => {
    it('should work with direct guard invocation', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = authGuard(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('authGuard and guestGuard should have opposite behavior for authenticated users', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const authResult = authGuard(mockRoute, mockState);
      const guestResult = guestGuard(mockRoute, mockState);

      expect(authResult).toBe(true); // Auth allows authenticated users
      expect(guestResult).toBe(false); // Guest blocks authenticated users
    });

    it('authGuard and guestGuard should have opposite behavior for unauthenticated users', () => {
      mockAuthService.isInitialized.mockReturnValue(true);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const authResult = authGuard(mockRoute, mockState);
      const guestResult = guestGuard(mockRoute, mockState);

      expect(authResult).toBe(false); // Auth blocks unauthenticated users
      expect(guestResult).toBe(true); // Guest allows unauthenticated users
    });

    it('guards should respect initialization state', () => {
      mockAuthService.isInitialized.mockReturnValue(false);

      const authResult = authGuard(mockRoute, mockState);
      const guestResult = guestGuard(mockRoute, mockState);

      // Both should allow navigation during initialization
      expect(authResult).toBe(true);
      expect(guestResult).toBe(true);
    });
  });
});
