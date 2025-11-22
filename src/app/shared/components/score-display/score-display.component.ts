import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-display.component.html',
  styleUrls: ['./score-display.component.scss']
})
export class ScoreDisplayComponent {
  @Input() score: number = 0;
  @Input() total: number = 0;
  @Input() showPercentage: boolean = true;

  get percentage(): number {
    if (this.total === 0) return 0;
    return Math.round((this.score / this.total) * 100);
  }
}

