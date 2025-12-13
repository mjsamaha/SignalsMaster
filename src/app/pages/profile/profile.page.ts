/**
 * Profile Page Component
 * Displays and allows editing of user profile information.
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, Rank, getAllRanks, formatUserDisplayName } from '../../core/models/user.model';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';
import { RankSelectorComponent } from '../../shared/components/rank-selector/rank-selector.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    UserBadgeComponent,
    RankSelectorComponent
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  profileForm!: FormGroup;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  availableRanks = getAllRanks();

  ngOnInit() {
    console.log('[ProfilePage] Initializing profile page');

    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        console.log('[ProfilePage] Current user:', user?.user_id);

        if (user) {
          this.initializeForm(user);
        }
      });

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('[ProfilePage] User not authenticated, redirecting');
      this.router.navigate(['/registration']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with user data
   */
  private initializeForm(user: User) {
    this.profileForm = this.fb.group({
      rank: [user.rank, [Validators.required]],
      firstName: [user.first_name, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      lastName: [user.last_name, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]]
    });

    // Disable form initially
    this.profileForm.disable();
  }

  /**
   * Toggle edit mode
   */
  toggleEdit() {
    if (this.isEditing) {
      // Cancel editing - reset form
      if (this.currentUser) {
        this.initializeForm(this.currentUser);
      }
      this.errorMessage = null;
      this.successMessage = null;
    } else {
      // Enable editing
      this.profileForm.enable();
      this.successMessage = null;
    }

    this.isEditing = !this.isEditing;
    console.log('[ProfilePage] Edit mode:', this.isEditing);
  }

  /**
   * Save profile changes
   */
  async onSave() {
    if (this.profileForm.invalid || !this.currentUser) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.profileForm.value;
    console.log('[ProfilePage] Saving profile changes:', {
      rank: formValue.rank,
      firstName: formValue.firstName,
      lastName: formValue.lastName
    });

    try {
      const updatedUser = await this.userService.updateUser(
        this.currentUser.user_id,
        {
          rank: formValue.rank as Rank,
          first_name: formValue.firstName.trim(),
          last_name: formValue.lastName.trim()
        }
      );

      console.log('[ProfilePage] Profile updated successfully');
      this.successMessage = 'Profile updated successfully!';
      this.isEditing = false;
      this.profileForm.disable();

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);

      // Refresh session to update cached user data
      await this.authService.refreshSession();
    } catch (error: any) {
      console.error('[ProfilePage] Error updating profile:', error);
      this.errorMessage = error.message || 'Failed to update profile. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Show logout confirmation dialog
   */
  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out? You will need to register again to use this device.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Logout user
   */
  private async logout() {
    console.log('[ProfilePage] Logging out user');
    await this.authService.logout();
  }

  /**
   * Get formatted display name
   */
  getDisplayName(): string {
    return this.currentUser ? formatUserDisplayName(this.currentUser) : '';
  }

  /**
   * Get account age in days
   */
  getAccountAge(): number {
    if (!this.currentUser) return 0;
    const now = new Date();
    const created = this.currentUser.created_date.toDate();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert Timestamp to Date for template
   */
  toDate(timestamp: any): Date {
    return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  }

  /**
   * Mark all form controls as touched
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
    const control = this.profileForm.get(controlName);

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
   * Check if a form control has an error
   */
  hasError(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
