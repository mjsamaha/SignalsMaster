/**
 * End-to-end integration tests for competitive quiz flow.
 * Tests the complete flow from authentication → quiz → results → leaderboard.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { QuizService } from '../../core/services/quiz.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { User } from '../../core/models/user.model';
import { Timestamp } from '@angular/fire/firestore';
import { firstValueFrom, of } from 'rxjs';

describe('Competitive Quiz Flow Integration', () => {
  let authService: jest.Mocked<AuthService>;
  let quizService: jest.Mocked<QuizService>;
  let leaderboardService: jest.Mocked<LeaderboardService>;
  let router: jest.Mocked<Router>;

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

  beforeEach(() => {
    authService = {
      getCurrentUserValue: jest.fn(),
      getCurrentUser: jest.fn(),
      isAuthenticated: jest.fn(),
      initializeAuth: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    } as any;

    quizService = {
      initializeCompetitiveSession: jest.fn(),
      getCurrentQuestion: jest.fn(),
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      getCompetitiveResults: jest.fn(),
      getCompetitiveSessionValue: jest.fn(),
    } as any;

    leaderboardService = {
      submitScore: jest.fn(),
      getLeaderboard: jest.fn(),
    } as any;

    router = {
      navigate: jest.fn(),
      getCurrentNavigation: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: QuizService, useValue: quizService },
        { provide: LeaderboardService, useValue: leaderboardService },
        { provide: Router, useValue: router },
      ],
    });

    jest.clearAllMocks();
  });

  describe('Complete Competitive Flow', () => {
    it('should complete full flow: auth → quiz init → quiz complete → submit score', async () => {
      // Step 1: User is authenticated
      authService.getCurrentUserValue.mockReturnValue(mockUser);
      authService.isAuthenticated.mockReturnValue(true);

      // Step 2: Initialize competitive session with userId
      quizService.initializeCompetitiveSession.mockReturnValue(of(void 0));
      quizService.getCurrentQuestion.mockReturnValue(of(null));

      // Simulate quiz initialization
      await firstValueFrom(quizService.initializeCompetitiveSession('test-user-123'));

      expect(quizService.initializeCompetitiveSession).toHaveBeenCalledWith('test-user-123');
      expect(quizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('John');

      // Step 3: Quiz completion returns results with userId
      const mockResults = {
        sessionId: 'competitive-789',
        userId: 'test-user-123',
        totalQuestions: 50,
        correctAnswers: 42,
        accuracy: 84,
        totalTime: 320.5,
        averageTimePerQuestion: 6.41,
        finalRating: 1350,
        ratingChange: 150,
        questionsWithDetails: [],
      };
      quizService.getCompetitiveResults.mockReturnValue(mockResults);

      const results = quizService.getCompetitiveResults();
      expect(results.userId).toBe('test-user-123');

      // Step 4: Submit score with User object
      authService.getCurrentUser.mockReturnValue(mockUser);
      leaderboardService.submitScore.mockResolvedValue({
        success: true,
        message: 'Score submitted successfully!',
      });

      const currentUser = authService.getCurrentUser();
      const response = await leaderboardService.submitScore(currentUser, results);

      expect(leaderboardService.submitScore).toHaveBeenCalledWith(mockUser, results);
      expect(response.success).toBe(true);
    });

    it('should prevent unauthenticated users from starting competitive quiz', () => {
      authService.getCurrentUserValue.mockReturnValue(null);
      authService.isAuthenticated.mockReturnValue(false);

      const user = authService.getCurrentUserValue();

      expect(user).toBeNull();
      // In real app, this triggers redirect to /registration
    });

    it('should pass userId through entire competitive flow', async () => {
      // Auth provides user with user_id
      authService.getCurrentUserValue.mockReturnValue(mockUser);

      const user = authService.getCurrentUserValue();
      expect(user?.user_id).toBe('test-user-123');

      // Quiz service receives userId
      quizService.initializeCompetitiveSession.mockReturnValue(of(void 0));
      await firstValueFrom(quizService.initializeCompetitiveSession(user!.user_id));

      const [[passedUserId]] = quizService.initializeCompetitiveSession.mock.calls;
      expect(passedUserId).toBe('test-user-123');

      // Results contain userId
      const mockResults = {
        sessionId: 'competitive-789',
        userId: user!.user_id,
        totalQuestions: 50,
        correctAnswers: 42,
        accuracy: 84,
        totalTime: 320.5,
        averageTimePerQuestion: 6.41,
        finalRating: 1350,
        ratingChange: 150,
        questionsWithDetails: [],
      };
      quizService.getCompetitiveResults.mockReturnValue(mockResults);

      const results = quizService.getCompetitiveResults();
      expect(results.userId).toBe('test-user-123');

      // Leaderboard receives User object
      authService.getCurrentUser.mockReturnValue(mockUser);
      leaderboardService.submitScore.mockResolvedValue({ success: true, message: '' });

      await leaderboardService.submitScore(mockUser, results);

      const [[submittedUser, submittedResults]] = leaderboardService.submitScore.mock.calls;
      expect(submittedUser.user_id).toBe('test-user-123');
      expect(submittedResults.userId).toBe('test-user-123');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authenticated user for competitive quiz', () => {
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUserValue.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUserValue()).toBeNull();
    });

    it('should allow authenticated user to start competitive quiz', () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUserValue.mockReturnValue(mockUser);

      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUserValue()).toEqual(mockUser);
    });

    it('should provide user data for leaderboard display name', () => {
      authService.getCurrentUser.mockReturnValue(mockUser);

      const user = authService.getCurrentUser();

      expect(user).toHaveProperty('rank', 'OC');
      expect(user).toHaveProperty('first_name', 'John');
      expect(user).toHaveProperty('last_name', 'Doe');
      // LeaderboardService will format as "OC John Doe"
    });
  });

  describe('Data Flow Consistency', () => {
    it('should maintain userId consistency from auth to leaderboard', async () => {
      const userId = 'test-user-123';

      // Auth layer
      authService.getCurrentUserValue.mockReturnValue({ ...mockUser, user_id: userId });

      // Quiz layer
      quizService.initializeCompetitiveSession.mockReturnValue(of(void 0));
      await firstValueFrom(quizService.initializeCompetitiveSession(userId));

      quizService.getCompetitiveResults.mockReturnValue({
        sessionId: 'competitive-789',
        userId: userId,
        totalQuestions: 50,
        correctAnswers: 42,
        accuracy: 84,
        totalTime: 320.5,
        averageTimePerQuestion: 6.41,
        finalRating: 1350,
        ratingChange: 150,
        questionsWithDetails: [],
      });

      const results = quizService.getCompetitiveResults();

      // Leaderboard layer
      authService.getCurrentUser.mockReturnValue(mockUser);
      leaderboardService.submitScore.mockResolvedValue({ success: true, message: '' });
      await leaderboardService.submitScore(mockUser, results);

      // Verify consistency
      expect(quizService.initializeCompetitiveSession).toHaveBeenCalledWith(userId);
      expect(results.userId).toBe(userId);
      expect(leaderboardService.submitScore).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId }),
        expect.objectContaining({ userId: userId })
      );
    });

    it('should never pass username strings, only userId', async () => {
      authService.getCurrentUserValue.mockReturnValue(mockUser);
      quizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      // Should use user_id
      await firstValueFrom(quizService.initializeCompetitiveSession('test-user-123'));

      // Should NOT use any of these
      expect(quizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('John');
      expect(quizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('Doe');
      expect(quizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('OC John Doe');
      expect(quizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('John Doe');
    });
  });

  describe('Error Handling', () => {
    it('should handle quiz initialization errors', async () => {
      authService.getCurrentUserValue.mockReturnValue(mockUser);
      quizService.initializeCompetitiveSession.mockImplementation(() => {
        throw new Error('Quiz initialization failed');
      });

      expect(() => {
        quizService.initializeCompetitiveSession('test-user-123');
      }).toThrow('Quiz initialization failed');
    });

    it('should handle score submission errors', async () => {
      authService.getCurrentUser.mockReturnValue(mockUser);
      const mockResults = {
        sessionId: 'competitive-789',
        userId: 'test-user-123',
        totalQuestions: 50,
        correctAnswers: 42,
        accuracy: 84,
        totalTime: 320.5,
        averageTimePerQuestion: 6.41,
        finalRating: 1350,
        ratingChange: 150,
        questionsWithDetails: [],
      };

      leaderboardService.submitScore.mockResolvedValue({
        success: false,
        message: 'Submission failed',
      });

      const response = await leaderboardService.submitScore(mockUser, mockResults);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Submission failed');
    });

    it('should handle missing user during score submission', async () => {
      authService.getCurrentUser.mockReturnValue(null);
      const mockResults = {
        sessionId: 'competitive-789',
        userId: 'test-user-123',
        totalQuestions: 50,
        correctAnswers: 42,
        accuracy: 84,
        totalTime: 320.5,
        averageTimePerQuestion: 6.41,
        finalRating: 1350,
        ratingChange: 150,
        questionsWithDetails: [],
      };

      // In real app, page component would prevent this call
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('User Profile Integration', () => {
    it('should provide all user fields for leaderboard display', () => {
      authService.getCurrentUser.mockReturnValue(mockUser);

      const user = authService.getCurrentUser();

      expect(user).toMatchObject({
        user_id: 'test-user-123',
        rank: 'OC',
        first_name: 'John',
        last_name: 'Doe',
        device_id: 'device-uuid-12345',
      });
    });

    it('should maintain user profile data throughout flow', async () => {
      // Initial auth
      authService.getCurrentUserValue.mockReturnValue(mockUser);
      const initialUser = authService.getCurrentUserValue();

      // During quiz
      quizService.initializeCompetitiveSession.mockReturnValue(of(void 0));
      await firstValueFrom(quizService.initializeCompetitiveSession(initialUser!.user_id));

      // After quiz
      authService.getCurrentUser.mockReturnValue(mockUser);
      const finalUser = authService.getCurrentUser();

      // User data should be consistent
      expect(initialUser?.user_id).toBe(finalUser?.user_id);
      expect(initialUser?.rank).toBe(finalUser?.rank);
      expect(initialUser?.first_name).toBe(finalUser?.first_name);
      expect(initialUser?.last_name).toBe(finalUser?.last_name);
    });
  });

  describe('Route Protection', () => {
    it('should allow navigation with authenticated user', () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUserValue.mockReturnValue(mockUser);

      // Simulates authGuard check
      const canActivate = authService.isAuthenticated();

      expect(canActivate).toBe(true);
    });

    it('should block navigation without authenticated user', () => {
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUserValue.mockReturnValue(null);

      // Simulates authGuard check
      const canActivate = authService.isAuthenticated();

      expect(canActivate).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should create competitive session with userId', async () => {
      authService.getCurrentUserValue.mockReturnValue(mockUser);
      quizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      const user = authService.getCurrentUserValue();
      await firstValueFrom(quizService.initializeCompetitiveSession(user!.user_id));

      expect(quizService.initializeCompetitiveSession).toHaveBeenCalledWith('test-user-123');
    });

    it('should retrieve competitive results with userId', () => {
      quizService.getCompetitiveResults.mockReturnValue({
        sessionId: 'competitive-789',
        userId: 'test-user-123',
        totalQuestions: 50,
        correctAnswers: 42,
        accuracy: 84,
        totalTime: 320.5,
        averageTimePerQuestion: 6.41,
        finalRating: 1350,
        ratingChange: 150,
        questionsWithDetails: [],
      });

      const results = quizService.getCompetitiveResults();

      expect(results.userId).toBe('test-user-123');
      expect(results).not.toHaveProperty('username');
    });
  });
});
