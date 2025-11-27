
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

/**
 * Tab1Page displays the first tab in the main tab navigation.
 * Intended for primary user content and navigation entry.
 */
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab1Page {
  /**
   * Initializes Tab1Page. Add logic here if tab-specific setup is needed.
   */
  constructor() {}
}
