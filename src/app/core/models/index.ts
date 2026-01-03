/**
 * Barrel export for core models.
 * Provides centralized import point for all model interfaces and types.
 */

// User models
export {
  User,
  UserProfile,
  UserRegistrationData,
  UserUpdateData,
  Rank,
  RankDisplayNames,
  formatUserDisplayName,
  toUserProfile,
  isValidRank,
  getAllRanks,
} from './user.model';

// Authentication models
export {
  AuthResult,
  AuthState,
  ValidationResult,
  SessionInfo,
  AuthErrorType,
  AuthError,
  AuthConfig,
} from './auth.model';

// Practice Result models
export {
  PracticeResult,
  PracticeResultSubmission,
  PracticeResultValidation,
  validatePracticeResultSubmission,
  practiceSummaryToSubmission,
} from './practice-result.model';
