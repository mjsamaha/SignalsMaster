
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ProgressBarComponent displays a horizontal progress indicator.
 * Supports value clamping, optional label, percentage display, and height variants.
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent {
  /** Progress value (0-100). */
  @Input() value: number = 0;
  /** Optional label to display above or beside the bar. */
  @Input() label?: string;
  /** Show percentage value if true. */
  @Input() showPercentage: boolean = false;
  /** Height variant for the bar. */
  @Input() height: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Returns value clamped between 0 and 100 for safe rendering.
   */
  get clampedValue(): number {
    return Math.min(100, Math.max(0, this.value));
  }
}
