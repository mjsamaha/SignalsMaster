/**
 * Unit tests for AuthService.
 * Tests authentication orchestration and session management.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { User, UserRegistrationData } from '../models';
import { Timestamp } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockStorage: jest.Mocked<StorageService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = {
    user_id: 'test-user-123',
    rank: 'OC',
    first_name: 'John',
    last_name: 'Doe',
    device_id: 'device-uuid-12345',
    created_date: Timestamp.now(),
    last_login: Timestamp.now(),
    is_admin: false,
  };

  const mockRegistrationData: UserRegistrationData = {
    rank: 'OC',
    first_name: 'John',
    last_name: 'Doe',
    device_id: 'device-uuid-12345',
  };

  beforeEach(() => {
    mockStorage = {
      getCurrentUserId: jest.fn(),
      getCurrentUser: jest.fn(),
      setCurrentUser: jest.fn(),
      clearCurrentUser: jest.fn(),
      getOrCreateDeviceId: jest.fn(),
    } as any;

    mockUserService = {
      getUserById: jest.fn(),
      getUserByDeviceId: jest.fn(),
      createUser: jest.fn(),
      updateLastLogin: jest.fn(),
      validateUserData: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: StorageService, useValue: mockStorage },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeAuth', () => {
    it('should restore existing user session', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue();
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.initializeAuth();

      expect(mockStorage.getCurrentUserId).toHaveBeenCalled();
      expect(mockUserService.getUserById).toHaveBeenCalledWith('test-user-123');
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith('test-user-123');
      expect(mockStorage.setCurrentUser).toHaveBeenCalledWith(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should clear storage if user not found in Firestore', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(null);
      mockStorage.clearCurrentUser.mockResolvedValue();

      await service.initializeAuth();

      expect(mockStorage.clearCurrentUser).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should restore session from device ID if no stored user', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue(null);
      mockStorage.getOrCreateDeviceId.mockResolvedValue('device-uuid-12345');
      mockUserService.getUserByDeviceId.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();
      mockUserService.updateLastLogin.mockResolvedValue();

      await service.initializeAuth();

      expect(mockStorage.getOrCreateDeviceId).toHaveBeenCalled();
      expect(mockUserService.getUserByDeviceId).toHaveBeenCalledWith('device-uuid-12345');
      expect(mockStorage.setCurrentUser).toHaveBeenCalledWith(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should require registration for new device', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue(null);
      mockStorage.getOrCreateDeviceId.mockResolvedValue('new-device-uuid');
      mockUserService.getUserByDeviceId.mockResolvedValue(null);

      await service.initializeAuth();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should handle initialization errors gracefully', async () => {
      mockStorage.getCurrentUserId.mockRejectedValue(new Error('Storage error'));

      await service.initializeAuth();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.isInitialized()).toBe(true);
    });

    it('should emit loading state during initialization', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue(null);
      mockStorage.getOrCreateDeviceId.mockResolvedValue('device-uuid');
      mockUserService.getUserByDeviceId.mockResolvedValue(null);

      const loadingStates: boolean[] = [];
      service.isLoading$.subscribe(loading => loadingStates.push(loading));

      await service.initializeAuth();

      expect(loadingStates).toContain(true);
      expect(loadingStates[loadingStates.length - 1]).toBe(false);
    });
  });

  describe('registerUser', () => {
    it('should register new user successfully', async () => {
      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockStorage.getOrCreateDeviceId.mockResolvedValue('device-uuid-12345');
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      const result = await service.registerUser(mockRegistrationData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith(mockRegistrationData);
      expect(mockStorage.setCurrentUser).toHaveBeenCalledWith(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should fail registration with validation errors', async () => {
      mockUserService.validateUserData.mockReturnValue({
        valid: false,
        errors: ['First name is required', 'Last name is required'],
      });

      const result = await service.registerUser({
        rank: 'OC',
        first_name: '',
        last_name: '',
        device_id: 'device-uuid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('First name is required');
      expect(result.requiresRegistration).toBe(true);
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should restore existing user if device already registered', async () => {
      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      const result = await service.registerUser(mockRegistrationData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockUserService.createUser).not.toHaveBeenCalled();
      expect(mockStorage.setCurrentUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle registration errors', async () => {
      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockRejectedValue(new Error('Firestore error'));

      const result = await service.registerUser(mockRegistrationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firestore error');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should ensure device ID is set', async () => {
      const dataWithoutDeviceId = {
        rank: 'OC',
        first_name: 'John',
        last_name: 'Doe',
        device_id: '',
      };

      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockStorage.getOrCreateDeviceId.mockResolvedValue('generated-device-id');
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(dataWithoutDeviceId);

      expect(mockStorage.getOrCreateDeviceId).toHaveBeenCalled();
      expect(dataWithoutDeviceId.device_id).toBe('generated-device-id');
    });
  });

  describe('autoLogin', () => {
    it('should auto-login with stored user ID', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue();
      mockStorage.setCurrentUser.mockResolvedValue();

      const result = await service.autoLogin();

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith('test-user-123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should fail auto-login if no stored user ID', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue(null);

      const result = await service.autoLogin();

      expect(result.success).toBe(false);
      expect(result.requiresRegistration).toBe(true);
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
    });

    it('should clear storage if user not found in Firestore', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(null);
      mockStorage.clearCurrentUser.mockResolvedValue();

      const result = await service.autoLogin();

      expect(result.success).toBe(false);
      expect(result.requiresRegistration).toBe(true);
      expect(mockStorage.clearCurrentUser).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle auto-login errors', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockRejectedValue(new Error('Network error'));

      const result = await service.autoLogin();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('logout', () => {
    it('should logout user and clear storage', async () => {
      // Set initial user state
      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();
      await service.registerUser(mockRegistrationData);

      // Clear mocks
      jest.clearAllMocks();

      // Logout
      mockStorage.clearCurrentUser.mockResolvedValue();
      await service.logout();

      expect(mockStorage.clearCurrentUser).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration']);
    });

    it('should handle logout errors gracefully', async () => {
      mockStorage.clearCurrentUser.mockRejectedValue(new Error('Storage error'));

      await service.logout();

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should refresh user session with latest data', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue();
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.refreshSession();

      expect(mockUserService.getUserById).toHaveBeenCalledWith('test-user-123');
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith('test-user-123');
      expect(mockStorage.setCurrentUser).toHaveBeenCalledWith(mockUser);
    });

    it('should do nothing if no user to refresh', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue(null);

      await service.refreshSession();

      expect(mockUserService.getUserById).not.toHaveBeenCalled();
    });

    it('should clear session if user no longer exists', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(null);
      mockStorage.clearCurrentUser.mockResolvedValue();

      await service.refreshSession();

      expect(mockStorage.clearCurrentUser).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should not throw error on refresh failure', async () => {
      mockStorage.getCurrentUserId.mockRejectedValue(new Error('Storage error'));

      await expect(service.refreshSession()).resolves.not.toThrow();
    });
  });

  describe('validateSession', () => {
    it('should return true for valid session', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const isValid = await service.validateSession();

      expect(isValid).toBe(true);
    });

    it('should return false if no user ID', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue(null);

      const isValid = await service.validateSession();

      expect(isValid).toBe(false);
    });

    it('should return false and clear storage if user not found', async () => {
      mockStorage.getCurrentUserId.mockResolvedValue('test-user-123');
      mockUserService.getUserById.mockResolvedValue(null);
      mockStorage.clearCurrentUser.mockResolvedValue();

      const isValid = await service.validateSession();

      expect(isValid).toBe(false);
      expect(mockStorage.clearCurrentUser).toHaveBeenCalled();
    });

    it('should return false on validation errors', async () => {
      mockStorage.getCurrentUserId.mockRejectedValue(new Error('Storage error'));

      const isValid = await service.validateSession();

      expect(isValid).toBe(false);
    });
  });

  describe('Synchronous Getters', () => {
    it('should get current user synchronously', async () => {
      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(mockRegistrationData);

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should get current user ID synchronously', async () => {
      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(mockRegistrationData);

      expect(service.getCurrentUserId()).toBe('test-user-123');
    });

    it('should check authentication status synchronously', async () => {
      expect(service.isAuthenticated()).toBe(false);

      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(mockRegistrationData);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should check initialized status synchronously', async () => {
      expect(service.isInitialized()).toBe(false);

      mockStorage.getCurrentUserId.mockResolvedValue(null);
      mockStorage.getOrCreateDeviceId.mockResolvedValue('device-uuid');
      mockUserService.getUserByDeviceId.mockResolvedValue(null);

      await service.initializeAuth();

      expect(service.isInitialized()).toBe(true);
    });

    it('should get full auth state synchronously', () => {
      const state = service.getAuthState();

      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('loading');
      expect(state).toHaveProperty('initialized');
      expect(state).toHaveProperty('error');
    });
  });

  describe('Observable State', () => {
    it('should emit user state changes', async () => {
      const userStates: (User | null)[] = [];
      service.currentUser$.subscribe(user => userStates.push(user));

      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(mockRegistrationData);

      expect(userStates).toContain(null);
      expect(userStates).toContain(mockUser);
    });

    it('should emit authentication state changes', async () => {
      const authStates: boolean[] = [];
      service.isAuthenticated$.subscribe(isAuth => authStates.push(isAuth));

      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(mockRegistrationData);

      expect(authStates).toContain(false);
      expect(authStates).toContain(true);
    });

    it('should emit loading state changes', async () => {
      const loadingStates: boolean[] = [];
      service.isLoading$.subscribe(loading => loadingStates.push(loading));

      mockUserService.validateUserData.mockReturnValue({ valid: true, errors: [] });
      mockUserService.getUserByDeviceId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockStorage.setCurrentUser.mockResolvedValue();

      await service.registerUser(mockRegistrationData);

      expect(loadingStates).toContain(true);
      expect(loadingStates[loadingStates.length - 1]).toBe(false);
    });
  });
});
