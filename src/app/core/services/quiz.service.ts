import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Flag, FlagService } from './flag.service';

export interface QuizQuestion {
  flag: Flag;
  options: string[];
  correctAnswer: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeElapsed: number;
  mode: 'practice' | 'competition';
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private currentQuestion$ = new BehaviorSubject<QuizQuestion | null>(null);
  private currentScore$ = new BehaviorSubject<number>(0);
  private currentQuestionIndex$ = new BehaviorSubject<number>(0);
  private quizQuestions$ = new BehaviorSubject<QuizQuestion[]>([]);
  private quizStartTime$ = new BehaviorSubject<number | null>(null);
  private isQuizActive$ = new BehaviorSubject<boolean>(false);

  constructor(private flagService: FlagService) {}

  /**
   * Initialize a new quiz
   */
  startQuiz(questionCount: number = 10, categories?: string[]): Observable<void> {
    return new Observable(observer => {
      this.flagService.getAllFlags().subscribe(flags => {
        let availableFlags = flags;
        
        // Filter by categories if provided
        if (categories && categories.length > 0) {
          availableFlags = flags.filter(flag => categories.includes(flag.category));
        }

        // Generate quiz questions
        const questions: QuizQuestion[] = [];
        const shuffled = [...availableFlags].sort(() => 0.5 - Math.random());
        const selectedFlags = shuffled.slice(0, Math.min(questionCount, shuffled.length));

        selectedFlags.forEach(flag => {
          // Get random wrong answers
          const wrongAnswers = this.getRandomWrongAnswers(flag.name, availableFlags);
          const options = [flag.name, ...wrongAnswers].sort(() => 0.5 - Math.random());
          
          questions.push({
            flag,
            options,
            correctAnswer: flag.name
          });
        });

        this.quizQuestions$.next(questions);
        this.currentQuestionIndex$.next(0);
        this.currentScore$.next(0);
        this.quizStartTime$.next(Date.now());
        this.isQuizActive$.next(true);
        this.loadQuestion(0);

        observer.next();
        observer.complete();
      });
    });
  }

  /**
   * Get current question
   */
  getCurrentQuestion(): Observable<QuizQuestion | null> {
    return this.currentQuestion$.asObservable();
  }

  /**
   * Get current score
   */
  getCurrentScore(): Observable<number> {
    return this.currentScore$.asObservable();
  }

  /**
   * Get current question index
   */
  getCurrentQuestionIndex(): Observable<number> {
    return this.currentQuestionIndex$.asObservable();
  }

  /**
   * Get total questions count
   */
  getTotalQuestions(): Observable<number> {
    return new Observable(observer => {
      this.quizQuestions$.subscribe(questions => {
        observer.next(questions.length);
      });
    });
  }

  /**
   * Submit an answer
   */
  submitAnswer(answer: string): boolean {
    const currentQuestion = this.currentQuestion$.value;
    if (!currentQuestion) return false;

    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      this.currentScore$.next(this.currentScore$.value + 1);
    }

    return isCorrect;
  }

  /**
   * Move to next question
   */
  nextQuestion(): boolean {
    const currentIndex = this.currentQuestionIndex$.value;
    const questions = this.quizQuestions$.value;
    
    if (currentIndex < questions.length - 1) {
      this.currentQuestionIndex$.next(currentIndex + 1);
      this.loadQuestion(currentIndex + 1);
      return true;
    }
    
    return false;
  }

  /**
   * Finish quiz and get results
   */
  finishQuiz(mode: 'practice' | 'competition', username?: string): QuizResult {
    const startTime = this.quizStartTime$.value || Date.now();
    const timeElapsed = Date.now() - startTime;
    const score = this.currentScore$.value;
    const totalQuestions = this.quizQuestions$.value.length;

    const result: QuizResult = {
      score,
      totalQuestions,
      correctAnswers: score,
      timeElapsed,
      mode,
      username
    };

    this.isQuizActive$.next(false);
    this.resetQuiz();

    return result;
  }

  /**
   * Check if quiz is active
   */
  isQuizActive(): Observable<boolean> {
    return this.isQuizActive$.asObservable();
  }

  /**
   * Reset quiz state
   */
  private resetQuiz(): void {
    this.currentQuestion$.next(null);
    this.currentScore$.next(0);
    this.currentQuestionIndex$.next(0);
    this.quizQuestions$.next([]);
    this.quizStartTime$.next(null);
  }

  /**
   * Load a specific question by index
   */
  private loadQuestion(index: number): void {
    const questions = this.quizQuestions$.value;
    if (index >= 0 && index < questions.length) {
      this.currentQuestion$.next(questions[index]);
    }
  }

  /**
   * Get random wrong answers for multiple choice
   */
  private getRandomWrongAnswers(correctAnswer: string, allFlags: Flag[], count: number = 3): string[] {
    const wrongFlags = allFlags
      .filter(flag => flag.name !== correctAnswer)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
    
    return wrongFlags.map(flag => flag.name);
  }
}

