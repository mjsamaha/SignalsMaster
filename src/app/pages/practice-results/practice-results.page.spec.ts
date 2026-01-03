/**
 * Unit tests for PracticeResultsPage component.
 * Tests authentication integration, auto-submission, retry logic, and navigation.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PracticeResultsPage } from './practice-results.page';
import { PracticeResultsService, PracticeSubmissionResponse } from '../../core/services/practice-results.service';
import { AuthService } from '../../core/services/auth.service';
import { PracticeSummary } from '../../core/services/quiz.service';
import { User } from '../../core/models/user.model';
import { Timestamp } from '@angular/fire/firestore';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

describe('PracticeResultsPage', () => {
  let component: PracticeResultsPage;
  let fixture: ComponentFixture<PracticeResultsPage>;
  let mockRouter: jest.Mocked<Router>;
  let mockPracticeResultsService: jest.Mocked<PracticeResultsService>;
  let mockAuthService: jest.Mocked<AuthService>;

  const mockUser: User = {
    user_id: 'test-user-123',
    rank: 'OC',
    first_name: 'John',
    last_name: 'Doe',
    device_id: 'device-uuid-12345',
    created_date: Timestamp.now(),
    last_login: Timestamp.now(),
  };

  const mockSummary: PracticeSummary = {
    sessionId: 'practice-1735906800000',
    totalQuestions: 10,
    correctAnswers: 8,
    accuracy: 80,
    totalTime: 45.5,
    averageTimePerQuestion: 4.55,
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

  const mockSuccessResponse: PracticeSubmissionResponse = {
    success: true,
    message: 'Practice results saved successfully!',
    resultId: 'result-123',
  };

  const mockErrorResponse: PracticeSubmissionResponse = {
    success: false,
    message: 'Failed to save results',
  };

  beforeEach(async () => {
    // Mock history.state for navigation
    Object.defineProperty(window, 'history', {
      value: {
        state: { summary: mockSummary },
      },
      writable: true,
    });

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    mockPracticeResultsService = {
      submitPracticeResult: jest.fn(),
    } as any;

    mockAuthService = {
      getCurrentUser: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [PracticeResultsPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: PracticeResultsService, useValue: mockPracticeResultsService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticeResultsPage);
    component = fixture.componentInstance;

    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should get authenticated user on init', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should extract summary from navigation state', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      component.ngOnInit();

      expect(component.summary).toEqual(mockSummary);
    });

    it('should redirect to registration when user is not authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration']);
    });

    it('should redirect to home when summary is missing', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      Object.defineProperty(window, 'history', {
        value: { state: {} },
        writable: true,
      });

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });

    it('should auto-submit results on init with valid data', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      component.ngOnInit();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPracticeResultsService.submitPracticeResult).toHaveBeenCalledWith(mockUser, mockSummary);
    });
  });

  describe('Results Submission', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      component.summary = mockSummary;
      component.currentUser = mockUser;
    });

    it('should submit results with user and summary', async () => {
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      await component.submitResults();

      expect(mockPracticeResultsService.submitPracticeResult).toHaveBeenCalledWith(mockUser, mockSummary);
    });

    it('should show success message on successful submission', async () => {
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      await component.submitResults();

      expect(component.hasSubmitted).toBe(true);
      expect(component.submissionSuccess).toBe(true);
      expect(component.submissionMessage).toBe('Practice results saved successfully!');
      expect(component.isSubmitting).toBe(false);
    });

    it('should show error message on failed submission', async () => {
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockErrorResponse);

      await component.submitResults();

      expect(component.submissionSuccess).toBe(false);
      expect(component.submissionMessage).toBe('Failed to save results');
      expect(component.isSubmitting).toBe(false);
    });

    it('should handle submission errors with network error message', async () => {
      mockPracticeResultsService.submitPracticeResult.mockRejectedValue(new Error('Network error'));

      await component.submitResults();

      expect(component.submissionSuccess).toBe(false);
      expect(component.submissionMessage).toBe('Network error. Please try again.');
      expect(component.isSubmitting).toBe(false);
    });

    it('should set isSubmitting to true during submission', async () => {
      let submitResolve: any;
      const submitPromise = new Promise<PracticeSubmissionResponse>(resolve => {
        submitResolve = resolve;
      });
      mockPracticeResultsService.submitPracticeResult.mockReturnValue(submitPromise);

      const submitPromiseResult = component.submitResults();

      expect(component.isSubmitting).toBe(true);

      submitResolve(mockSuccessResponse);
      await submitPromiseResult;

      expect(component.isSubmitting).toBe(false);
    });

    it('should not submit if summary is missing', async () => {
      component.summary = null;

      await component.submitResults();

      expect(mockPracticeResultsService.submitPracticeResult).not.toHaveBeenCalled();
    });

    it('should not submit if user is missing', async () => {
      component.currentUser = null;

      await component.submitResults();

      expect(mockPracticeResultsService.submitPracticeResult).not.toHaveBeenCalled();
    });

    it('should not submit if already submitting', async () => {
      component.isSubmitting = true;

      await component.submitResults();

      expect(mockPracticeResultsService.submitPracticeResult).not.toHaveBeenCalled();
    });

    it('should not submit if already submitted', async () => {
      component.hasSubmitted = true;

      await component.submitResults();

      expect(mockPracticeResultsService.submitPracticeResult).not.toHaveBeenCalled();
    });
  });

  describe('Retry Submission', () => {
    beforeEach(() => {
      component.currentUser = mockUser;
      component.summary = mockSummary;
    });

    it('should reset states and retry submission', async () => {
      component.hasSubmitted = true;
      component.isSubmitting = false;
      component.submissionMessage = 'Previous error';
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      component.retrySubmission();

      expect(component.hasSubmitted).toBe(false);
      expect(component.isSubmitting).toBe(false);
      expect(component.submissionMessage).toBe('');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPracticeResultsService.submitPracticeResult).toHaveBeenCalled();
    });

    it('should call submitResults after resetting state', async () => {
      const submitSpy = jest.spyOn(component, 'submitResults');
      mockPracticeResultsService.submitPracticeResult.mockResolvedValue(mockSuccessResponse);

      component.retrySubmission();

      expect(submitSpy).toHaveBeenCalled();
    });
  });

  describe('Display Methods', () => {
    beforeEach(() => {
      component.summary = mockSummary;
    });

    it('should return motivational message for high accuracy', () => {
      component.summary!.accuracy = 95;

      const message = component.getMotivationalMessage();

      expect(message).toContain('Excellent work');
    });

    it('should return motivational message for medium accuracy', () => {
      component.summary!.accuracy = 78;

      const message = component.getMotivationalMessage();

      expect(message).toContain('Great job');
    });

    it('should return motivational message for low accuracy', () => {
      component.summary!.accuracy = 45;

      const message = component.getMotivationalMessage();

      expect(message).toContain('Keep practicing');
    });

    it('should format time correctly', () => {
      const formatted = component.formatTime(125);

      expect(formatted).toBe('2:05');
    });

    it('should format time with leading zeros', () => {
      const formatted = component.formatTime(65);

      expect(formatted).toBe('1:05');
    });

    it('should return correct accuracy color for high score', () => {
      component.summary!.accuracy = 85;

      const color = component.getAccuracyColor();

      expect(color).toBe('success');
    });

    it('should return correct accuracy color for medium score', () => {
      component.summary!.accuracy = 60;

      const color = component.getAccuracyColor();

      expect(color).toBe('warning');
    });

    it('should return correct accuracy color for low score', () => {
      component.summary!.accuracy = 40;

      const color = component.getAccuracyColor();

      expect(color).toBe('danger');
    });

    it('should return correct performance tier for excellent', () => {
      component.summary!.accuracy = 92;

      const tier = component.getPerformanceTier();

      expect(tier).toBe('excellent');
    });

    it('should return correct performance badge', () => {
      component.summary!.accuracy = 92;

      const badge = component.getPerformanceBadge();

      expect(badge).toContain('Excellent');
    });

    it('should return visible questions limited to 5 by default', () => {
      const answers = Array(10).fill(mockSummary.answers[0]);
      component.summary!.answers = answers;
      component.showAllQuestions = false;

      const visible = component.getVisibleQuestions();

      expect(visible.length).toBe(5);
    });

    it('should return all questions when showAllQuestions is true', () => {
      const answers = Array(10).fill(mockSummary.answers[0]);
      component.summary!.answers = answers;
      component.showAllQuestions = true;

      const visible = component.getVisibleQuestions();

      expect(visible.length).toBe(10);
    });

    it('should toggle showAllQuestions state', () => {
      component.showAllQuestions = false;

      component.toggleShowAllQuestions();

      expect(component.showAllQuestions).toBe(true);

      component.toggleShowAllQuestions();

      expect(component.showAllQuestions).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to practice-mode on tryAgain', () => {
      component.tryAgain();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/practice-mode']);
    });

    it('should navigate to home on goHome', () => {
      component.goHome();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null summary gracefully in display methods', () => {
      component.summary = null;

      expect(component.getMotivationalMessage()).toBe('');
      expect(component.getAccuracyColor()).toBe('medium');
      expect(component.getPerformanceTier()).toBe('fair');
      expect(component.getVisibleQuestions()).toEqual([]);
    });

    it('should handle zero time correctly', () => {
      const formatted = component.formatTime(0);

      expect(formatted).toBe('0:00');
    });

    it('should handle large time values correctly', () => {
      const formatted = component.formatTime(3665); // 61 minutes, 5 seconds

      expect(formatted).toBe('61:05');
    });
  });
});
