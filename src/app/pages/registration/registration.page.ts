/**
 * Registration Page Component
 * Handles new user registration with device-based authentication.
 * Collects rank, first name, and last name for user profile creation.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { Rank, RankDisplayNames, getAllRanks } from '../../core/models/user.model';

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
export class RegistrationPage implements OnInit {
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

    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      console.log('[RegistrationPage] User already authenticated, redirecting');
      this.router.navigate(['/tabs/home']);
    }
  }

  /**
   * Handle form submission
   */
  async onSubmit() {
    if (this.registrationForm.invalid) {
      this.markFormGroupTouched(this.registrationForm);
      console.log('[RegistrationPage] Form invalid:', this.registrationForm.errors);
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
   * Used by ion-select to show user-friendly rank names
   */
  getRankDisplayName(rank: Rank): string {
    return RankDisplayNames[rank];
  }}
