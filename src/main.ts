import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { APP_INITIALIZER } from '@angular/core';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
// Fix Issue #249: Add Firebase Auth to populate request.auth for Firestore security rules
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { environment } from './environments/environment';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { PlatformService } from './app/core/services/platform.service';
import { AuthService } from './app/core/services/auth.service';

function initializePlatform(platformService: PlatformService) {
  return async () => {
    await platformService.ready();
    const platformClasses = platformService.getPlatformClasses();
    // Defensive: only add classes if PlatformService returned non-empty classes.
    // This prevents calling classList.add() with no args and surfaces platform
    // detection during bootstrap for debugging.
    if (platformClasses && platformClasses.length > 0) {
      document.body.classList.add(...platformClasses);
    } else {
      // Not fatal; helpful debug for environments where platform detection fails.
      // Keep this console.debug for now; it can be removed once verified.
      console.debug('PlatformService returned no classes at bootstrap:', platformClasses);
    }
    // Set runtime CSS variable --vh to address iOS/mobile viewport height issues
    // This ensures `calc(var(--vh, 1vh) * 100)` computes the actual visual
    // viewport height on mobile browsers where 100vh can be unreliable.
    const setVh = () => {
      try {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      } catch (e) {
        // Defensive: ignore in non-browser environments
      }
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    // TEMP DEBUG: iOS scroll inspection helper (remove after fix confirmed)
    if (!environment.production && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setTimeout(() => {
        const ionContent = document.querySelector('ion-content');
        const innerScroll = ionContent?.shadowRoot?.querySelector('.inner-scroll') as HTMLElement;
        if (innerScroll && ionContent) {
          console.log('🔍 iOS Debug - .inner-scroll height:', innerScroll.clientHeight, 'px');
          console.log('🔍 iOS Debug - ion-content height:', ionContent.clientHeight, 'px');
          // Visual debug: red outline for 5 seconds
          innerScroll.style.outline = '3px solid red';
          innerScroll.style.zIndex = '9999';
          setTimeout(() => {
            innerScroll.style.outline = '';
            innerScroll.style.zIndex = '';
          }, 5000);
        } else {
          console.warn('🔍 iOS Debug - .inner-scroll element not found in shadow DOM or ion-content is null');
        }
      }, 2000);
    }

    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', setVh);
    }
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      // Connect to emulators in test environment
      if (environment.useEmulators && environment.emulators?.firestore) {
        connectFirestoreEmulator(
          firestore,
          environment.emulators.firestore.host,
          environment.emulators.firestore.port
        );
      }
      return firestore;
    }),
    // Fix Issue #249: Enable Firebase Auth to populate request.auth in Firestore rules
    // Anonymous auth maintains device-based UX while providing server-side security
    provideAuth(() => {
      const auth = getAuth();
      // Connect to emulators in test environment
      if (environment.useEmulators && environment.emulators?.auth) {
        connectAuthEmulator(
          auth,
          `http://${environment.emulators.auth.host}:${environment.emulators.auth.port}`,
          { disableWarnings: true }
        );
      }
      return auth;
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializePlatform,
      deps: [PlatformService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => {
        return () => authService.initializeAuth();
      },
      deps: [AuthService],
      multi: true
    }
  ],
});
