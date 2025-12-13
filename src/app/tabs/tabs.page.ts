
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';

/**
 * TabsPage manages the main tab navigation for the app.
 * Handles tab switching and icon setup for navigation.
 * Icons are registered centrally in app.component.ts (Issue #227 fix)
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
}
