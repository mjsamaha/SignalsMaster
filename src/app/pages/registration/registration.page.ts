/**
 * Registration Page Component - ROOT CAUSE FIX
 *
 * PROBLEM: aria-hidden on tabs page is blocking focus to registration page
 * SOLUTION: Clear focus from hidden pages during navigation
 */

import { Component, OnInit, AfterViewInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { IonicModule, ViewWillEnter, ViewDidEnter, IonContent } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { Rank, RankDisplayNames, getAllRanks } from '../../core/models/user.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ]
})
export class RegistrationPage implements OnInit, AfterViewInit, ViewWillEnter, ViewDidEnter {
debugFocusFix() {
throw new Error('Method not implemented.');
}
  @ViewChild(IonContent, { static: false }) content?: IonContent;
  @ViewChild('firstInput', { read: ElementRef }) firstInput?: ElementRef;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  registrationForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  availableRanks = getAllRanks();
  returnUrl: string | null = null;

  ngOnInit() {
    console.log('[RegistrationPage] Initializing registration page');

    // Get return URL from query params
    this.activatedRoute.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/tabs/home';
      console.log('[RegistrationPage] Return URL:', this.returnUrl);
    });

    // Initialize form
    this.registrationForm = this.fb.group({
      rank: ['', [Validators.required]],
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]]
    });

    // Debug form state
    console.log('[RegistrationPage] Form initialized');
    console.log('[RegistrationPage] Form disabled?', this.registrationForm.disabled);

    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      console.log('[RegistrationPage] User already authenticated, redirecting');
      this.router.navigate(['/tabs/home']);
    }

    // ROOT CAUSE FIX: Listen for navigation events and clear focus from hidden pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.clearFocusFromHiddenPages();
    });
  }

  ionViewWillEnter() {
    console.log('[RegistrationPage] ionViewWillEnter - preparing page');

    // ROOT CAUSE FIX: Clear focus immediately when entering
    this.clearFocusFromHiddenPages();
  }

  ionViewDidEnter() {
    console.log('[RegistrationPage] ionViewDidEnter - page fully visible');

    // ROOT CAUSE FIX: Apply all fixes after page is fully rendered
    setTimeout(() => {
      this.applyFocusFixes();
      this.setInitialFocus();
    }, 150);
  }

  ngAfterViewInit() {
    console.log('[RegistrationPage] ngAfterViewInit - DOM ready');

    // Additional safety check after view init
    setTimeout(() => {
      this.clearFocusFromHiddenPages();
    }, 100);
  }

  /**
   * ROOT CAUSE FIX: Clear focus from any hidden pages (especially tabs)
   * This is the key fix - removes focus trap from aria-hidden elements
   */
  private clearFocusFromHiddenPages() {
    console.log('[RegistrationPage] Clearing focus from hidden pages');

    // Find all hidden ion-page elements
    const hiddenPages = document.querySelectorAll('ion-page[aria-hidden="true"]');
    console.log(`[RegistrationPage] Found ${hiddenPages.length} hidden pages`);

    hiddenPages.forEach((page, index) => {
      // Remove aria-hidden from the page
      page.removeAttribute('aria-hidden');

      // Remove ion-page-hidden class if present
      if (page.classList.contains('ion-page-hidden')) {
        page.classList.remove('ion-page-hidden');
      }

      // Find any focused element within the hidden page and blur it
      const focusedElement = page.querySelector(':focus');
      if (focusedElement) {
        console.log(`[RegistrationPage] Blurring focused element in hidden page ${index}:`, focusedElement);
        (focusedElement as HTMLElement).blur();
      }

      // Find all focusable elements in the hidden page and set tabindex=-1
      const focusableElements = page.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach(el => {
        el.setAttribute('tabindex', '-1');
      });

      console.log(`[RegistrationPage] Disabled ${focusableElements.length} focusable elements in hidden page ${index}`);
    });

    // Also check for app-tabs specifically
    const appTabs = document.querySelector('app-tabs');
    if (appTabs && appTabs.hasAttribute('aria-hidden')) {
      console.log('[RegistrationPage] Removing aria-hidden from app-tabs');
      appTabs.removeAttribute('aria-hidden');

      // Blur any focused element in tabs
      const tabsFocused = appTabs.querySelector(':focus');
      if (tabsFocused) {
        console.log('[RegistrationPage] Blurring focused element in tabs:', tabsFocused);
        (tabsFocused as HTMLElement).blur();
      }
    }

    // Clear document focus if needed
    if (document.activeElement && document.activeElement !== document.body) {
      const activeElement = document.activeElement as HTMLElement;
      const isInHiddenPage = activeElement.closest('ion-page[aria-hidden="true"]');

      if (isInHiddenPage) {
        console.log('[RegistrationPage] Clearing document focus from hidden page');
        activeElement.blur();
      }
    }
  }

  /**
   * Apply comprehensive focus fixes to the registration page
   */
  private applyFocusFixes() {
    console.log('[RegistrationPage] Applying focus fixes');

    // Ensure registration page itself is NOT hidden
    const registrationPage = document.querySelector('app-registration');
    if (registrationPage) {
      registrationPage.removeAttribute('aria-hidden');

      // Make sure parent ion-page is also not hidden
      const parentPage = registrationPage.closest('ion-page');
      if (parentPage) {
        parentPage.removeAttribute('aria-hidden');
        if (parentPage.classList.contains('ion-page-hidden')) {
          parentPage.classList.remove('ion-page-hidden');
        }
        // Force z-index to be on top
        (parentPage as HTMLElement).style.zIndex = '101';
      }
    }

    // Enable all form inputs
    const inputs = document.querySelectorAll('app-registration ion-input, app-registration ion-select');
    console.log(`[RegistrationPage] Enabling ${inputs.length} form inputs`);

    inputs.forEach((input, index) => {
      // Remove any disabling attributes
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      input.removeAttribute('aria-hidden');

      // Reset tabindex to 0 (focusable)
      input.setAttribute('tabindex', '0');

      // Access Shadow DOM if available
      const shadowRoot = input.shadowRoot;
      if (shadowRoot) {
        const nativeInput = shadowRoot.querySelector('input, textarea, button');
        if (nativeInput) {
          nativeInput.removeAttribute('disabled');
          nativeInput.removeAttribute('readonly');
          nativeInput.setAttribute('tabindex', '0');
        }
      }
    });

    // Ensure form is enabled
    if (this.registrationForm) {
      this.registrationForm.enable();
      console.log('[RegistrationPage] Form enabled');
    }
  }

  /**
   * Set initial focus to the first form field
   */
  private setInitialFocus() {
    console.log('[RegistrationPage] Setting initial focus');

    // Try to focus the rank selector
    setTimeout(() => {
      const rankSelect = document.querySelector('app-registration ion-select');
      if (rankSelect) {
        console.log('[RegistrationPage] Focusing rank selector');

        // For ion-select, we need to trigger it differently
        const selectButton = rankSelect.shadowRoot?.querySelector('button');
        if (selectButton) {
          (selectButton as HTMLElement).focus();
        }
      }
    }, 200);
  }

  /**
   * Handle form submission
   */
  async onSubmit() {
    if (this.registrationForm.invalid) {
      this.markFormGroupTouched(this.registrationForm);
      console.log('[RegistrationPage] Form invalid');
      console.log('[RegistrationPage] Form values:', this.registrationForm.value);
      console.log('[RegistrationPage] Form errors:', this.getFormValidationErrors());
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formValue = this.registrationForm.value;
    console.log('[RegistrationPage] Submitting registration:', {
      rank: formValue.rank,
      firstName: formValue.firstName,
      lastName: formValue.lastName
    });

    try {
      const result = await this.authService.registerUser({
        rank: formValue.rank as Rank,
        first_name: formValue.firstName.trim(),
        last_name: formValue.lastName.trim()
      });

      if (result.success) {
        console.log('[RegistrationPage] Registration successful, user:', result.user?.user_id);

        // Navigate to return URL or home
        await this.router.navigate([this.returnUrl || '/tabs/home']);
      } else {
        console.error('[RegistrationPage] Registration failed:', result.error);
        this.errorMessage = result.error || 'Registration failed. Please try again.';
      }
    } catch (error) {
      console.error('[RegistrationPage] Registration error:', error);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get all validation errors for debugging
   */
  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  /**
   * Mark all form controls as touched to trigger validation messages
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get error message for a form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.registrationForm.get(controlName);

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(controlName)} must be at least ${minLength} characters`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(controlName)} must be no more than ${maxLength} characters`;
    }

    if (control.errors['pattern']) {
      return `${this.getFieldLabel(controlName)} contains invalid characters`;
    }

    return 'Invalid value';
  }

  /**
   * Get user-friendly label for form field
   */
  private getFieldLabel(controlName: string): string {
    switch (controlName) {
      case 'rank': return 'Rank';
      case 'firstName': return 'First name';
      case 'lastName': return 'Last name';
      default: return controlName;
    }
  }

  /**
   * Check if a form control has an error and has been touched
   */
  hasError(controlName: string): boolean {
    const control = this.registrationForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get display name for rank enum value
   */
  getRankDisplayName(rank: Rank): string {
    return RankDisplayNames[rank];
  }
}
