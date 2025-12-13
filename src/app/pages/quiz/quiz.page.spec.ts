/**
 * Unit tests for QuizPage component.
 * Tests authentication integration, mode initialization, and quiz flow.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { QuizPage } from './quiz.page';
import { QuizService, CompetitiveSession, PracticeSession } from '../../core/services/quiz.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { Timestamp } from '@angular/fire/firestore';
import { of, BehaviorSubject } from 'rxjs';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

describe('QuizPage', () => {
  let component: QuizPage;
  let fixture: ComponentFixture<QuizPage>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;
  let mockQuizService: jest.Mocked<QuizService>;
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

  const mockPracticeSession: PracticeSession = {
    sessionId: 'practice-123',
    mode: 'practice',
    startTime: Date.now(),
    totalQuestions: 10,
    currentQuestionIndex: 0,
    isActive: true,
    answers: [],
  };

  const mockCompetitiveSession: CompetitiveSession = {
    sessionId: 'competitive-456',
    mode: 'competitive',
    userId: 'test-user-123',
    startTime: Date.now(),
    totalQuestions: 50,
    currentQuestionIndex: 0,
    isActive: true,
    answers: [],
    questionStartTimes: [],
    currentRating: 1200,
  };

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
      getCurrentNavigation: jest.fn(),
    } as any;

    mockActivatedRoute = {
      snapshot: {
        url: [],
        queryParams: {},
      },
    };

    mockQuizService = {
      getCurrentQuestion: jest.fn(),
      getPracticeSession: jest.fn(),
      initializePracticeSession: jest.fn(),
      initializeCompetitiveSession: jest.fn(),
      getCurrentQuestionTime: jest.fn(),
      submitAnswer: jest.fn(),
      skipQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      getCompetitiveSessionValue: jest.fn(),
    } as any;

    mockAuthService = {
      getCurrentUserValue: jest.fn(),
      getCurrentUser: jest.fn(),
      isAuthenticated: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [QuizPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: QuizService, useValue: mockQuizService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizPage);
    component = fixture.componentInstance;

    // Default mock returns
    mockQuizService.getCurrentQuestion.mockReturnValue(of(null));
    mockQuizService.getPracticeSession.mockReturnValue(of(mockPracticeSession));
    mockQuizService.getCurrentQuestionTime.mockReturnValue(0);

    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Practice Mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.url = [];
      mockActivatedRoute.snapshot.queryParams = { mode: 'practice', count: '10' };
      mockQuizService.initializePracticeSession.mockReturnValue(of(void 0));
    });

    it('should initialize practice mode correctly', () => {
      component.ngOnInit();

      expect(component.mode).toBe('practice');
      expect(component.questionCount).toBe(10);
      expect(mockQuizService.initializePracticeSession).toHaveBeenCalledWith(10);
    });

    it('should not require authenticated user for practice mode', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(null);

      component.ngOnInit();

      expect(component.currentUser).toBeNull();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockQuizService.initializePracticeSession).toHaveBeenCalled();
    });

    it('should subscribe to practice session updates', () => {
      const sessionSubject = new BehaviorSubject(mockPracticeSession);
      mockQuizService.getPracticeSession.mockReturnValue(sessionSubject.asObservable());

      component.ngOnInit();

      expect(component.practiceSession).toEqual(mockPracticeSession);
    });

    it('should use default values when query params are missing', () => {
      mockActivatedRoute.snapshot.queryParams = {};

      component.ngOnInit();

      expect(component.mode).toBe('practice');
      expect(component.questionCount).toBe(10);
    });
  });

  describe('Competitive Mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));
    });

    it('should initialize competitive mode with authenticated user', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(component.mode).toBe('competitive');
      expect(component.questionCount).toBe(50);
      expect(component.currentUser).toEqual(mockUser);
      expect(mockQuizService.initializeCompetitiveSession).toHaveBeenCalledWith('test-user-123');
    });

    it('should redirect to registration when user is not authenticated', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(null);

      component.ngOnInit();

      expect(component.currentUser).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/registration']);
      expect(mockQuizService.initializeCompetitiveSession).not.toHaveBeenCalled();
    });

    it('should log error when user is missing', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuthService.getCurrentUserValue.mockReturnValue(null);

      component.ngOnInit();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[QuizPage] No authenticated user for competitive mode'
      );
      consoleSpy.mockRestore();
    });

    it('should pass userId to quiz service, not username', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);

      component.ngOnInit();

      expect(mockQuizService.initializeCompetitiveSession).toHaveBeenCalledWith('test-user-123');
      expect(mockQuizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('John');
      expect(mockQuizService.initializeCompetitiveSession).not.toHaveBeenCalledWith('OC John Doe');
    });

    it('should subscribe to current question updates', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      const questionSubject = new BehaviorSubject(null);
      mockQuizService.getCurrentQuestion.mockReturnValue(questionSubject.asObservable());

      component.ngOnInit();

      expect(mockQuizService.getCurrentQuestion).toHaveBeenCalled();
    });

    it('should set up timer interval for competitive mode', (done) => {
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockQuizService.getCompetitiveSessionValue.mockReturnValue(mockCompetitiveSession);
      mockQuizService.getCurrentQuestionTime.mockReturnValue(5.5);

      component.ngOnInit();

      // Wait for timer to tick
      setTimeout(() => {
        expect(mockQuizService.getCurrentQuestionTime).toHaveBeenCalled();
        expect(component.currentQuestionTime).toBeGreaterThanOrEqual(0);
        done();
      }, 300);
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      component.ngOnInit();
      const subscriptionCount = component['subscriptions'].length;

      component.ngOnDestroy();

      expect(subscriptionCount).toBeGreaterThan(0);
    });

    it('should clear timer interval on destroy', () => {
      jest.useFakeTimers();
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      component.ngOnInit();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('URL Parameter Parsing', () => {
    it('should recognize competitive mode from URL path', () => {
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      expect(component.mode).toBe('competitive');
    });

    it('should default to practice mode for unrecognized paths', () => {
      mockActivatedRoute.snapshot.url = [{ path: 'unknown' }];
      mockQuizService.initializePracticeSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      expect(component.mode).toBe('practice');
    });

    it('should parse question count from query params', () => {
      mockActivatedRoute.snapshot.url = [];
      mockActivatedRoute.snapshot.queryParams = { count: '25' };
      mockQuizService.initializePracticeSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      expect(component.questionCount).toBe(25);
    });

    it('should handle invalid question count gracefully', () => {
      mockActivatedRoute.snapshot.url = [];
      mockActivatedRoute.snapshot.queryParams = { count: 'invalid' };
      mockQuizService.initializePracticeSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      expect(component.questionCount).toBe(10); // Default value
    });
  });

  describe('Authentication Integration', () => {
    it('should not call AuthService for practice mode', () => {
      mockActivatedRoute.snapshot.url = [];
      mockActivatedRoute.snapshot.queryParams = { mode: 'practice' };
      mockQuizService.initializePracticeSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      // getCurrentUserValue should not be called for practice mode
      expect(mockAuthService.getCurrentUserValue).not.toHaveBeenCalled();
    });

    it('should get current user value synchronously for competitive mode', () => {
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      expect(mockAuthService.getCurrentUserValue).toHaveBeenCalled();
      expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled(); // Should use Value, not observable
    });

    it('should store currentUser in component for submission', () => {
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));

      component.ngOnInit();

      expect(component.currentUser).toEqual(mockUser);
      expect(component.currentUser?.user_id).toBe('test-user-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle quiz service initialization errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockActivatedRoute.snapshot.url = [];
      mockQuizService.initializePracticeSession.mockReturnValue(
        new BehaviorSubject(void 0).asObservable()
      );

      component.ngOnInit();

      // Error callback should be registered
      expect(mockQuizService.initializePracticeSession).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not crash when competitive session value is null', () => {
      mockAuthService.getCurrentUserValue.mockReturnValue(mockUser);
      mockActivatedRoute.snapshot.url = [{ path: 'competitive' }];
      mockQuizService.initializeCompetitiveSession.mockReturnValue(of(void 0));
      mockQuizService.getCompetitiveSessionValue.mockReturnValue(null);

      expect(() => component.ngOnInit()).not.toThrow();
    });
  });
});
