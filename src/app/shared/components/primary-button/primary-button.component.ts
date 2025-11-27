
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';

/**
 * PrimaryButtonComponent displays a styled button for user actions.
 * Supports multiple variants, sizes, loading state, and accessibility options.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'correct' | 'incorrect' | 'outline' | 'disabled';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [CommonModule, IonButton],
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.scss'],
})
export class PrimaryButtonComponent {
  /** Visual style variant for the button. */
  @Input() variant: ButtonVariant = 'primary';
  /** Button size for layout. */
  @Input() size: ButtonSize = 'md';
  /** Disables the button if true. */
  @Input() disabled: boolean = false;
  /** Shows loading spinner if true. */
  @Input() isLoading: boolean = false;
  /** Button type attribute. */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  /** Optional ARIA label for accessibility. */
  @Input() ariaLabel?: string;

  /** Emits when the button is clicked and not disabled/loading. */
  @Output() clicked = new EventEmitter<void>();

  /**
   * Returns CSS class names for button styling based on state and variant.
   */
  get classNames(): string {
    const baseClasses = 'btn btn-' + this.size;
    const variantClass = this.disabled ? 'btn-disabled' : `btn-${this.variant}`;
    const stateClass = this.isLoading ? 'btn-loading' : '';
    return [baseClasses, variantClass, stateClass].filter(Boolean).join(' ');
  }

  /**
   * Emits click event if button is enabled and not loading.
   */
  onClick(): void {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit();
    }
  }
}
