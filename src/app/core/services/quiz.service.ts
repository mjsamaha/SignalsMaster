import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Flag, FlagService } from './flag.service';


export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  flagId: string;
  flag: Flag;
  quizType: 'identify-name' | 'identify-meaning';
  options: AnswerOption[];
  correctAnswerId: string;
  questionNumber: number;
  totalQuestions: number;
}

export interface AnswerResult {
  questionId: string;
  selectedAnswerId: string;
  correctAnswerId: string;
  isCorrect: boolean;
  timeSpent: number;
  flag: Flag;
}

export interface QuizState {
  mode: 'practice' | 'competitive';
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  answeredQuestions: AnswerResult[];
  score: number;
  accuracy: number;
  startTime: Date;
  endTime: Date | null;
  isActive: boolean;
}

export interface QuizResults {
  mode: 'practice' | 'competitive';
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalTime: number;
  averageTimePerQuestion: number;
  rating: number;
  answers: AnswerResult[];
  completedAt: Date;
}

export interface PracticeSession {
  sessionId: string;
  mode: 'practice';
  questionCount: number;
  startTime: Date;
  endTime: Date | null;
  currentQuestionIndex: number;
  questionsAnswered: AnswerRecord[];
  currentScore: number;
  isActive: boolean;
}

export interface AnswerRecord {
  questionId: string;
  questionNumber: number;
  flagId: string;
  timeSpent: number;
  selectedAnswerId: string;
  correctAnswerId: string;
  isCorrect: boolean;
  flag: Flag;
}

export interface PracticeSummary {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalTime: number;
  averageTimePerQuestion: number;
  answers: AnswerRecord[];
  completedAt: Date;
}

export interface CompetitiveSession {
  sessionId: string;
  mode: 'competitive';
  username: string;
  startTime: Date;
  endTime: Date | null;
  currentQuestionIndex: number;
  questionsAnswered: AnswerRecord[];
  currentScore: number;
  isActive: boolean;
}

export interface CompetitiveResults {
  username: string;
  totalQuestions: 50;
  correctAnswers: number;
  accuracy: number;
  totalTime: number;
  averageTimePerQuestion: number;
  baseRating: number;
  speedBonus: number;
  finalRating: number;
  ratingTier: string;
  sessionId: string;
  completedAt: Date;
  answers: AnswerRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private quizState$ = new BehaviorSubject<QuizState | null>(null);
  private currentQuestion$ = new BehaviorSubject<Question | null>(null);
  private usedFlagIds = new Set<string>();
  private allFlags: Flag[] = [];

  // Practice session state
  private practiceSession$ = new BehaviorSubject<PracticeSession | null>(null);
  private questionStartTime: Date | null = null;

  // Competitive session state
  private competitiveSession$ = new BehaviorSubject<CompetitiveSession | null>(null);

  constructor(private flagService: FlagService) {}

  // Initialize quiz with question count and mode
  initializeQuiz(questionCount: number, mode: 'practice' | 'competitive'): Observable<void> {
    return new Observable(observer => {
      this.flagService.getAllFlags().subscribe(flags => {
        this.allFlags = flags;
        this.usedFlagIds.clear();

        const initialState: QuizState = {
          mode,
          totalQuestions: mode === 'competitive' ? 50 : questionCount,
          currentQuestionIndex: 0,
          currentQuestion: null,
          answeredQuestions: [],
          score: 0,
          accuracy: 0,
          startTime: new Date(),
          endTime: null,
          isActive: true
        };

        this.quizState$.next(initialState);
        this.generateQuestion().subscribe(question => {
          this.currentQuestion$.next(question);
          observer.next();
          observer.complete();
        });
      });
    });
  }

  // Generate next question
  generateQuestion(): Observable<Question> {
    return new Observable(observer => {
      const state = this.quizState$.value;
      if (!state || !state.isActive) {
        observer.error('No active quiz');
        return;
      }

      // Get unused flags
      const availableFlags = this.allFlags.filter(flag => !this.usedFlagIds.has(flag.id));
      if (availableFlags.length === 0) {
        observer.error('No more flags available');
        return;
      }

      // Select random flag
      const flag = availableFlags[Math.floor(Math.random() * availableFlags.length)];
      this.usedFlagIds.add(flag.id);

      // Determine question type (identify name or meaning)
      const quizType: 'identify-name' | 'identify-meaning' =
        Math.random() > 0.5 ? 'identify-name' : 'identify-meaning';

      // Generate options
      const options: AnswerOption[] = [];
      const correctAnswer = {
        id: 'correct',
        text: this.formatAnswerText(flag),
        isCorrect: true
      };
      options.push(correctAnswer);

      // Add incorrect options
      const otherFlags = this.allFlags.filter(f => f.id !== flag.id);
      const shuffled = [...otherFlags].sort(() => 0.5 - Math.random()).slice(0, 3);
      shuffled.forEach((f, i) => {
        options.push({
          id: `incorrect-${i}`,
          text: this.formatAnswerText(f),
          isCorrect: false
        });
      });

      // Shuffle options
      const shuffledOptions = this.shuffleArray([...options]);

      const question: Question = {
        id: `q-${Date.now()}`,
        flagId: flag.id,
        flag,
        quizType,
        options: shuffledOptions,
        correctAnswerId: correctAnswer.id,
        questionNumber: state.currentQuestionIndex + 1,
        totalQuestions: state.totalQuestions
      };

      // Update state
      const newState = {
        ...state,
        currentQuestion: question
      };
      this.quizState$.next(newState);

      observer.next(question);
      observer.complete();
    });
  }

  // Check user's answer
  checkAnswer(selectedAnswerId: string): AnswerResult {
    const state = this.quizState$.value;
    if (!state || !state.currentQuestion) {
      throw new Error('No active question');
    }

    const question = state.currentQuestion;
    const correctAnswerId = question.correctAnswerId;
    const isCorrect = selectedAnswerId === correctAnswerId;
    const timeSpent = (new Date().getTime() - state.startTime.getTime()) / 1000; // in seconds

    const answerResult: AnswerResult = {
      questionId: question.id,
      selectedAnswerId,
      correctAnswerId,
      isCorrect,
      timeSpent,
      flag: question.flag
    };

    // Update state
    const newScore = isCorrect ? state.score + 1 : state.score;
    const newAnsweredQuestions = [...state.answeredQuestions, answerResult];
    const newAccuracy = (newScore / newAnsweredQuestions.length) * 100;

    const newState: QuizState = {
      ...state,
      score: newScore,
      answeredQuestions: newAnsweredQuestions,
      accuracy: newAccuracy,
      currentQuestionIndex: state.currentQuestionIndex + 1
    };

    this.quizState$.next(newState);
    return answerResult;
  }

  // Get current quiz state
  getQuizState(): Observable<QuizState | null> {
    return this.quizState$.asObservable();
  }

  // Get current question
  getCurrentQuestion(): Observable<Question | null> {
    return this.currentQuestion$.asObservable();
  }

  // Complete quiz and calculate results
  completeQuiz(): QuizResults {
    const state = this.quizState$.value;
    if (!state) {
      throw new Error('No active quiz');
    }

    const endTime = new Date();
    const totalTime = (endTime.getTime() - state.startTime.getTime()) / 1000; // in seconds
    const averageTimePerQuestion = state.answeredQuestions.length > 0
      ? totalTime / state.answeredQuestions.length
      : 0;

    const results: QuizResults = {
      mode: state.mode,
      totalQuestions: state.totalQuestions,
      correctAnswers: state.score,
      accuracy: state.accuracy,
      totalTime,
      averageTimePerQuestion,
      rating: this.calculateRating(state.accuracy, averageTimePerQuestion),
      answers: [...state.answeredQuestions],
      completedAt: endTime
    };

    // Update state
    this.quizState$.next({
      ...state,
      endTime,
      isActive: false
    });

    return results;
  }

  // Calculate rating based on accuracy and speed
  private calculateRating(accuracy: number, averageTimePerQuestion: number): number {
    // Base rating on accuracy (70%) and speed (30%)
    const accuracyScore = accuracy; // 0-100
    // Convert time to score (faster is better, max 30 points)
    const timeScore = Math.max(0, 30 - (averageTimePerQuestion / 2));
    return Math.min(100, accuracyScore * 0.7 + timeScore);
  }

  // Utility: shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Utility: format answer text consistently
  private formatAnswerText(flag: Flag): string {
    const meaning = flag.meaning?.trim();
    if (meaning && meaning.length > 0) {
      return `${flag.name} — ${meaning}`;
    }
    return flag.name;
  }

  // Clean up and reset
  resetQuiz(): void {
    this.quizState$.next(null);
    this.currentQuestion$.next(null);
    this.usedFlagIds.clear();
  }

  // Timer methods for practice sessions
  private startQuestionTimer(): void {
    this.questionStartTime = new Date();
  }

  // Practice Session Methods
  initializePracticeSession(questionCount: number): Observable<void> {
    return new Observable(observer => {
      this.flagService.getAllFlags().subscribe(flags => {
        this.allFlags = flags;
        this.usedFlagIds.clear();

        const session: PracticeSession = {
          sessionId: `practice-${Date.now()}`,
          mode: 'practice',
          questionCount,
          startTime: new Date(),
          endTime: null,
          currentQuestionIndex: 0,
          questionsAnswered: [],
          currentScore: 0,
          isActive: true
        };

        this.practiceSession$.next(session);
        this.startQuestionTimer();
        this.generatePracticeQuestion().subscribe(() => {
          observer.next();
          observer.complete();
        });
      });
    });
  }

  generatePracticeQuestion(): Observable<void> {
    return new Observable(observer => {
      const session = this.practiceSession$.value;
      if (!session || !session.isActive) {
        observer.error('No active practice session');
        return;
      }

      // Get unused flags
      const availableFlags = this.allFlags.filter(flag => !this.usedFlagIds.has(flag.id));
      if (availableFlags.length === 0) {
        observer.error('No more flags available');
        return;
      }

      // Select random flag
      const flag = availableFlags[Math.floor(Math.random() * availableFlags.length)];
      this.usedFlagIds.add(flag.id);

      // Determine question type
      const quizType: 'identify-name' | 'identify-meaning' =
        Math.random() > 0.5 ? 'identify-name' : 'identify-meaning';

      // Generate options
      const options: AnswerOption[] = [];
      const correctAnswer = {
        id: 'correct',
        text: this.formatAnswerText(flag),
        isCorrect: true
      };
      options.push(correctAnswer);

      // Add incorrect options
      const otherFlags = this.allFlags.filter(f => f.id !== flag.id);
      const shuffled = [...otherFlags].sort(() => 0.5 - Math.random()).slice(0, 3);
      shuffled.forEach((f, i) => {
        options.push({
          id: `incorrect-${i}`,
          text: this.formatAnswerText(f),
          isCorrect: false
        });
      });

      // Shuffle options
      const shuffledOptions = this.shuffleArray([...options]);

      const question: Question = {
        id: `practice-q-${Date.now()}`,
        flagId: flag.id,
        flag,
        quizType,
        options: shuffledOptions,
        correctAnswerId: correctAnswer.id,
        questionNumber: session.currentQuestionIndex + 1,
        totalQuestions: session.questionCount
      };

      // Update question observable
      this.currentQuestion$.next(question);

      observer.next();
      observer.complete();
    });
  }

  recordQuestionTime(): number {
    if (!this.questionStartTime) {
      return 0;
    }

    const timeSpent = (new Date().getTime() - this.questionStartTime.getTime()) / 1000;
    return timeSpent;
  }

  getCurrentQuestionTime(): number {
    if (!this.questionStartTime) {
      return 0;
    }

    return (new Date().getTime() - this.questionStartTime.getTime()) / 1000;
  }

  submitPracticeAnswer(selectedAnswerId: string): AnswerRecord | null {
    const session = this.practiceSession$.value;
    const question = this.currentQuestion$.value;

    if (!session || !question) {
      return null;
    }

    const timeSpent = this.recordQuestionTime();
    const isCorrect = selectedAnswerId === question.correctAnswerId;

    const record: AnswerRecord = {
      questionId: question.id,
      questionNumber: question.questionNumber,
      flagId: question.flagId,
      timeSpent,
      selectedAnswerId,
      correctAnswerId: question.correctAnswerId,
      isCorrect,
      flag: question.flag
    };

    // Update session
    const newScore = isCorrect ? session.currentScore + 1 : session.currentScore;
    const newAnswers = [...session.questionsAnswered, record];
    const newIndex = session.currentQuestionIndex + 1;

    const updatedSession: PracticeSession = {
      ...session,
      currentScore: newScore,
      questionsAnswered: newAnswers,
      currentQuestionIndex: newIndex,
      endTime: newIndex >= session.questionCount ? new Date() : null,
      isActive: newIndex < session.questionCount
    };

    this.practiceSession$.next(updatedSession);
    return record;
  }

  getPracticeSession(): Observable<PracticeSession | null> {
    return this.practiceSession$.asObservable();
  }

  getPracticeSummary(): PracticeSummary | null {
    const session = this.practiceSession$.value;
    if (!session || !session.endTime) {
      return null;
    }

    const totalTime = (session.endTime.getTime() - session.startTime.getTime()) / 1000;
    const averageTime = session.questionsAnswered.length > 0
      ? totalTime / session.questionsAnswered.length
      : 0;

    return {
      sessionId: session.sessionId,
      totalQuestions: session.questionCount,
      correctAnswers: session.currentScore,
      accuracy: session.questionCount > 0 ? (session.currentScore / session.questionCount) * 100 : 0,
      totalTime,
      averageTimePerQuestion: averageTime,
      answers: [...session.questionsAnswered],
      completedAt: session.endTime
    };
  }

  restartPracticeSession(): Observable<void> {
    return new Observable(observer => {
      const session = this.practiceSession$.value;
      if (!session) {
        observer.error('No active session to restart');
        return;
      }

      this.initializePracticeSession(session.questionCount).subscribe(() => {
        observer.next();
        observer.complete();
      });
    });
  }

  // Competitive Session Methods
  initializeCompetitiveSession(username: string): Observable<void> {
    return new Observable(observer => {
      this.flagService.getAllFlags().subscribe(flags => {
        this.allFlags = flags;
        this.usedFlagIds.clear();

        const session: CompetitiveSession = {
          sessionId: `competitive-${Date.now()}`,
          mode: 'competitive',
          username,
          startTime: new Date(),
          endTime: null,
          currentQuestionIndex: 0,
          questionsAnswered: [],
          currentScore: 0,
          isActive: true
        };

        this.competitiveSession$.next(session);
        this.startQuestionTimer();
        this.generateCompetitiveQuestion().subscribe(() => {
          observer.next();
          observer.complete();
        });
      });
    });
  }

  generateCompetitiveQuestion(): Observable<void> {
    return new Observable(observer => {
      const session = this.competitiveSession$.value;
      if (!session || !session.isActive) {
        observer.error('No active competitive session');
        return;
      }

      // Get unused flags
      const availableFlags = this.allFlags.filter(flag => !this.usedFlagIds.has(flag.id));
      if (availableFlags.length === 0) {
        observer.error('No more flags available');
        return;
      }

      // Select random flag
      const flag = availableFlags[Math.floor(Math.random() * availableFlags.length)];
      this.usedFlagIds.add(flag.id);

      // Determine question type
      const quizType: 'identify-name' | 'identify-meaning' =
        Math.random() > 0.5 ? 'identify-name' : 'identify-meaning';

      // Generate options
      const options: AnswerOption[] = [];
      const correctAnswer = {
        id: 'correct',
        text: this.formatAnswerText(flag),
        isCorrect: true
      };
      options.push(correctAnswer);

      // Add incorrect options
      const otherFlags = this.allFlags.filter(f => f.id !== flag.id);
      const shuffled = [...otherFlags].sort(() => 0.5 - Math.random()).slice(0, 3);
      shuffled.forEach((f, i) => {
        options.push({
          id: `incorrect-${i}`,
          text: this.formatAnswerText(f),
          isCorrect: false
        });
      });

      // Shuffle options
      const shuffledOptions = this.shuffleArray([...options]);

      const question: Question = {
        id: `competitive-q-${Date.now()}`,
        flagId: flag.id,
        flag,
        quizType,
        options: shuffledOptions,
        correctAnswerId: correctAnswer.id,
        questionNumber: session.currentQuestionIndex + 1,
        totalQuestions: 50
      };

      // Update question observable
      this.currentQuestion$.next(question);

      observer.next();
      observer.complete();
    });
  }

  submitCompetitiveAnswer(selectedAnswerId: string): AnswerRecord | null {
    const session = this.competitiveSession$.value;
    const question = this.currentQuestion$.value;

    if (!session || !question) {
      return null;
    }

    const timeSpent = this.recordQuestionTime();
    const isCorrect = selectedAnswerId === question.correctAnswerId;

    const record: AnswerRecord = {
      questionId: question.id,
      questionNumber: question.questionNumber,
      flagId: question.flagId,
      timeSpent,
      selectedAnswerId,
      correctAnswerId: question.correctAnswerId,
      isCorrect,
      flag: question.flag
    };

    // Update session
    const newScore = isCorrect ? session.currentScore + 1 : session.currentScore;
    const newAnswers = [...session.questionsAnswered, record];
    const newIndex = session.currentQuestionIndex + 1;

    const updatedSession: CompetitiveSession = {
      ...session,
      currentScore: newScore,
      questionsAnswered: newAnswers,
      currentQuestionIndex: newIndex,
      endTime: newIndex >= 50 ? new Date() : null,
      isActive: newIndex < 50
    };

    this.competitiveSession$.next(updatedSession);
    return record;
  }

  getCompetitiveSession(): Observable<CompetitiveSession | null> {
    return this.competitiveSession$.asObservable();
  }

  getCompetitiveSessionValue(): CompetitiveSession | null {
    return this.competitiveSession$.value;
  }

  calculateCompetitiveRating(accuracy: number, totalTime: number): { baseRating: number, speedBonus: number, finalRating: number, ratingTier: string } {
    // Base accuracy score (0-100)
    const baseRating = accuracy;

    // Speed bonus calculation
    // Benchmark: 175 seconds total (3.5 seconds per question average)
    const benchmarkTime = 175;
    const speedBonus = Math.max(0, 100 - ((totalTime - benchmarkTime) * 0.2));

    // Final rating (70% accuracy + 30% speed)
    const finalRating = Math.min(100, (baseRating * 0.7) + (speedBonus * 0.3));
    const roundedRating = Math.round(finalRating);

    // Determine rating tier
    let ratingTier: string;
    if (roundedRating >= 90) ratingTier = 'Signals Master';
    else if (roundedRating >= 80) ratingTier = 'Expert Signaller';
    else if (roundedRating >= 70) ratingTier = 'Advanced Operator';
    else if (roundedRating >= 60) ratingTier = 'Competent Handler';
    else if (roundedRating >= 50) ratingTier = 'Developing Skill';
    else ratingTier = 'Keep Practicing';

    return {
      baseRating,
      speedBonus,
      finalRating: roundedRating,
      ratingTier
    };
  }

  getCompetitiveResults(): CompetitiveResults | null {
    const session = this.competitiveSession$.value;
    if (!session || !session.endTime) {
      return null;
    }

    const totalTime = (session.endTime.getTime() - session.startTime.getTime()) / 1000;
    const accuracy = (session.currentScore / 50) * 100;
    const averageTimePerQuestion = totalTime / 50;

    const rating = this.calculateCompetitiveRating(accuracy, totalTime);

    return {
      username: session.username,
      totalQuestions: 50,
      correctAnswers: session.currentScore,
      accuracy,
      totalTime,
      averageTimePerQuestion,
      baseRating: rating.baseRating,
      speedBonus: rating.speedBonus,
      finalRating: rating.finalRating,
      ratingTier: rating.ratingTier,
      sessionId: session.sessionId,
      completedAt: session.endTime,
      answers: [...session.questionsAnswered]
    };
  }
}
