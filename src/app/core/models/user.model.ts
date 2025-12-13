/**
 * User model and related interfaces for the authentication system.
 * Defines the structure for user data stored in Firestore and device storage.
 */

import { Timestamp } from '@angular/fire/firestore';

/**
 * Navy ranks enum for cadet and officer ranks.
 * Used in registration and profile management.
 */
export enum Rank {
  // Cadet Ranks
  OC = 'OC',           // Ordinary Cadet
  AC = 'AC',             // Able Cadet
  LC = 'LC',             // Leading Cadet
  MC = 'MC',           // Master Cadet
  PO2 = 'PO2',           // Petty Officer Second Class
  PO1 = 'PO1',           // Petty Officer First Class
  CPO2 = 'CPO2',           // Chief Petty Officer Second Class
  CPO1 = 'CPO1',         // Chief Petty Officer First Class
  // Staff Ranks (for testing and production support)
  CIV = 'CIV',           // Civilian Staff
  UnitO = 'UnitO',       // Officer Staff
  NCM = 'NCM',         // Non-Commissioned Member (Reserves)
}

/**
 * Display names for ranks (for UI dropdowns and display).
 */
export const RankDisplayNames: Record<Rank, string> = {
  [Rank.OC]: 'Orindary Cadet (OC)',
  [Rank.AC]: 'Able Cadet (AC)',
  [Rank.LC]: 'Leading Cadet (LC)',
  [Rank.MC]: 'Master Cadet (MC)',
  [Rank.PO2]: 'Petty Officer Second Class (PO2)',
  [Rank.PO1]: 'Petty Officer First Class (PO1)',
  [Rank.CPO2]: 'Chief Petty Officer Second Class (CPO2)',
  [Rank.CPO1]: 'Chief Petty Officer First Class (CPO1)',
  [Rank.CIV]: 'Civilian Staff (CIV)',
  [Rank.UnitO]: 'Officer Staff (UnitO)',
  [Rank.NCM]: 'Non-Commissioned Member (NCM)',
};

/**
 * Complete user object stored in Firestore users collection.
 * Matches the database schema defined in Issue #172.
 */
export interface User {
  user_id: string;           // Firestore document ID (redundant but useful)
  rank: string;              // User's rank (e.g., "CDT", "PO1", etc.)
  first_name: string;        // User's first name (1-50 characters)
  last_name: string;         // User's last name (1-50 characters)
  device_id: string;         // UUID for device binding
  created_date: Timestamp;   // Account creation timestamp
  last_login: Timestamp;     // Last login timestamp
  is_admin?: boolean;        // Optional admin flag (for Phase 4)
}

/**
 * Lightweight user profile for display in UI components.
 * Used in badges, headers, and quick views.
 */
export interface UserProfile {
  user_id: string;
  rank: string;
  first_name: string;
  last_name: string;
  display_name: string;      // Formatted as "RANK LastName, F."
}

/**
 * User registration data submitted from registration form.
 * Does not include timestamps (generated server-side).
 * device_id is optional - will be auto-generated if not provided.
 */
export interface UserRegistrationData {
  rank: string;
  first_name: string;
  last_name: string;
  device_id?: string;
}

/**
 * User data for updates (partial User object).
 * Allows updating specific fields without affecting others.
 */
export interface UserUpdateData {
  rank?: string;
  first_name?: string;
  last_name?: string;
  last_login?: Timestamp;
}

/**
 * Helper function to format user display name.
 * Format: "RANK LastName, F." (e.g., "CDT Smith, J.")
 */
export function formatUserDisplayName(user: User | UserProfile): string {
  return `${user.rank} ${user.last_name}, ${user.first_name.charAt(0).toUpperCase()}.`;
}

/**
 * Helper function to convert User to UserProfile.
 */
export function toUserProfile(user: User): UserProfile {
  return {
    user_id: user.user_id,
    rank: user.rank,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: formatUserDisplayName(user),
  };
}

/**
 * Helper function to check if a rank is valid.
 */
export function isValidRank(rank: string): boolean {
  return Object.values(Rank).includes(rank as Rank);
}

/**
 * Helper function to get all ranks as array.
 */
export function getAllRanks(): Rank[] {
  return Object.values(Rank);
}
