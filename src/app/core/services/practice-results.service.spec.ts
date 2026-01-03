/**
 * Unit tests for PracticeResultsService.
 * Tests Firestore operations for practice_results collection.
 */

import { TestBed } from '@angular/core/testing';
import { PracticeResultsService } from './practice-results.service';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { User } from '../models/user.model';
import {
  validatePracticeResultSubmission,
  practiceSummaryToSubmission,
} from '../models/practice-result.model';

// Mock Firestore
jest.mock('@angular/fire/firestore', () => ({
  Firestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ isEqual: () => false })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

describe('PracticeResultsService', () => {
  let service: PracticeResultsService;
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
  };

  const mockPracticeSummary = {
    sessionId: 'practice-1735906800000',
    totalQuestions: 10,
    correctAnswers: 8,
    accuracy: 80,
    totalTime: 45.5,
    averageTimePerQuestion: 4.55,
  };

  beforeEach(() => {
    mockFirestore = {
      app: {} as any,
      toJSON: jest.fn(),
      type: 'firestore',
    } as any;

    TestBed.configureTestingModule({
      providers: [
        PracticeResultsService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(PracticeResultsService);
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('submitPracticeResult', () => {
    it('should successfully submit valid practice results', async () => {
      const mockDocRef = { id: 'result-123' } as any;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await service.submitPracticeResult(mockUser, mockPracticeSummary);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Practice results saved successfully!');
      expect(result.resultId).toBe('result-123');
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    it('should call addDoc with correct data structure', async () => {
      const mockDocRef = { id: 'result-123' } as any;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await service.submitPracticeResult(mockUser, mockPracticeSummary);

      const addDocCall = (addDoc as jest.Mock).mock.calls[0];
      const submittedData = addDocCall[1];

      expect(submittedData).toMatchObject({
        user_id: 'test-user-123',
        rank: 'OC',
        score: 8,
        total_questions: 10,
        accuracy: 80,
        total_time: 45.5,
        average_time: 4.55,
        session_id: 'practice-1735906800000',
      });
      expect(submittedData.completed_at).toBeDefined();
      expect(submittedData.created_at).toBeDefined();
    });

    it('should reject submission with invalid user', async () => {
      const invalidUser = null as any;

      const result = await service.submitPracticeResult(invalidUser, mockPracticeSummary);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User authentication required');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should reject submission with missing user_id', async () => {
      const userWithoutId = { ...mockUser, user_id: '' };

      const result = await service.submitPracticeResult(userWithoutId, mockPracticeSummary);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User authentication required');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should reject submission with invalid score (negative)', async () => {
      const invalidSummary = { ...mockPracticeSummary, correctAnswers: -5 };

      const result = await service.submitPracticeResult(mockUser, invalidSummary);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation failed');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should reject submission with score exceeding total questions', async () => {
      const invalidSummary = { ...mockPracticeSummary, correctAnswers: 15, totalQuestions: 10 };

      const result = await service.submitPracticeResult(mockUser, invalidSummary);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation failed');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should handle permission denied error', async () => {
      const permissionError = { code: 'permission-denied', message: 'Permission denied' };
      (addDoc as jest.Mock).mockRejectedValue(permissionError);

      const result = await service.submitPracticeResult(mockUser, mockPracticeSummary);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Permission denied');
    });

    it('should handle invalid argument error', async () => {
      const invalidArgError = { code: 'invalid-argument', message: 'Invalid data' };
      (addDoc as jest.Mock).mockRejectedValue(invalidArgError);

      const result = await service.submitPracticeResult(mockUser, mockPracticeSummary);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid data format');
    });

    it('should handle network unavailable error', async () => {
      const unavailableError = { code: 'unavailable', message: 'Network error' };
      (addDoc as jest.Mock).mockRejectedValue(unavailableError);

      const result = await service.submitPracticeResult(mockUser, mockPracticeSummary);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Unknown error');
      (addDoc as jest.Mock).mockRejectedValue(genericError);

      const result = await service.submitPracticeResult(mockUser, mockPracticeSummary);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to save practice results');
    });

    it('should submit results with different ranks correctly', async () => {
      const mockDocRef = { id: 'result-456' } as any;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const cpoUser = { ...mockUser, rank: 'CPO1' };
      const result = await service.submitPracticeResult(cpoUser, mockPracticeSummary);

      expect(result.success).toBe(true);
      const addDocCall = (addDoc as jest.Mock).mock.calls[0];
      const submittedData = addDocCall[1];
      expect(submittedData.rank).toBe('CPO1');
    });

    it('should handle perfect score (100% accuracy)', async () => {
      const mockDocRef = { id: 'result-789' } as any;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const perfectSummary = {
        ...mockPracticeSummary,
        correctAnswers: 10,
        totalQuestions: 10,
        accuracy: 100,
      };

      const result = await service.submitPracticeResult(mockUser, perfectSummary);

      expect(result.success).toBe(true);
      const addDocCall = (addDoc as jest.Mock).mock.calls[0];
      const submittedData = addDocCall[1];
      expect(submittedData.accuracy).toBe(100);
      expect(submittedData.score).toBe(10);
    });

    it('should handle zero score', async () => {
      const mockDocRef = { id: 'result-000' } as any;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const zeroSummary = {
        ...mockPracticeSummary,
        correctAnswers: 0,
        accuracy: 0,
      };

      const result = await service.submitPracticeResult(mockUser, zeroSummary);

      expect(result.success).toBe(true);
      const addDocCall = (addDoc as jest.Mock).mock.calls[0];
      const submittedData = addDocCall[1];
      expect(submittedData.score).toBe(0);
      expect(submittedData.accuracy).toBe(0);
    });

    it('should round decimal values to 2 places', async () => {
      const mockDocRef = { id: 'result-decimal' } as any;
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const decimalSummary = {
        sessionId: 'practice-1735906800000',
        totalQuestions: 10,
        correctAnswers: 7,
        accuracy: 75.555555,
        totalTime: 48.888888,
        averageTimePerQuestion: 4.888888,
      };

      const result = await service.submitPracticeResult(mockUser, decimalSummary);

      expect(result.success).toBe(true);
      const addDocCall = (addDoc as jest.Mock).mock.calls[0];
      const submittedData = addDocCall[1];
      expect(submittedData.accuracy).toBe(75.56);
      expect(submittedData.total_time).toBe(48.89);
      expect(submittedData.average_time).toBe(4.89);
    });
  });
});
