/**
 * Practice Result model for storing practice quiz results in Firestore.
 * MVP Phase 1: Private progress tracking for authenticated users.
 *
 * Collection: practice_results
 * Privacy: Users can only read/write their own practice results
 */

import { Timestamp } from '@angular/fire/firestore';

/**
 * Complete practice result document stored in Firestore.
 * Matches the schema defined in Firestore security rules.
 */
export interface PracticeResult {
  result_id: string;          // Firestore document ID
  user_id: string;            // References users collection
  rank: string;               // User's rank at time of submission (for analytics)
  score: number;              // Correct answers count
  total_questions: number;    // Total questions in session
  accuracy: number;           // Percentage (0-100)
  total_time: number;         // Total time in seconds
  average_time: number;       // Average time per question in seconds
  session_id: string;         // Unique session identifier from quiz service
  completed_at: Timestamp;    // When the quiz was completed
  created_at: Timestamp;      // When the result was saved to Firestore
}

/**
 * Data structure for submitting new practice results.
 * Used when creating documents in Firestore.
 * Excludes result_id (auto-generated) and timestamps (server-generated).
 */
export interface PracticeResultSubmission {
  user_id: string;
  rank: string;
  score: number;
  total_questions: number;
  accuracy: number;
  total_time: number;
  average_time: number;
  session_id: string;
}

/**
 * Validation result for practice result submission data.
 * Used by service to validate data before Firestore submission.
 */
export interface PracticeResultValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Helper function to validate practice result submission data.
 * Ensures all required fields are present and within valid ranges.
 *
 * @param data Practice result submission data
 * @returns Validation result with errors if any
 */
export function validatePracticeResultSubmission(data: PracticeResultSubmission): PracticeResultValidation {
  const errors: string[] = [];

  // Validate user_id
  if (!data.user_id || typeof data.user_id !== 'string' || data.user_id.length < 10) {
    errors.push('Invalid user_id: must be a string with at least 10 characters');
  }

  // Validate rank
  if (!data.rank || typeof data.rank !== 'string' || data.rank.length < 2 || data.rank.length > 10) {
    errors.push('Invalid rank: must be a string between 2 and 10 characters');
  }

  // Validate score
  if (typeof data.score !== 'number' || data.score < 0) {
    errors.push('Invalid score: must be a non-negative number');
  }

  // Validate total_questions
  if (typeof data.total_questions !== 'number' || data.total_questions <= 0) {
    errors.push('Invalid total_questions: must be a positive number');
  }

  // Validate accuracy
  if (typeof data.accuracy !== 'number' || data.accuracy < 0 || data.accuracy > 100) {
    errors.push('Invalid accuracy: must be a number between 0 and 100');
  }

  // Validate total_time
  if (typeof data.total_time !== 'number' || data.total_time < 0) {
    errors.push('Invalid total_time: must be a non-negative number');
  }

  // Validate average_time
  if (typeof data.average_time !== 'number' || data.average_time < 0) {
    errors.push('Invalid average_time: must be a non-negative number');
  }

  // Validate session_id
  if (!data.session_id || typeof data.session_id !== 'string' || data.session_id.length < 10) {
    errors.push('Invalid session_id: must be a string with at least 10 characters');
  }

  // Logical validation: score should not exceed total_questions
  if (data.score > data.total_questions) {
    errors.push('Invalid data: score cannot exceed total_questions');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to convert PracticeSummary (from QuizService) to PracticeResultSubmission.
 * Prepares data for Firestore submission.
 *
 * @param summary Practice summary from quiz service
 * @param userId Authenticated user ID
 * @param rank User's rank from profile
 * @returns Practice result submission data
 */
export function practiceSummaryToSubmission(
  summary: {
    sessionId: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number;
    averageTimePerQuestion: number;
  },
  userId: string,
  rank: string
): PracticeResultSubmission {
  return {
    user_id: userId,
    rank: rank,
    score: summary.correctAnswers,
    total_questions: summary.totalQuestions,
    accuracy: Math.round(summary.accuracy * 100) / 100, // Round to 2 decimal places
    total_time: Math.round(summary.totalTime * 100) / 100,
    average_time: Math.round(summary.averageTimePerQuestion * 100) / 100,
    session_id: summary.sessionId
  };
}
