/**
 * User Badge Component
 * Displays user information in a badge format with rank and name.
 * Used in headers, profiles, and leaderboards.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { User, Rank, formatUserDisplayName, RankDisplayNames } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-badge',
  templateUrl: './user-badge.component.html',
  styleUrls: ['./user-badge.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class UserBadgeComponent {
  /**
   * User object to display
   */
  @Input() user: User | null = null;

  /**
   * Badge size: 'small', 'medium', 'large'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Show device ID
   */
  @Input() showDeviceId = false;

  /**
   * Show admin badge
   */
  @Input() showAdminBadge = true;

  /**
   * Get formatted display name
   */
  getDisplayName(): string {
    return this.user ? formatUserDisplayName(this.user) : 'Unknown User';
  }

  /**
   * Get rank display name
   */
  getRankDisplay(): string {
    return this.user ? RankDisplayNames[this.user.rank as Rank] : '';
  }

  /**
   * Get initials for avatar
   */
  getInitials(): string {
    if (!this.user) return '?';

    const firstInitial = this.user.first_name.charAt(0).toUpperCase();
    const lastInitial = this.user.last_name.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Get truncated device ID
   */
  getTruncatedDeviceId(): string {
    return this.user ? this.user.device_id.substring(0, 8) : '';
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.user?.is_admin || false;
  }
}
