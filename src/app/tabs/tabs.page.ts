
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, play, trophy, list, informationCircle } from 'ionicons/icons';

/**
 * TabsPage manages the main tab navigation for the app.
 * Handles tab switching and icon setup for navigation.
 */
@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  /**
   * Provides dependency injection for environment-specific services.
   */
  public environmentInjector = inject(EnvironmentInjector);

  /**
   * Initializes tab icons for navigation bar.
   */
  constructor() {
    addIcons({ home, play, trophy, list, informationCircle });
  }
}
