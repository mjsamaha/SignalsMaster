
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

/**
 * Tab2Page displays the second tab in the main tab navigation.
 * Use for secondary user flows or features.
 */
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent]
})
export class Tab2Page {
  /**
   * Initializes Tab2Page. Extend for tab-specific setup if needed.
   */
  constructor() {}
}
