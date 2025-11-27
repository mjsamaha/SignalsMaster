/**
 * QuizPage manages the main quiz flow for both practice and competitive modes.
 * Handles question display, answer selection, feedback, timing, and results.
 */
@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonText,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonModal
]
})
export class QuizPage implements OnInit, OnDestroy {
  /**
   * Quiz mode: 'practice' or 'competitive'.
   */
  mode: 'practice' | 'competitive' = 'practice';
  /**
   * Number of questions in the quiz session.
   */
  questionCount: number = 10;
  /**
   * Username for competitive mode.
   */
  username: string = '';

  /**
   * Current question being displayed.
   */
  currentQuestion: Question | null = null;
  /**
   * Selected answer ID for current question.
   */
  selectedAnswerId: string | null = null;
  /**
   * Controls feedback visibility after answer selection.
   */
  feedbackVisible = false;
  /**
   * Indicates if the selected answer was correct.
   */
  feedbackCorrect = false;
  /**
   * Enables/disables the next button after answering.
   */
  nextButtonEnabled = false;
  /**
   * Indicates if the quiz session is completed.
   */
  quizCompleted = false;
  /**
   * Stores quiz results after completion.
   */
  quizResults: QuizResults | null = null;
  /**
   * Controls image loading state for questions.
   */
  imageLoading = true;
  /**
   * Stores quiz state for progress tracking.
   */
  quizState: QuizState | null = null;

  // Practice mode properties
  /**
   * Practice session data for practice mode.
   */
  practiceSession: PracticeSession | null = null;

  // Competitive mode properties (reuse for UI compatibility)
  /**
   * Competitive session data (using PracticeSession interface for UI compatibility).
   */
  competitiveSession: PracticeSession | null = null;

  /**
   * Time spent on current question in seconds.
   */
  currentQuestionTime: number = 0;
  /**
   * Reference to timer interval for question timing.
   */
  timerInterval: any;
  /**
   * Timestamp when current question started.
   */
  questionStartTime: number = 0;

  // UI state
  /**
   * Controls visibility of restart confirmation dialog.
   */
  showRestartConfirm = false;

  /**
   * Subscriptions for observables to clean up on destroy.
   */
  private subscriptions: Subscription[] = [];

  /**
   * Injects route and router for navigation and quiz service for data.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit() {
    // Get route parameters - handle new format: /quiz/competitive/username
    const urlSegments = this.route.snapshot.url;
    const firstSegment = urlSegments[0]?.path;

    if (firstSegment === 'competitive' && urlSegments.length > 1) {
      // Competitive mode: /quiz/competitive/username
      this.mode = 'competitive';
      this.username = urlSegments[1]?.path || '';
      this.questionCount = 50; // Fixed for competitive mode
    } else {
      // Practice mode: check query params for compatibility
      const params = this.route.snapshot.queryParams;
      this.mode = params['mode'] || 'practice';
      this.questionCount = parseInt(params['count'], 10) || 10;
      this.username = params['username'] || ''; // For backward compatibility
    }

    if (this.mode === 'practice') {
      this.initializePracticeMode();
    } else {
      this.initializeCompetitiveMode();
    }
  }

  private initializePracticeMode() {
    // Subscribe to practice session
    const sessionSub = this.quizService.getPracticeSession().subscribe(session => {
      this.practiceSession = session;
    });
    this.subscriptions.push(sessionSub);

    // Subscribe to current question
    const questionSub = this.quizService.getCurrentQuestion().subscribe(question => {
      this.currentQuestion = question;
      this.selectedAnswerId = null;
      this.feedbackVisible = false;
      this.nextButtonEnabled = false;
      this.imageLoading = true;

      // Start timer for new question
      if (question) {
        this.startQuestionTimer();
      }
    });
    this.subscriptions.push(questionSub);

    // Initialize practice session
    this.quizService.initializePracticeSession(this.questionCount).subscribe({
      next: () => {
        // Timer updates every 250ms (optimized for battery life)
        this.timerInterval = setInterval(() => {
          if (this.practiceSession?.isActive) {
            this.currentQuestionTime = this.quizService.getCurrentQuestionTime();
          }
        }, 250);
      },
      error: (err) => {
        console.error('Failed to initialize practice session:', err);
      }
    });
  }

  private initializeCompetitiveMode() {
    // Validate username
    if (!this.username || this.username.trim().length === 0) {
      console.error('No username provided for competitive mode');
      this.router.navigate(['/best-signaller']);
      return;
    }

    // Store username in localStorage for leaderboard current user highlighting
    localStorage.setItem('lastCompetitiveUsername', this.username);

    // Subscribe to current question
    const questionSub = this.quizService.getCurrentQuestion().subscribe(question => {
      this.currentQuestion = question;
      this.selectedAnswerId = null;
      this.feedbackVisible = false;
      this.nextButtonEnabled = false;
      this.imageLoading = true;

      // Start timer for new question
      if (question) {
        this.startQuestionTimer();
      }

      // Update progress (since we're not using quizState anymore)
      if (question && this.practiceSession) {
        this.currentQuestionTime = this.quizService.getCurrentQuestionTime();
      }
    });
    this.subscriptions.push(questionSub);

    // Initialize competitive session
    this.quizService.initializeCompetitiveSession(this.username).subscribe({
      next: () => {
        // Timer updates every 250ms (optimized for battery life)
        this.timerInterval = setInterval(() => {
          const session = this.quizService.getCompetitiveSessionValue();
          if (session?.isActive) {
            this.currentQuestionTime = this.quizService.getCurrentQuestionTime();
          }
        }, 250);
      },
      error: (err) => {
        console.error('Failed to initialize competitive session:', err);
      }
    });
  }

  async onAnswerSelected(answerId: string) {
    if (this.feedbackVisible || !this.currentQuestion) return;

    // Haptic feedback on selection
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Haptics not available (web or unsupported device)
    }

    this.selectedAnswerId = answerId;

    if (this.mode === 'practice') {
      this.quizService.recordQuestionTime(); // Stop timer and record time
      const record = this.quizService.submitPracticeAnswer(answerId);
      if (record) {
        this.feedbackCorrect = record.isCorrect;

        // Additional haptic feedback for correct/incorrect
        try {
          if (record.isCorrect) {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } else {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          }
        } catch (err) {
          // Haptics not available
        }
      }
    } else {
      // Competitive mode
      const record = this.quizService.submitCompetitiveAnswer(answerId);
      if (record) {
        this.feedbackCorrect = record.isCorrect;

        // Additional haptic feedback for correct/incorrect
        try {
          if (record.isCorrect) {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } else {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          }
        } catch (err) {
          // Haptics not available
        }
      }
    }

    // Show feedback
    this.feedbackVisible = true;

    // Enable next button after delay
    setTimeout(() => {
      this.nextButtonEnabled = true;
    }, 1000); // 1 second delay
  }

  nextQuestion() {
    if (!this.nextButtonEnabled) return;

    if (this.mode === 'practice') {
      if (this.practiceSession && this.practiceSession.currentQuestionIndex < this.practiceSession.questionCount) {
        // More questions remaining in practice mode
        this.quizService.generatePracticeQuestion().subscribe();
      } else {
        // Practice session completed
        const summary = this.quizService.getPracticeSummary();
        this.router.navigate(['/practice-results'], {
          state: { summary }
        });
      }
    } else {
      // Competitive mode
      console.log('[DEBUG] nextQuestion - competitive mode, checking if quiz complete');
      const session = this.quizService.getCompetitiveSessionValue();
      console.log('[DEBUG] Current session:', {
        currentQuestionIndex: session?.currentQuestionIndex,
        totalQuestions: 50,
        isActive: session?.isActive
      });

      if (session && session.currentQuestionIndex < 50) {
        // More questions remaining
        console.log('[DEBUG] More questions remaining, generating next question');
        this.quizService.generateCompetitiveQuestion().subscribe();
      } else {
        // Quiz completed - navigate to competitive results
        console.log('[DEBUG] Quiz completed! Getting results...');
        const results = this.quizService.getCompetitiveResults();
        console.log('[DEBUG] Results retrieved:', results);

        if (results) {
          console.log('[DEBUG] Results exist, navigating to competitive-results with state:', results);
          this.router.navigate(['/competitive-results'], {
            state: { results }
          }).then(success => {
            console.log('[DEBUG] Navigation result:', success);
            if (!success) {
              console.error('[DEBUG] Navigation FAILED - router.navigate returned false');
            }
          }).catch(err => {
            console.error('[DEBUG] Navigation EXCEPTION:', err);
          });
        } else {
          console.error('[DEBUG] ERROR: getCompetitiveResults returned null or undefined');
        }
      }
    }
  }

  getButtonColor(optionId: string): string {
    if (!this.feedbackVisible) return 'primary';

    if (optionId === this.currentQuestion?.correctAnswerId) {
      return 'success';
    }

    if (optionId === this.selectedAnswerId && !this.feedbackCorrect) {
      return 'danger';
    }

    return 'medium';
  }

  getCorrectAnswerText(): string {
    if (!this.currentQuestion) return '';
    const correctOption = this.currentQuestion.options.find(opt => opt.id === this.currentQuestion!.correctAnswerId);
    return correctOption?.text || '';
  }

  onImageLoad() {
    this.imageLoading = false;
  }

  startQuestionTimer(): void {
    this.questionStartTime = Date.now();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getCurrentScore(): number {
    if (this.mode === 'practice') {
      return this.practiceSession?.currentScore || 0;
    } else {
      const session = this.quizService.getCompetitiveSessionValue();
      return session?.currentScore || 0;
    }
  }

  getAccuracyDisplay(): string {
    if (this.mode === 'practice') {
      if (!this.practiceSession) return '0%';
      const answeredQuestions = this.practiceSession.questionsAnswered;
      if (answeredQuestions.length === 0) return '0%';
      const correctCount = answeredQuestions.filter(q => q.isCorrect).length;
      const accuracy = (correctCount / answeredQuestions.length) * 100;
      return accuracy.toFixed(1) + '%';
    } else {
      // Competitive mode
      const session = this.quizService.getCompetitiveSessionValue();
      if (!session || session.questionsAnswered.length === 0) return '0%';
      const answeredQuestions = session.questionsAnswered.length;
      const correctCount = session.questionsAnswered.filter(q => q.isCorrect).length;
      const accuracy = (correctCount / answeredQuestions) * 100;
      return accuracy.toFixed(1) + '%';
    }
  }

  restartQuiz() {
    if (this.mode === 'practice') {
      this.showRestartConfirm = true;
    } else {
      this.quizService.resetQuiz();
      this.quizCompleted = false;
      this.quizResults = null;
      this.ngOnInit();
    }
  }

  confirmRestart() {
    this.showRestartConfirm = false;
    if (this.mode === 'practice') {
      this.restartPracticeSession();
    } else {
      this.restartQuiz(); // Call without confirmation for competitive mode
    }
  }

  cancelRestart() {
    this.showRestartConfirm = false;
  }

  private restartPracticeSession() {
    this.quizService.restartPracticeSession().subscribe({
      next: () => {
        // Reset component state
        this.currentQuestionTime = 0;
        this.quizCompleted = false;
        this.quizResults = null;
      },
      error: (err) => {
        console.error('Failed to restart practice session:', err);
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Clean up timer intervals
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
