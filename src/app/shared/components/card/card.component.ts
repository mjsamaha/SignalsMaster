
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CardComponent displays a styled container for grouping related content.
 * Supports visual variants and padding options for flexible layouts.
 */
export type CardVariant = 'default' | 'highlighted' | 'elevated';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {
  /** Visual style variant for the card. */
  @Input() variant: CardVariant = 'default';
  /** Padding size for card content. */
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Returns CSS class names for card styling based on variant and padding.
   */
  get classNames(): string {
    return `card card-${this.variant} card-padding-${this.padding}`;
  }
}
