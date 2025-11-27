
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

/**
 * Tab3Page displays the third tab in the main tab navigation.
 * Use for additional features or tertiary flows.
 */
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab3Page {
  /**
   * Initializes Tab3Page. Extend for tab-specific setup if needed.
   */
  constructor() {}
}
