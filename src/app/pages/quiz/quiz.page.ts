import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { QuizService, QuizQuestion } from '../../core/services/quiz.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { QuizQuestionComponent } from '../../shared/components/quiz-question/quiz-question.component';
import { ScoreDisplayComponent } from '../../shared/components/score-display/score-display.component';
import { TimerComponent } from '../../shared/components/timer/timer.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    CommonModule,
    QuizQuestionComponent,
    ScoreDisplayComponent,
    TimerComponent
  ]
})
export class QuizPage implements OnInit, OnDestroy {
  mode: 'practice' | 'competition' = 'practice';
  username: string = '';
  questionCount: number = 10;
  
  currentQuestion: QuizQuestion | null = null;
  selectedAnswer: string | null = null;
  showResult: boolean = false;
  score: number = 0;
  currentIndex: number = 0;
  totalQuestions: number = 0;
  quizStartTime: number | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private leaderboardService: LeaderboardService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'] || 'practice';
      this.username = params['username'] || '';
      this.questionCount = parseInt(params['count']) || 10;
      
      this.startQuiz();
    });

    this.subscriptions.push(
      this.quizService.getCurrentQuestion().subscribe(question => {
        this.currentQuestion = question;
        this.selectedAnswer = null;
        this.showResult = false;
      }),
      this.quizService.getCurrentScore().subscribe(score => {
        this.score = score;
      }),
      this.quizService.getCurrentQuestionIndex().subscribe(index => {
        this.currentIndex = index;
      }),
      this.quizService.getTotalQuestions().subscribe(total => {
        this.totalQuestions = total;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  startQuiz(): void {
    this.quizService.startQuiz(this.questionCount).subscribe(() => {
      this.quizStartTime = Date.now();
    });
  }

  onAnswerSelected(answer: string): void {
    if (this.showResult) return;
    
    this.selectedAnswer = answer;
    const isCorrect = this.quizService.submitAnswer(answer);
    this.showResult = true;
  }

  nextQuestion(): void {
    const hasNext = this.quizService.nextQuestion();
    if (!hasNext) {
      this.finishQuiz();
    }
  }

  finishQuiz(): void {
    const result = this.quizService.finishQuiz(this.mode, this.username);
    
    if (this.mode === 'competition' && this.username) {
      this.leaderboardService.addResult(result);
    }
    
    this.router.navigate(['/tabs/home'], {
      queryParams: {
        score: result.score,
        total: result.totalQuestions,
        mode: this.mode
      }
    });
  }
}

