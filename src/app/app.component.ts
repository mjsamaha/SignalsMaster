import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { App } from '@capacitor/app';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  home, play, trophy, list, informationCircle,
  chatbubblesOutline, personCircleOutline,
  listOutline, mapOutline, megaphoneOutline,
  chevronDownOutline, informationCircleOutline,
  personAddOutline, closeOutline, checkmarkCircle,
  createOutline, checkmarkCircleOutline, alertCircleOutline,
  calendarOutline, timeOutline, shieldCheckmarkOutline, logOutOutline,
  bug, bugOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    // Fix: Centralized icon registration (Issue #227)
    // Registers all app icons once at startup to prevent "Could not load icon" warnings
    // This ensures icons are available before any component tries to use them
    addIcons({
      home, play, trophy, list, informationCircle,
      chatbubblesOutline, personCircleOutline,
      listOutline, mapOutline, megaphoneOutline,
      chevronDownOutline, informationCircleOutline,
      personAddOutline, closeOutline, checkmarkCircle,
      createOutline, checkmarkCircleOutline, alertCircleOutline,
      calendarOutline, timeOutline, shieldCheckmarkOutline, logOutOutline,
      bug, bugOutline
    });
  }

  ngOnInit() {
    this.setupAppStateListeners();
    // ROOT CAUSE FIX: Setup global focus management for aria-hidden issue
    this.setupGlobalFocusManagement();
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

  /**
   * ROOT CAUSE FIX: Setup global focus management on every navigation
   * This prevents aria-hidden focus traps throughout the entire app
   *
   * PROBLEM: When navigating to registration page, focus remains trapped in
   * the tabs page which has aria-hidden="true", preventing interaction with
   * registration form inputs.
   *
   * SOLUTION: On every navigation, clear focus from hidden pages and ensure
   * the current visible page is focusable.
   */
  private setupGlobalFocusManagement() {
    console.log('[AppComponent] Setting up global focus management');

    // Listen to all navigation events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      console.log('[AppComponent] Navigation completed to:', event.urlAfterRedirects);

      // Clear focus from hidden pages after navigation completes
      // Small delay ensures DOM is fully updated
      setTimeout(() => {
        this.clearFocusFromHiddenPages();
        this.ensureCurrentPageIsFocusable();
      }, 100);
    });

    // Also run on initial app load
    setTimeout(() => {
      this.clearFocusFromHiddenPages();
      this.ensureCurrentPageIsFocusable();
    }, 500);
  }

  /**
   * Clear focus and disable interaction with hidden pages
   * This is the core fix for the aria-hidden focus trap
   */
  private clearFocusFromHiddenPages() {
    // Find all pages that are marked as hidden by Ionic
    const hiddenPages = document.querySelectorAll('ion-page.ion-page-hidden, ion-page[aria-hidden="true"]');

    if (hiddenPages.length === 0) {
      return;
    }

    console.log(`[AppComponent] Found ${hiddenPages.length} hidden pages - clearing focus`);

    hiddenPages.forEach((page, index) => {
      // First: Blur any currently focused element in the hidden page
      // This is critical - it removes the focus trap
      const focusedElement = page.querySelector(':focus');
      if (focusedElement) {
        console.log(`[AppComponent] Blurring focused element in hidden page ${index}:`, focusedElement.tagName);
        (focusedElement as HTMLElement).blur();
      }

      // Second: Find all focusable elements and disable them via tabindex
      // This prevents keyboard navigation into hidden pages
      const focusableElements = page.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach(el => {
        // Store original tabindex so we can restore it later
        const currentTabindex = el.getAttribute('tabindex');
        if (currentTabindex && currentTabindex !== '-1') {
          el.setAttribute('data-original-tabindex', currentTabindex);
        }
        // Disable keyboard focus
        el.setAttribute('tabindex', '-1');
      });

      console.log(`[AppComponent] Disabled ${focusableElements.length} focusable elements in hidden page ${index}`);
    });

    // Special handling for app-tabs component
    // Tabs often retain focus even when hidden due to persistent bottom navigation
    const appTabs = document.querySelector('app-tabs.ion-page-hidden, app-tabs[aria-hidden="true"]');
    if (appTabs) {
      console.log('[AppComponent] Clearing focus from hidden tabs');

      // Blur any focused tab button
      const tabsFocused = appTabs.querySelector(':focus');
      if (tabsFocused) {
        console.log('[AppComponent] Blurring tabs focused element:', tabsFocused.tagName);
        (tabsFocused as HTMLElement).blur();
      }

      // Disable all tab buttons when tabs are hidden
      const tabButtons = appTabs.querySelectorAll('ion-tab-button');
      tabButtons.forEach(btn => {
        btn.setAttribute('tabindex', '-1');
      });

      console.log(`[AppComponent] Disabled ${tabButtons.length} tab buttons`);
    }

    // Final safety: Clear document-level focus if it's in a hidden page
    if (document.activeElement && document.activeElement !== document.body) {
      const activeElement = document.activeElement as HTMLElement;
      const isInHiddenPage = activeElement.closest('ion-page[aria-hidden="true"], ion-page.ion-page-hidden');

      if (isInHiddenPage) {
        console.log('[AppComponent] Clearing document focus - was in hidden page');
        activeElement.blur();
        // Force focus to body as fallback
        document.body.focus();
        document.body.blur();
      }
    }
  }

  /**
   * Ensure the currently visible page is focusable
   * Restores interaction to the active page
   */
  private ensureCurrentPageIsFocusable() {
    // Find all currently visible pages (not hidden)
    const visiblePages = document.querySelectorAll('ion-page:not(.ion-page-hidden):not([aria-hidden="true"])');

    if (visiblePages.length === 0) {
      console.warn('[AppComponent] No visible pages found!');
      return;
    }

    console.log(`[AppComponent] Found ${visiblePages.length} visible page(s) - ensuring focusable`);

    visiblePages.forEach((page, index) => {
      // Remove aria-hidden if somehow still present
      page.removeAttribute('aria-hidden');

      // Restore focusability to elements that were previously disabled
      const disabledElements = page.querySelectorAll('[data-original-tabindex]');
      disabledElements.forEach(el => {
        const originalTabindex = el.getAttribute('data-original-tabindex');
        if (originalTabindex) {
          el.setAttribute('tabindex', originalTabindex);
        } else {
          el.removeAttribute('tabindex');
        }
        el.removeAttribute('data-original-tabindex');
      });

      // Ensure all form inputs in visible page are focusable
      const inputs = page.querySelectorAll('ion-input, ion-select, ion-textarea, ion-searchbar');
      inputs.forEach(input => {
        input.removeAttribute('aria-hidden');

        // Set tabindex to 0 if not already set (makes it keyboard accessible)
        if (!input.hasAttribute('tabindex') || input.getAttribute('tabindex') === '-1') {
          input.setAttribute('tabindex', '0');
        }

        // Also ensure Shadow DOM native inputs are accessible
        const shadowRoot = input.shadowRoot;
        if (shadowRoot) {
          const nativeInput = shadowRoot.querySelector('input, textarea, button');
          if (nativeInput) {
            nativeInput.removeAttribute('tabindex');
            nativeInput.removeAttribute('aria-hidden');
          }
        }
      });

      console.log(`[AppComponent] Enabled visible page ${index}`);
    });
  }

  /**
   * Public static method to manually clear hidden page focus
   * Can be called from any component if needed
   */
  public static clearAllHiddenPageFocus() {
    const hiddenPages = document.querySelectorAll('ion-page.ion-page-hidden, ion-page[aria-hidden="true"]');
    hiddenPages.forEach(page => {
      const focused = page.querySelector(':focus');
      if (focused) {
        (focused as HTMLElement).blur();
      }
    });
  }
}
