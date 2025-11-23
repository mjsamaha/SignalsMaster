import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';

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
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel?: string;

  @Output() clicked = new EventEmitter<void>();

  get classNames(): string {
    const baseClasses = 'btn btn-' + this.size;
    const variantClass = this.disabled ? 'btn-disabled' : `btn-${this.variant}`;
    const stateClass = this.isLoading ? 'btn-loading' : '';
    return [baseClasses, variantClass, stateClass].filter(Boolean).join(' ');
  }

  onClick(): void {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit();
    }
  }
}
