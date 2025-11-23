import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'highlighted' | 'elevated';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';

  get classNames(): string {
    return `card card-${this.variant} card-padding-${this.padding}`;
  }
}
