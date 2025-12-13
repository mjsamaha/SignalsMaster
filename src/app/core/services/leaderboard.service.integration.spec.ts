/**
 * Integration tests for LeaderboardService with authentication.
 * Tests score submission with User objects and leaderboard retrieval.
 */

import { TestBed } from '@angular/core/testing';
import { Firestore, collection, addDoc, query, getDocs } from '@angular/fire/firestore';
import { NgZone } from '@angular/core';
import { LeaderboardService, SubmissionResponse } from './leaderboard.service';
import { CompetitiveResults } from './quiz.service';
import { User } from '../models/user.model';
import { Timestamp } from '@angular/fire/firestore';

describe('LeaderboardService Integration Tests', () => {
  let service: LeaderboardService;
  let mockFirestore: jest.Mocked<Firestore>;
  let mockNgZone: jest.Mocked<NgZone>;

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

  const mockResults: CompetitiveResults = {
    sessionId: 'competitive-789',
    userId: 'test-user-123',
    totalQuestions: 50,
    correctAnswers: 42,
    accuracy: 84,
    totalTime: 320.5,
    averageTimePerQuestion: 6.41,
    baseRating: 1200,
    speedBonus: 150,
    finalRating: 1350,
    ratingTier: 'Expert Signaller',
    completedAt: new Date(),
    answers: [],
  };

  const mockDocRef = {
    id: 'leaderboard-entry-123',
    path: 'leaderboard/leaderboard-entry-123',
  };

  beforeEach(() => {
    mockFirestore = {
      app: {} as any,
    } as any;

    mockNgZone = {
      run: jest.fn((fn) => fn()),
      runOutsideAngular: jest.fn((fn) => fn()),
    } as any;

    // Mock Firestore functions
    (addDoc as jest.Mock) = jest.fn().mockResolvedValue(mockDocRef);
    (collection as jest.Mock) = jest.fn();
    (query as jest.Mock) = jest.fn();
    (getDocs as jest.Mock) = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        LeaderboardService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: NgZone, useValue: mockNgZone },
      ],
    });

    service = TestBed.inject(LeaderboardService);
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('submitScore with User Integration', () => {
    it('should accept User object and CompetitiveResults', async () => {
      const response = await service.submitScore(mockUser, mockResults);

      expect(response.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
    });

    it('should create Firestore document with user_id field', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.user_id).toBe('test-user-123');
    });

    it('should format username as "Rank FirstName LastName"', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.username).toBe('OC John Doe');
    });

    it('should include all required leaderboard fields', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData).toHaveProperty('user_id', 'test-user-123');
      expect(docData).toHaveProperty('username', 'OC John Doe');
      expect(docData).toHaveProperty('rating');
      expect(docData).toHaveProperty('accuracy');
      expect(docData).toHaveProperty('totalTime');
      expect(docData).toHaveProperty('correctAnswers');
      expect(docData).toHaveProperty('totalQuestions');
      expect(docData).toHaveProperty('sessionId');
      expect(docData).toHaveProperty('createdAt');
    });

    it('should round rating to integer', async () => {
      const resultsWithDecimal = { ...mockResults, finalRating: 1350.7 };
      await service.submitScore(mockUser, resultsWithDecimal);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.rating).toBe(1351);
    });

    it('should validate user has user_id', async () => {
      const invalidUser = { ...mockUser, user_id: '' };

      const response = await service.submitScore(invalidUser, mockResults);

      expect(response.success).toBe(false);
      expect(response.message).toContain('user_id');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should validate user object exists', async () => {
      const response = await service.submitScore(null as any, mockResults);

      expect(response.success).toBe(false);
      expect(response.message).toContain('User');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should validate results have userId', async () => {
      const invalidResults = { ...mockResults, userId: '' };

      const response = await service.submitScore(mockUser, invalidResults);

      expect(response.success).toBe(false);
      expect(response.message).toContain('userId');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors gracefully', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const response = await service.submitScore(mockUser, mockResults);

      expect(response.success).toBe(false);
      expect(response.message).toContain('error');
    });

    it('should use ngZone.run for Firestore operations', async () => {
      await service.submitScore(mockUser, mockResults);

      expect(mockNgZone.run).toHaveBeenCalled();
    });

    it('should log submission with LeaderboardService prefix', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.submitScore(mockUser, mockResults);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LeaderboardService]')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('User Display Name Formatting', () => {
    it('should format OC rank correctly', async () => {
      const ocUser = { ...mockUser, rank: 'OC' };
      await service.submitScore(ocUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.username).toBe('OC John Doe');
    });

    it('should format CPO1 rank correctly', async () => {
      const cpoUser = { ...mockUser, rank: 'CPO1' };
      await service.submitScore(cpoUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.username).toBe('CPO1 John Doe');
    });

    it('should handle long names', async () => {
      const longNameUser = {
        ...mockUser,
        first_name: 'Christopher',
        last_name: 'Montgomery-Wellington',
      };
      await service.submitScore(longNameUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.username).toBe('OC Christopher Montgomery-Wellington');
    });

    it('should handle short names', async () => {
      const shortNameUser = {
        ...mockUser,
        first_name: 'Jo',
        last_name: 'Li',
      };
      await service.submitScore(shortNameUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.username).toBe('OC Jo Li');
    });
  });

  describe('Validation Logic', () => {
    it('should reject missing user_id', async () => {
      const noIdUser = { ...mockUser, user_id: '' };
      const response = await service.submitScore(noIdUser, mockResults);

      expect(response.success).toBe(false);
      expect(response.message).toContain('user_id');
    });

    it('should reject null user', async () => {
      const response = await service.submitScore(null as any, mockResults);

      expect(response.success).toBe(false);
    });

    it('should reject undefined results', async () => {
      const response = await service.submitScore(mockUser, undefined as any);

      expect(response.success).toBe(false);
    });

    it('should reject results with empty userId', async () => {
      const badResults = { ...mockResults, userId: '' };
      const response = await service.submitScore(mockUser, badResults);

      expect(response.success).toBe(false);
    });

    it('should accept valid accuracy of 0', async () => {
      const zeroResults = { ...mockResults, accuracy: 0, correctAnswers: 0 };
      const response = await service.submitScore(mockUser, zeroResults);

      expect(response.success).toBe(true);
    });

    it('should accept valid accuracy of 100', async () => {
      const perfectResults = {
        ...mockResults,
        accuracy: 100,
        correctAnswers: 50,
      };
      const response = await service.submitScore(mockUser, perfectResults);

      expect(response.success).toBe(true);
    });

    it('should reject accuracy over 100', async () => {
      const invalidResults = { ...mockResults, accuracy: 101 };
      const response = await service.submitScore(mockUser, invalidResults);

      expect(response.success).toBe(false);
    });

    it('should reject negative accuracy', async () => {
      const invalidResults = { ...mockResults, accuracy: -1 };
      const response = await service.submitScore(mockUser, invalidResults);

      expect(response.success).toBe(false);
    });

    it('should reject negative totalTime', async () => {
      const invalidResults = { ...mockResults, totalTime: -10 };
      const response = await service.submitScore(mockUser, invalidResults);

      expect(response.success).toBe(false);
    });
  });

  describe('Data Transformation', () => {
    it('should convert rating to integer', async () => {
      const floatResults = { ...mockResults, finalRating: 1234.56 };
      await service.submitScore(mockUser, floatResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.rating).toBe(1235);
      expect(Number.isInteger(docData.rating)).toBe(true);
    });

    it('should include session ID', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.sessionId).toBe('competitive-789');
    });

    it('should create timestamp for createdAt', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.createdAt).toBeDefined();
    });

    it('should preserve all result metrics', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.accuracy).toBe(84);
      expect(docData.totalTime).toBe(320.5);
      expect(docData.correctAnswers).toBe(42);
      expect(docData.totalQuestions).toBe(50);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await service.submitScore(mockUser, mockResults);

      expect(response.success).toBe(false);
      expect(response.message).toBeTruthy();
    });

    it('should handle permission denied errors', async () => {
      (addDoc as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const response = await service.submitScore(mockUser, mockResults);

      expect(response.success).toBe(false);
    });

    it('should log errors with console.error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (addDoc as jest.Mock).mockRejectedValue(new Error('Test error'));

      await service.submitScore(mockUser, mockResults);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Backwards Compatibility', () => {
    it('should create entries that work with existing leaderboard display', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      // Old system used username field - ensure it still exists
      expect(docData.username).toBeDefined();
      expect(typeof docData.username).toBe('string');
    });

    it('should include user_id for future queries', async () => {
      await service.submitScore(mockUser, mockResults);

      const docData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(docData.user_id).toBe('test-user-123');
    });
  });
});
