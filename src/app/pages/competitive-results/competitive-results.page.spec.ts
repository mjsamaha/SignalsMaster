/**
 * Unit tests for CompetitiveResultsPage component.
 * Tests authentication integration, score submission, and navigation.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { CompetitiveResultsPage } from './competitive-results.page';
import { LeaderboardService, SubmissionResponse } from '../../core/services/leaderboard.service';
import { AuthService } from '../../core/services/auth.service';
import { CompetitiveResults } from '../../core/services/quiz.service';
import { User } from '../../core/models/user.model';
import { Timestamp } from '@angular/fire/firestore';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

describe('CompetitiveResultsPage', () => {
  let component: CompetitiveResultsPage;
  let fixture: ComponentFixture<CompetitiveResultsPage>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;
  let mockLeaderboardService: jest.Mocked<LeaderboardService>;
  let mockAuthService: jest.Mocked<AuthService>;

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
    answers: [
      {
        questionId: 'q1',
        questionNumber: 1,
        flagId: 'A',
        timeSpent: 5.2,
        selectedAnswerId: 'answer-alpha',
        correctAnswerId: 'answer-alpha',
        isCorrect: true,
        flag: { id: 'A', name: 'Alpha', meaning: 'Test flag', category: 'letters', imagePath: 'assets/flags/letters/A.png' } as any,
      },
    ],
  };

  const mockSuccessResponse: SubmissionResponse = {
    success: true,
    message: 'Score submitted successfully!',
  };

  const mockErrorResponse: SubmissionResponse = {
    success: false,
    message: 'Failed to submit score',
  };

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
      getCurrentNavigation: jest.fn(() => ({
        extras: {
          state: { results: mockResults },
        },
      })),
    } as any;

    mockActivatedRoute = {
      snapshot: {},
    };

    mockLeaderboardService = {
      submitScore: jest.fn(),
      getLeaderboard: jest.fn(),
    } as any;

    mockAuthService = {
      getCurrentUser: jest.fn(),
      isAuthenticated: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [CompetitiveResultsPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LeaderboardService, useValue: mockLeaderboardService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompetitiveResultsPage);
    component = fixture.componentInstance;

    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should get authenticated user on init', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should extract results from navigation state', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(component.results).toEqual(mockResults);
    });

    it('should redirect to best-signaller when results are missing', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: {} },
      } as any);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/best-signaller']);
    });

    it('should redirect to best-signaller when navigation state is null', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockRouter.getCurrentNavigation.mockReturnValue(null);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/best-signaller']);
    });

    it('should redirect to registration when user is not authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration']);
    });
  });

  describe('Score Submission', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.ngOnInit();
    });

    it('should submit score with user and results', async () => {
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      expect(mockLeaderboardService.submitScore).toHaveBeenCalledWith(mockUser, mockResults);
    });

    it('should show success message on successful submission', async () => {
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      expect(component.hasSubmitted).toBe(true);
      expect(component.submissionSuccess).toBe(true);
      expect(component.submissionMessage).toBe('Score submitted successfully!');
      expect(component.isSubmitting).toBe(false);
    });

    it('should show error message on failed submission', async () => {
      mockLeaderboardService.submitScore.mockResolvedValue(mockErrorResponse);

      await component.submitScore();

      expect(component.hasSubmitted).toBe(true);
      expect(component.submissionSuccess).toBe(false);
      expect(component.submissionMessage).toBe('Failed to submit score');
      expect(component.isSubmitting).toBe(false);
    });

    it('should handle submission errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLeaderboardService.submitScore.mockRejectedValue(new Error('Network error'));

      await component.submitScore();

      expect(component.submissionSuccess).toBe(false);
      expect(component.submissionMessage).toContain('error');
      expect(component.isSubmitting).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not submit if already submitting', async () => {
      component.isSubmitting = true;
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      expect(mockLeaderboardService.submitScore).not.toHaveBeenCalled();
    });

    it('should not submit if results are missing', async () => {
      component.results = null;
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      expect(mockLeaderboardService.submitScore).not.toHaveBeenCalled();
    });

    it('should not submit if user is not authenticated', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      component.currentUser = null;
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      expect(mockLeaderboardService.submitScore).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CompetitiveResultsPage] Cannot submit score without authenticated user'
      );
      consoleSpy.mockRestore();
    });

    it('should set isSubmitting flag during submission', async () => {
      let submittingDuringCall = false;
      mockLeaderboardService.submitScore.mockImplementation(async () => {
        submittingDuringCall = component.isSubmitting;
        return mockSuccessResponse;
      });

      await component.submitScore();

      expect(submittingDuringCall).toBe(true);
      expect(component.isSubmitting).toBe(false);
    });

    it('should clear submission message before submitting', async () => {
      component.submissionMessage = 'Old message';
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      expect(component.submissionMessage).not.toBe('Old message');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.ngOnInit();
    });

    it('should navigate to leaderboard', () => {
      component.goToLeaderboard();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/leaderboard']);
    });

    it('should navigate to best signaller', () => {
      component.tryAgain();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/best-signaller']);
    });
  });

  describe('UI Helpers', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.ngOnInit();
    });

    it('should toggle questions visibility', () => {
      expect(component.showAllQuestions).toBe(false);

      component.toggleQuestions();
      expect(component.showAllQuestions).toBe(true);

      component.toggleQuestions();
      expect(component.showAllQuestions).toBe(false);
    });

    it('should format time correctly', () => {
      expect(component.formatTime(65)).toBe('01:05');
      expect(component.formatTime(125)).toBe('02:05');
      expect(component.formatTime(5)).toBe('00:05');
      expect(component.formatTime(0)).toBe('00:00');
    });

    it('should generate correct flag image path', () => {
      // Letter flags
      expect(component.getFlagImagePath('A')).toContain('letters/A.png');

      // Special pennants
      expect(component.getFlagImagePath('code-pennant')).toContain('special-pennants/code-pennant');

      // Pennant numbers
      expect(component.getFlagImagePath('p1')).toContain('pennnant-numbers/p1');
    });
  });

  describe('Results Display', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.ngOnInit();
    });

    it('should have results available after init', () => {
      expect(component.results).not.toBeNull();
      expect(component.results?.userId).toBe('test-user-123');
    });

    it('should expose Math for template calculations', () => {
      expect(component.Math).toBe(Math);
    });

    it('should show correct question count', () => {
      expect(component.results?.totalQuestions).toBe(50);
    });

    it('should show correct answers count', () => {
      expect(component.results?.correctAnswers).toBe(42);
    });

    it('should calculate accuracy percentage', () => {
      expect(component.results?.accuracy).toBe(84);
    });

    it('should show rating information', () => {
      expect(component.results?.finalRating).toBe(1350);
      expect(component.results?.baseRating).toBe(1200);
      expect(component.results?.speedBonus).toBe(150);
    });
  });

  describe('Authentication Integration', () => {
    it('should use getCurrentUser() for authentication', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should pass complete User object to leaderboard service', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.ngOnInit();
      mockLeaderboardService.submitScore.mockResolvedValue(mockSuccessResponse);

      await component.submitScore();

      const [userArg, resultsArg] = mockLeaderboardService.submitScore.mock.calls[0];
      expect(userArg).toEqual(mockUser);
      expect(userArg).toHaveProperty('user_id');
      expect(userArg).toHaveProperty('rank');
      expect(userArg).toHaveProperty('first_name');
      expect(userArg).toHaveProperty('last_name');
      expect(resultsArg).toEqual(mockResults);
    });

    it('should ensure results contain userId not username', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.ngOnInit();

      expect(component.results?.userId).toBeDefined();
      expect(component.results).not.toHaveProperty('username');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero correct answers', () => {
      const zeroResults: CompetitiveResults = {
        ...mockResults,
        correctAnswers: 0,
        accuracy: 0,
      };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { results: zeroResults } },
      } as any);
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(component.results?.accuracy).toBe(0);
    });

    it('should handle perfect score', () => {
      const perfectResults: CompetitiveResults = {
        ...mockResults,
        correctAnswers: 50,
        accuracy: 100,
      };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { results: perfectResults } },
      } as any);
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(component.results?.accuracy).toBe(100);
    });

    it('should handle lower final ratings', () => {
      const lowerResults: CompetitiveResults = {
        ...mockResults,
        baseRating: 1200,
        speedBonus: -50,
        finalRating: 1150,
      };
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { results: lowerResults } },
      } as any);
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(component.results?.finalRating).toBe(1150);
    });
  });
});
