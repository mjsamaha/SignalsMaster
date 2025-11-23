import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent {
  @Input() value: number = 0; // 0-100
  @Input() label?: string;
  @Input() showPercentage: boolean = false;
  @Input() height: 'sm' | 'md' | 'lg' = 'md';

  get clampedValue(): number {
    return Math.min(100, Math.max(0, this.value));
  }
}
