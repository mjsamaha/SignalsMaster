/**
 * Unit tests for StorageService.
 * Tests device storage operations using Capacitor Preferences.
 */

import { TestBed } from '@angular/core/testing';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { Preferences } from '@capacitor/preferences';
import { User } from '../models/user.model';
import { Timestamp } from '@angular/fire/firestore';

// Mock Capacitor Preferences
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  },
}));

describe('StorageService', () => {
  let service: StorageService;
  let mockPreferences: jest.Mocked<typeof Preferences>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    mockPreferences = Preferences as jest.Mocked<typeof Preferences>;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Device ID Management', () => {
    it('should generate new device ID if none exists', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });
      mockPreferences.set.mockResolvedValue();

      const deviceId = await service.getOrCreateDeviceId();

      expect(deviceId).toBeTruthy();
      expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: STORAGE_KEYS.DEVICE_ID,
        value: deviceId
      });
    });

    it('should return existing device ID if found', async () => {
      const existingId = '12345678-1234-4234-8234-123456789012';
      mockPreferences.get.mockResolvedValue({ value: existingId });

      const deviceId = await service.getOrCreateDeviceId();

      expect(deviceId).toBe(existingId);
      expect(mockPreferences.set).not.toHaveBeenCalled();
    });

    it('should throw error if device ID generation fails', async () => {
      mockPreferences.get.mockRejectedValue(new Error('Storage error'));

      await expect(service.getOrCreateDeviceId()).rejects.toThrow('Failed to get or create device ID');
    });
  });

  describe('User Storage', () => {
    const mockUser: User = {
      user_id: 'test-user-123',
      rank: 'OC',
      first_name: 'John',
      last_name: 'Doe',
      device_id: 'device-123',
      created_date: Timestamp.now(),
      last_login: Timestamp.now(),
    };

    it('should store current user', async () => {
      mockPreferences.set.mockResolvedValue();

      await service.setCurrentUser(mockUser);

      expect(mockPreferences.set).toHaveBeenCalledTimes(3); // user, user_id, last_sync
      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: STORAGE_KEYS.CURRENT_USER,
        value: JSON.stringify(mockUser)
      });
      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: STORAGE_KEYS.CURRENT_USER_ID,
        value: mockUser.user_id
      });
    });

    it('should retrieve current user', async () => {
      mockPreferences.get.mockResolvedValue({ value: JSON.stringify(mockUser) });

      const user = await service.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockPreferences.get).toHaveBeenCalledWith({ key: STORAGE_KEYS.CURRENT_USER });
    });

    it('should return null if no current user found', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const user = await service.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null if user JSON parsing fails', async () => {
      mockPreferences.get.mockResolvedValue({ value: 'invalid-json' });

      const user = await service.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should retrieve current user ID', async () => {
      mockPreferences.get.mockResolvedValue({ value: mockUser.user_id });

      const userId = await service.getCurrentUserId();

      expect(userId).toBe(mockUser.user_id);
      expect(mockPreferences.get).toHaveBeenCalledWith({ key: STORAGE_KEYS.CURRENT_USER_ID });
    });

    it('should return null if no user ID found', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const userId = await service.getCurrentUserId();

      expect(userId).toBeNull();
    });

    it('should clear current user data', async () => {
      mockPreferences.remove.mockResolvedValue();

      await service.clearCurrentUser();

      expect(mockPreferences.remove).toHaveBeenCalledTimes(3);
      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: STORAGE_KEYS.CURRENT_USER });
      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: STORAGE_KEYS.CURRENT_USER_ID });
      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: STORAGE_KEYS.SESSION_TOKEN });
    });
  });

  describe('Session Token Management', () => {
    const mockToken = 'mock-session-token-12345';

    it('should store session token', async () => {
      mockPreferences.set.mockResolvedValue();

      await service.setSessionToken(mockToken);

      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: STORAGE_KEYS.SESSION_TOKEN,
        value: mockToken
      });
    });

    it('should retrieve session token', async () => {
      mockPreferences.get.mockResolvedValue({ value: mockToken });

      const token = await service.getSessionToken();

      expect(token).toBe(mockToken);
    });

    it('should return null if no session token found', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const token = await service.getSessionToken();

      expect(token).toBeNull();
    });

    it('should clear session token', async () => {
      mockPreferences.remove.mockResolvedValue();

      await service.clearSessionToken();

      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: STORAGE_KEYS.SESSION_TOKEN });
    });
  });

  describe('Generic Storage Methods', () => {
    it('should store generic key-value pair (object)', async () => {
      mockPreferences.set.mockResolvedValue();
      const testData = { foo: 'bar', baz: 123 };

      await service.set('test-key', testData);

      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'test-key',
        value: JSON.stringify(testData)
      });
    });

    it('should store generic key-value pair (string)', async () => {
      mockPreferences.set.mockResolvedValue();

      await service.set('test-key', 'test-value');

      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'test-key',
        value: 'test-value'
      });
    });

    it('should retrieve and parse JSON value', async () => {
      const testData = { foo: 'bar', baz: 123 };
      mockPreferences.get.mockResolvedValue({ value: JSON.stringify(testData) });

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
    });

    it('should retrieve string value if not JSON', async () => {
      mockPreferences.get.mockResolvedValue({ value: 'plain-string' });

      const result = await service.get('test-key');

      expect(result).toBe('plain-string');
    });

    it('should return null if key not found', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });

    it('should remove key from storage', async () => {
      mockPreferences.remove.mockResolvedValue();

      await service.remove('test-key');

      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: 'test-key' });
    });

    it('should clear all storage', async () => {
      mockPreferences.clear.mockResolvedValue();

      await service.clear();

      expect(mockPreferences.clear).toHaveBeenCalled();
    });

    it('should retrieve all storage keys', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      mockPreferences.keys.mockResolvedValue({ keys: mockKeys });

      const keys = await service.keys();

      expect(keys).toEqual(mockKeys);
    });
  });

  describe('Last Sync Timestamp', () => {
    it('should retrieve last sync timestamp', async () => {
      const timestamp = new Date().toISOString();
      mockPreferences.get.mockResolvedValue({ value: timestamp });

      const lastSync = await service.getLastSync();

      expect(lastSync).toBe(timestamp);
      expect(mockPreferences.get).toHaveBeenCalledWith({ key: STORAGE_KEYS.LAST_SYNC });
    });

    it('should return null if no last sync found', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const lastSync = await service.getLastSync();

      expect(lastSync).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when storing user fails', async () => {
      const mockUser: User = {
        user_id: 'test-user-123',
        rank: 'OC',
        first_name: 'John',
        last_name: 'Doe',
        device_id: 'device-123',
        created_date: Timestamp.now(),
        last_login: Timestamp.now(),
      };
      mockPreferences.set.mockRejectedValue(new Error('Storage full'));

      await expect(service.setCurrentUser(mockUser)).rejects.toThrow('Failed to store user data');
    });

    it('should throw error when clearing user fails', async () => {
      mockPreferences.remove.mockRejectedValue(new Error('Storage error'));

      await expect(service.clearCurrentUser()).rejects.toThrow('Failed to clear user data');
    });

    it('should throw error when generic set fails', async () => {
      mockPreferences.set.mockRejectedValue(new Error('Storage error'));

      await expect(service.set('test-key', 'value')).rejects.toThrow('Failed to store test-key');
    });

    it('should throw error when generic remove fails', async () => {
      mockPreferences.remove.mockRejectedValue(new Error('Storage error'));

      await expect(service.remove('test-key')).rejects.toThrow('Failed to remove test-key');
    });

    it('should throw error when clear fails', async () => {
      mockPreferences.clear.mockRejectedValue(new Error('Storage error'));

      await expect(service.clear()).rejects.toThrow('Failed to clear storage');
    });
  });
});
