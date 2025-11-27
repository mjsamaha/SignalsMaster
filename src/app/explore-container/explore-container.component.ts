
import { Component, Input } from '@angular/core';

/**
 * ExploreContainerComponent displays a named container for demo or placeholder content.
 * Use to show contextual information or sample UI blocks.
 */
@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
})
export class ExploreContainerComponent {
  /**
   * Optional name to display in the container.
   */
  @Input() name?: string;
}
