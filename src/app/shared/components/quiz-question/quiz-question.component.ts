import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizQuestion } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-question',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-question.component.html',
  styleUrls: ['./quiz-question.component.scss']
})
export class QuizQuestionComponent {
  @Input() question: QuizQuestion | null = null;
  @Input() selectedAnswer: string | null = null;
  @Input() showResult: boolean = false;
  @Output() answerSelected = new EventEmitter<string>();

  onAnswerClick(answer: string): void {
    if (!this.showResult) {
      this.answerSelected.emit(answer);
    }
  }

  isCorrect(answer: string): boolean {
    return answer === this.question?.correctAnswer;
  }

  isSelected(answer: string): boolean {
    return answer === this.selectedAnswer;
  }

  getButtonClasses(answer: string): string {
    if (!this.showResult) {
      return this.isSelected(answer) ? 'selected' : '';
    }
    
    if (this.isCorrect(answer)) {
      return 'correct';
    }
    
    if (this.isSelected(answer) && !this.isCorrect(answer)) {
      return 'incorrect';
    }
    
    return 'disabled';
  }
}

