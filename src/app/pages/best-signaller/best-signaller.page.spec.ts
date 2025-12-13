/**
 * Unit tests for BestSignallerPage component.
 * Tests navigation to competitive quiz with authentication.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BestSignallerPage } from './best-signaller.page';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

describe('BestSignallerPage', () => {
  let component: BestSignallerPage;
  let fixture: ComponentFixture<BestSignallerPage>;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [BestSignallerPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BestSignallerPage);
    component = fixture.componentInstance;
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation', () => {
    it('should navigate to competitive quiz without username parameter', () => {
      component.startCompetition();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/quiz', 'competitive']);
    });

    it('should NOT pass username in navigation', () => {
      component.startCompetition();

      // Verify it doesn't pass a third parameter (username)
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/quiz', 'competitive']);
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringMatching(/[a-zA-Z]+/)]) // No string like username
      );
    });

    it('should navigate directly without validation', () => {
      // No username validation needed - authentication handled by guard
      component.startCompetition();

      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Properties', () => {
    it('should not have username property', () => {
      expect(component).not.toHaveProperty('username');
    });

    it('should not have validation properties', () => {
      expect(component).not.toHaveProperty('isUsernameValid');
      expect(component).not.toHaveProperty('validationMessage');
    });

    it('should not have validateUsername method', () => {
      expect(component).not.toHaveProperty('validateUsername');
    });

    it('should not have getCharacterCount method', () => {
      expect(component).not.toHaveProperty('getCharacterCount');
    });
  });

  describe('Authentication Assumptions', () => {
    it('should assume user is authenticated (via authGuard)', () => {
      // Page assumes authGuard has already verified authentication
      // No authentication checks needed in component
      component.startCompetition();

      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should rely on route guard for authentication', () => {
      // This page is protected by authGuard in routes
      // If user reaches this page, they are authenticated
      expect(component.startCompetition).toBeDefined();
    });
  });

  describe('Simplified Flow', () => {
    it('should have single purpose: start competition', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(component))
        .filter(method => method !== 'constructor');

      expect(methods).toContain('startCompetition');
      expect(methods.length).toBeLessThanOrEqual(2); // startCompetition + maybe ngOnInit
    });

    it('should navigate immediately when startCompetition is called', () => {
      const beforeCallCount = mockRouter.navigate.mock.calls.length;

      component.startCompetition();

      const afterCallCount = mockRouter.navigate.mock.calls.length;
      expect(afterCallCount).toBe(beforeCallCount + 1);
    });
  });

  describe('Integration with Auth System', () => {
    it('should not inject AuthService (handled by guard)', () => {
      // Component doesn't need AuthService - guard handles it
      expect(component).not.toHaveProperty('authService');
    });

    it('should not check authentication state', () => {
      // No authentication checks in component
      // authGuard prevents unauthenticated access
      component.startCompetition();

      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should trust route protection', () => {
      // If this page is accessible, user is authenticated
      // No additional checks needed
      expect(() => component.startCompetition()).not.toThrow();
    });
  });

  describe('Breaking Changes from Old System', () => {
    it('should not accept username input', () => {
      // Old system had username input - new system does not
      expect(component).not.toHaveProperty('username');
    });

    it('should not validate username format', () => {
      // Old system validated username - new system does not need to
      expect(component).not.toHaveProperty('validateUsername');
    });

    it('should not navigate with username parameter', () => {
      // Old: navigate(['/quiz', 'competitive', username])
      // New: navigate(['/quiz', 'competitive'])
      component.startCompetition();

      const [route] = mockRouter.navigate.mock.calls[0];
      expect(route).toEqual(['/quiz', 'competitive']);
      expect(route.length).toBe(2); // Only path segments, no username
    });
  });

  describe('UI Simplification', () => {
    it('should not have input-related methods', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(component));

      expect(methods).not.toContain('validateUsername');
      expect(methods).not.toContain('getCharacterCount');
      expect(methods).not.toContain('onUsernameChange');
      expect(methods).not.toContain('onInputBlur');
    });

    it('should not have form validation state', () => {
      expect(component).not.toHaveProperty('isUsernameValid');
      expect(component).not.toHaveProperty('validationMessage');
      expect(component).not.toHaveProperty('errorMessage');
      expect(component).not.toHaveProperty('showError');
    });
  });

  describe('Route Configuration', () => {
    it('should navigate to correct route format', () => {
      component.startCompetition();

      const [route] = mockRouter.navigate.mock.calls[0];
      expect(route).toEqual(['/quiz', 'competitive']);
    });

    it('should match new route pattern (no username segment)', () => {
      // New route pattern: /quiz/:mode
      // Old route pattern: /quiz/:mode/:username
      component.startCompetition();

      const [route] = mockRouter.navigate.mock.calls[0];
      expect(route.length).toBe(2); // /quiz and competitive
    });
  });
});
