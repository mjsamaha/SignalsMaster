import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.setupAppStateListeners();
  }

  /**
   * Setup Capacitor App state listeners for lifecycle management.
   * Refreshes session when app returns to foreground.
   */
  private setupAppStateListeners() {
    console.log('[AppComponent] Setting up app state listeners');

    // Listen for app state changes (foreground/background)
    App.addListener('appStateChange', async ({ isActive }) => {
      console.log('[AppComponent] App state changed:', isActive ? 'foreground' : 'background');

      if (isActive && this.authService.isAuthenticated()) {
        // App came to foreground and user is authenticated
        // Refresh session to update last_login
        console.log('[AppComponent] Refreshing session on app resume');
        await this.authService.refreshSession();
      }
    });

    // Listen for deep links / URL open events
    App.addListener('appUrlOpen', (data) => {
      console.log('[AppComponent] App opened with URL:', data.url);
      // Handle deep links if needed in future
    });

    // Listen for back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      console.log('[AppComponent] Back button pressed, canGoBack:', canGoBack);

      if (!canGoBack) {
        // At root level, exit app
        App.exitApp();
      } else {
        // Navigate back
        window.history.back();
      }
    });

    console.log('[AppComponent] App state listeners initialized');
  }
}
