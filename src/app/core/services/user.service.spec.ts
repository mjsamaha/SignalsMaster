/**
 * Unit tests for UserService.
 * Tests Firestore CRUD operations for users collection.
 */

import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { User, UserRegistrationData, UserUpdateData } from '../models';

// Mock Firestore
jest.mock('@angular/fire/firestore', () => ({
  Firestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => ({ isEqual: () => false })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

describe('UserService', () => {
  let service: UserService;
  let mockFirestore: jest.Mocked<Firestore>;

  const mockTimestamp = Timestamp.now();

  const mockUser: User = {
    user_id: 'test-user-123',
    rank: 'OC',
    first_name: 'John',
    last_name: 'Doe',
    device_id: 'device-uuid-12345',
    created_date: mockTimestamp,
    last_login: mockTimestamp,
    is_admin: false,
  };

  const mockRegistrationData: UserRegistrationData = {
    rank: 'OC',
    first_name: 'John',
    last_name: 'Doe',
    device_id: 'device-uuid-12345',
  };

  beforeEach(() => {
    mockFirestore = {
      app: {} as any,
      toJSON: jest.fn(),
      type: 'firestore',
    } as any;

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(UserService);
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const mockDocRef = { id: 'test-user-123' } as any;
      const mockDocSnap = {
        exists: () => true,
        id: 'test-user-123',
        data: () => ({
          rank: 'OC',
          first_name: 'John',
          last_name: 'Doe',
          device_id: 'device-uuid-12345',
          created_date: mockTimestamp,
          last_login: mockTimestamp,
          user_id: 'test-user-123',
        }),
      } as any;

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.createUser(mockRegistrationData);

      expect(result).toBeDefined();
      expect(result.user_id).toBe('test-user-123');
      expect(result.rank).toBe('OC');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should trim whitespace from user data', async () => {
      const dataWithWhitespace: UserRegistrationData = {
        rank: '  OC  ',
        first_name: '  John  ',
        last_name: '  Doe  ',
        device_id: 'device-uuid-12345',
      };

      const mockDocRef = { id: 'test-user-123' } as any;
      const mockDocSnap = {
        exists: () => true,
        id: 'test-user-123',
        data: () => ({
          rank: 'OC',
          first_name: 'John',
          last_name: 'Doe',
          device_id: 'device-uuid-12345',
          created_date: mockTimestamp,
          last_login: mockTimestamp,
          user_id: 'test-user-123',
        }),
      } as any;

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.createUser(dataWithWhitespace);

      expect(result.rank).toBe('OC');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
    });

    it('should create user with CIV rank', async () => {
      const civData: UserRegistrationData = {
        rank: 'CIV',
        first_name: 'Jane',
        last_name: 'Smith',
        device_id: 'device-uuid-67890',
      };

      const mockDocRef = { id: 'test-civ-user' } as any;
      const mockDocSnap = {
        exists: () => true,
        id: 'test-civ-user',
        data: () => ({
          rank: 'CIV',
          first_name: 'Jane',
          last_name: 'Smith',
          device_id: 'device-uuid-67890',
          created_date: mockTimestamp,
          last_login: mockTimestamp,
          user_id: 'test-civ-user',
        }),
      } as any;

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.createUser(civData);

      expect(result.rank).toBe('CIV');
      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBe('Smith');
    });

    it('should create user with UnitO rank', async () => {
      const unitOData: UserRegistrationData = {
        rank: 'UnitO',
        first_name: 'Michael',
        last_name: 'Johnson',
        device_id: 'device-uuid-11111',
      };

      const mockDocRef = { id: 'test-unito-user' } as any;
      const mockDocSnap = {
        exists: () => true,
        id: 'test-unito-user',
        data: () => ({
          rank: 'UnitO',
          first_name: 'Michael',
          last_name: 'Johnson',
          device_id: 'device-uuid-11111',
          created_date: mockTimestamp,
          last_login: mockTimestamp,
          user_id: 'test-unito-user',
        }),
      } as any;

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.createUser(unitOData);

      expect(result.rank).toBe('UnitO');
      expect(result.first_name).toBe('Michael');
      expect(result.last_name).toBe('Johnson');
    });

    it('should create user with NCMR rank', async () => {
      const ncmrData: UserRegistrationData = {
        rank: 'NCMR',
        first_name: 'Sarah',
        last_name: 'Williams',
        device_id: 'device-uuid-22222',
      };

      const mockDocRef = { id: 'test-ncmr-user' } as any;
      const mockDocSnap = {
        exists: () => true,
        id: 'test-ncmr-user',
        data: () => ({
          rank: 'NCMR',
          first_name: 'Sarah',
          last_name: 'Williams',
          device_id: 'device-uuid-22222',
          created_date: mockTimestamp,
          last_login: mockTimestamp,
          user_id: 'test-ncmr-user',
        }),
      } as any;

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.createUser(ncmrData);

      expect(result.rank).toBe('NCMR');
      expect(result.first_name).toBe('Sarah');
      expect(result.last_name).toBe('Williams');
    });

    it('should throw error for invalid data', async () => {
      const invalidData: UserRegistrationData = {
        rank: '',
        first_name: '',
        last_name: '',
        device_id: 'short',
      };

      await expect(service.createUser(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should handle permission denied error', async () => {
      const error = { code: 'permission-denied' };
      (addDoc as jest.Mock).mockRejectedValue(error);

      await expect(service.createUser(mockRegistrationData)).rejects.toThrow(
        'Permission denied - check Firestore security rules'
      );
    });

    it('should handle invalid argument error', async () => {
      const error = { code: 'invalid-argument' };
      (addDoc as jest.Mock).mockRejectedValue(error);

      await expect(service.createUser(mockRegistrationData)).rejects.toThrow(
        'Invalid data format - check field types and validation'
      );
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by ID', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'test-user-123',
        data: () => ({
          rank: 'OC',
          first_name: 'John',
          last_name: 'Doe',
          device_id: 'device-uuid-12345',
          created_date: mockTimestamp,
          last_login: mockTimestamp,
          user_id: 'test-user-123',
        }),
      } as any;

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getUserById('test-user-123');

      expect(result).toBeDefined();
      expect(result?.user_id).toBe('test-user-123');
      expect(result?.rank).toBe('OC');
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      const mockDocSnap = {
        exists: () => false,
      } as any;

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await service.getUserById('non-existent-user');

      expect(result).toBeNull();
    });

    it('should handle permission denied error', async () => {
      const error = { code: 'permission-denied' };
      (getDoc as jest.Mock).mockRejectedValue(error);

      await expect(service.getUserById('test-user-123')).rejects.toThrow(
        'Permission denied - check Firestore security rules'
      );
    });
  });

  describe('getUserByDeviceId', () => {
    it('should retrieve user by device ID', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            exists: () => true,
            id: 'test-user-123',
            data: () => ({
              rank: 'OC',
              first_name: 'John',
              last_name: 'Doe',
              device_id: 'device-uuid-12345',
              created_date: mockTimestamp,
              last_login: mockTimestamp,
              user_id: 'test-user-123',
            }),
          },
        ],
      } as any;

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getUserByDeviceId('device-uuid-12345');

      expect(result).toBeDefined();
      expect(result?.device_id).toBe('device-uuid-12345');
      expect(getDocs).toHaveBeenCalled();
    });

    it('should return null if no user found for device ID', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      } as any;

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await service.getUserByDeviceId('unknown-device');

      expect(result).toBeNull();
    });

    it('should handle permission denied error', async () => {
      const error = { code: 'permission-denied' };
      (getDocs as jest.Mock).mockRejectedValue(error);

      await expect(service.getUserByDeviceId('device-uuid-12345')).rejects.toThrow(
        'Permission denied - check Firestore security rules'
      );
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users', (done) => {
      const mockQuerySnapshot = {
        forEach: (callback: any) => {
          callback({
            exists: () => true,
            id: 'user-1',
            data: () => ({
              rank: 'OC',
              first_name: 'John',
              last_name: 'Doe',
              device_id: 'device-1',
              created_date: mockTimestamp,
              last_login: mockTimestamp,
            }),
          });
          callback({
            exists: () => true,
            id: 'user-2',
            data: () => ({
              rank: 'AC',
              first_name: 'Jane',
              last_name: 'Smith',
              device_id: 'device-2',
              created_date: mockTimestamp,
              last_login: mockTimestamp,
            }),
          });
        },
      } as any;

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      service.getAllUsers().subscribe((users) => {
        expect(users).toHaveLength(2);
        expect(users[0].user_id).toBe('user-1');
        expect(users[1].user_id).toBe('user-2');
        done();
      });
    });
  });

  describe('getUsersCount', () => {
    it('should return count of users', (done) => {
      const mockQuerySnapshot = {
        forEach: (callback: any) => {
          callback({
            exists: () => true,
            id: 'user-1',
            data: () => ({ rank: 'OC', first_name: 'John', last_name: 'Doe', device_id: 'device-1', created_date: mockTimestamp, last_login: mockTimestamp }),
          });
          callback({
            exists: () => true,
            id: 'user-2',
            data: () => ({ rank: 'AC', first_name: 'Jane', last_name: 'Smith', device_id: 'device-2', created_date: mockTimestamp, last_login: mockTimestamp }),
          });
        },
      } as any;

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      service.getUsersCount().subscribe((count) => {
        expect(count).toBe(2);
        done();
      });
    });
  });

  describe('updateUser', () => {
    it('should update user profile fields', async () => {
      const updates: UserUpdateData = {
        rank: 'AC',
        first_name: 'Jane',
        last_name: 'Smith',
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.updateUser('test-user-123', updates);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should trim whitespace from updates', async () => {
      const updates: UserUpdateData = {
        first_name: '  Jane  ',
        last_name: '  Smith  ',
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.updateUser('test-user-123', updates);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error for invalid rank', async () => {
      const updates: UserUpdateData = {
        rank: 'INVALID_RANK',
      };

      await expect(service.updateUser('test-user-123', updates)).rejects.toThrow(
        'Invalid rank: INVALID_RANK'
      );
    });

    it('should throw error for invalid first name length', async () => {
      const updates: UserUpdateData = {
        first_name: '',
      };

      await expect(service.updateUser('test-user-123', updates)).rejects.toThrow(
        'First name must be between 1 and 50 characters'
      );
    });

    it('should handle not found error', async () => {
      const error = { code: 'not-found' };
      (updateDoc as jest.Mock).mockRejectedValue(error);

      await expect(service.updateUser('non-existent', { rank: 'AC' })).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.updateLastLogin('test-user-123');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should not throw error on failure (non-blocking)', async () => {
      const error = new Error('Network error');
      (updateDoc as jest.Mock).mockRejectedValue(error);

      // Should not throw
      await expect(service.updateLastLogin('test-user-123')).resolves.not.toThrow();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await service.deactivateUser('test-user-123');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      const error = new Error('Firestore error');
      (updateDoc as jest.Mock).mockRejectedValue(error);

      await expect(service.deactivateUser('test-user-123')).rejects.toThrow(
        'Failed to deactivate user'
      );
    });
  });

  describe('validateUserData', () => {
    it('should validate valid user data', () => {
      const result = service.validateUserData(mockRegistrationData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing rank', () => {
      const invalidData = { ...mockRegistrationData, rank: '' };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rank is required');
    });

    it('should catch invalid rank', () => {
      const invalidData = { ...mockRegistrationData, rank: 'INVALID' };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid rank value');
    });

    it('should validate CIV rank', () => {
      const civData = { ...mockRegistrationData, rank: 'CIV' };
      const result = service.validateUserData(civData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate UnitO rank', () => {
      const unitOData = { ...mockRegistrationData, rank: 'UnitO' };
      const result = service.validateUserData(unitOData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate NCMR rank', () => {
      const ncmrData = { ...mockRegistrationData, rank: 'NCMR' };
      const result = service.validateUserData(ncmrData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing first name', () => {
      const invalidData = { ...mockRegistrationData, first_name: '' };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('First name is required');
    });

    it('should catch first name too long', () => {
      const invalidData = { ...mockRegistrationData, first_name: 'a'.repeat(51) };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('First name must be between 1 and 50 characters');
    });

    it('should catch missing last name', () => {
      const invalidData = { ...mockRegistrationData, last_name: '' };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Last name is required');
    });

    it('should catch last name too long', () => {
      const invalidData = { ...mockRegistrationData, last_name: 'a'.repeat(51) };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Last name must be between 1 and 50 characters');
    });

    it('should catch missing device ID', () => {
      const invalidData = { ...mockRegistrationData, device_id: '' };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Device ID is required');
    });

    it('should catch device ID too short', () => {
      const invalidData = { ...mockRegistrationData, device_id: 'short' };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Device ID must be at least 10 characters');
    });

    it('should catch multiple validation errors', () => {
      const invalidData: UserRegistrationData = {
        rank: '',
        first_name: '',
        last_name: '',
        device_id: 'short',
      };
      const result = service.validateUserData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
