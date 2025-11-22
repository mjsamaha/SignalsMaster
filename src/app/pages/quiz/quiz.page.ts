import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonProgressBar, IonText, IonIcon, IonSpinner, IonButtons, IonModal } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { QuizService, Question, AnswerOption, QuizResults, QuizState, PracticeSession, PracticeSummary } from '../../core/services/quiz.service';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';

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
    IonProgressBar,
    IonText,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonModal
]
})
export class QuizPage implements OnInit, OnDestroy {
  mode: 'practice' | 'competitive' = 'practice';
  questionCount: number = 10;

  currentQuestion: Question | null = null;
  selectedAnswerId: string | null = null;
  feedbackVisible = false;
  feedbackCorrect = false;
  nextButtonEnabled = false;
  quizCompleted = false;
  quizResults: QuizResults | null = null;
  imageLoading = true;
  quizState: QuizState | null = null;

  // Practice mode properties
  practiceSession: PracticeSession | null = null;
  currentQuestionTime: number = 0;
  timerInterval: any;
  questionStartTime: number = 0;

  // UI state
  showRestartConfirm = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit() {
    // Get route parameters
    const params = this.route.snapshot.queryParams;
    this.mode = params['mode'] || 'practice';
    this.questionCount = parseInt(params['count'], 10) || 10;

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
        // Timer updates every 100ms for smooth display
        this.timerInterval = setInterval(() => {
          if (this.practiceSession?.isActive) {
            this.currentQuestionTime = this.quizService.getCurrentQuestionTime();
          }
        }, 100);
      },
      error: (err) => {
        console.error('Failed to initialize practice session:', err);
      }
    });
  }

  private initializeCompetitiveMode() {
    // Subscribe to quiz state
    const stateSub = this.quizService.getQuizState().subscribe(state => {
      this.quizState = state;
    });
    this.subscriptions.push(stateSub);

    // Initialize competitive quiz
    this.quizService.initializeQuiz(this.questionCount, this.mode).subscribe({
      next: () => {
        // Subscribe to current question
        const sub = this.quizService.getCurrentQuestion().subscribe(question => {
          this.currentQuestion = question;
          this.selectedAnswerId = null;
          this.feedbackVisible = false;
          this.nextButtonEnabled = false;
          this.imageLoading = true;
        });
        this.subscriptions.push(sub);
      },
      error: (err) => {
        console.error('Failed to initialize quiz:', err);
      }
    });
  }

  onAnswerSelected(answerId: string) {
    if (this.feedbackVisible || !this.currentQuestion) return;

    this.selectedAnswerId = answerId;

    if (this.mode === 'practice') {
      this.quizService.recordQuestionTime(); // Stop timer and record time
      const record = this.quizService.submitPracticeAnswer(answerId);
      if (record) {
        this.feedbackCorrect = record.isCorrect;
      }
    } else {
      const result = this.quizService.checkAnswer(answerId);
      this.feedbackCorrect = result.isCorrect;
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
      if (this.quizState && this.quizState.currentQuestionIndex < this.quizState.totalQuestions) {
        // More questions remaining
        this.quizService.generateQuestion().subscribe();
      } else {
        // Quiz completed
        this.quizResults = this.quizService.completeQuiz();
        this.quizCompleted = true;
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

  getAccuracyDisplay(): string {
    if (this.mode === 'practice') {
      if (!this.practiceSession) return '0%';
      const answeredQuestions = this.practiceSession.questionsAnswered;
      if (answeredQuestions.length === 0) return '0%';
      const correctCount = answeredQuestions.filter(q => q.isCorrect).length;
      const accuracy = (correctCount / answeredQuestions.length) * 100;
      return accuracy.toFixed(1) + '%';
    } else {
      if (!this.quizState) return '0%';
      const accuracy = (this.quizState.score / this.quizState.currentQuestionIndex) * 100;
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
