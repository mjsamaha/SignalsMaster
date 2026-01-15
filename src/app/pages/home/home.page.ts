import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';

/**
 * HomePage serves as the main entry point for the app.
 * Provides navigation to practice, competitive, leaderboard, and feedback features.
 * Displays user authentication status and profile access.
 * Icons are registered centrally in app.component.ts (Issue #227 fix)
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonCard, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, CommonModule, UserBadgeComponent]
})
export class HomePage implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  isAuthenticated = false;

  /**
   * Fix Issue #251: Track Firebase Auth availability
   */
  firebaseAuthAvailable = true;

  ngOnInit() {
    console.log('[HomePage] Initializing home page');

    // Fix Issue #251: Subscribe to Firebase Auth availability
    this.authService.isFirebaseAuthAvailable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(available => {
        this.firebaseAuthAvailable = available;
        if (!available) {
          console.warn('[HomePage] Firebase Auth unavailable - some features may be limited');
        }
      });

    // Subscribe to authentication state
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = user !== null;
        console.log('[HomePage] User state updated:', user?.user_id || 'not authenticated');
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Navigate to profile page
   */
  async navigateToProfile(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/profile']);
  }

  /**
   * Navigate to registration page
   */
  async navigateToRegistration(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/registration']);
  }

  /**
   * Navigates to practice mode tab with haptic feedback.
   */
  async navigateToPracticeMode(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/practice-mode']);
  }

  /**
   * Navigates to best signaller tab with haptic feedback.
   */
  async navigateToBestSignaller(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/best-signaller']);
  }

  /**
   * Navigates to leaderboard tab with haptic feedback.
   */
  async navigateToLeaderboard(): Promise<void> {
    await this.triggerHaptic();
    this.router.navigate(['/tabs/leaderboard']);
  }

  /**
   * Starts a practice quiz with the specified question count.
   */
  async startPractice(questionCount: number) {
    await this.triggerHaptic();
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'practice',
        count: questionCount
      }
    });
  }

  /**
   * Starts a competitive quiz session.
   */
  async startBestSignaller() {
    await this.triggerHaptic();
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'competitive'
      }
    });
  }

  /**
   * Opens feedback form in a new tab with haptic feedback.
   */
  async navigateToFeedback(): Promise<void> {
    await this.triggerHaptic();
    // added new feedback link
    window.open('https://signalsmaster.userjot.com/', '_blank', 'noopener,noreferrer');
  }

  private async triggerHaptic(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      // Haptics not available (web or unsupported device)
    }
  }
}

