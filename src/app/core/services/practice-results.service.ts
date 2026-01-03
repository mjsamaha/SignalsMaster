/**
 * PracticeResultsService - Manages practice quiz results in Firestore.
 * MVP Phase 1: Handles submission of practice results for authenticated users.
 *
 * Collection: practice_results
 * Privacy: Users can only read/write their own practice results
 */

import { Injectable, NgZone, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { User } from '../models/user.model';
import {
  PracticeResultSubmission,
  validatePracticeResultSubmission,
  practiceSummaryToSubmission,
} from '../models/practice-result.model';

/**
 * Response structure for practice result submission.
 */
export interface PracticeSubmissionResponse {
  success: boolean;
  message: string;
  resultId?: string; // Firestore document ID if successful
}

@Injectable({
  providedIn: 'root'
})
export class PracticeResultsService {
  private readonly firestore = inject(Firestore);
  private readonly ngZone = inject(NgZone);
  private readonly collectionName = 'practice_results';

  constructor() {
    console.log('[PracticeResultsService] Initialized with Firestore:', !!this.firestore);
  }

  /**
   * Submit practice quiz results to Firestore.
   * Validates data, adds server timestamps, and saves to practice_results collection.
   *
   * @param user Authenticated user submitting the results
   * @param summary Practice quiz summary from QuizService
   * @returns Promise with submission response
   */
  async submitPracticeResult(
    user: User,
    summary: {
      sessionId: string;
      totalQuestions: number;
      correctAnswers: number;
      accuracy: number;
      totalTime: number;
      averageTimePerQuestion: number;
    }
  ): Promise<PracticeSubmissionResponse> {
    console.log('[PracticeResultsService] submitPracticeResult called', {
      userId: user.user_id,
      sessionId: summary.sessionId,
      score: summary.correctAnswers,
      totalQuestions: summary.totalQuestions
    });

    try {
      // Validate user
      if (!user || !user.user_id) {
        console.error('[PracticeResultsService] Invalid user data');
        return {
          success: false,
          message: 'User authentication required'
        };
      }

      // Convert summary to submission format
      const submission = practiceSummaryToSubmission(
        summary,
        user.user_id,
        user.rank
      );

      console.log('[PracticeResultsService] Converted summary to submission:', submission);

      // Validate submission data
      const validation = validatePracticeResultSubmission(submission);
      if (!validation.valid) {
        console.error('[PracticeResultsService] Validation failed:', validation.errors);
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      console.log('[PracticeResultsService] Validation passed, preparing document data');

      // Prepare document data - MUST MATCH FIRESTORE RULES SCHEMA
      const docData = {
        user_id: submission.user_id,
        rank: submission.rank,
        score: submission.score,
        total_questions: submission.total_questions,
        accuracy: submission.accuracy,
        total_time: submission.total_time,
        average_time: submission.average_time,
        session_id: submission.session_id,
        completed_at: serverTimestamp(),
        created_at: serverTimestamp()
      };

      console.log('[PracticeResultsService] Prepared document data:', {
        user_id: docData.user_id,
        rank: docData.rank,
        score: docData.score,
        session_id: docData.session_id
      });

      console.log('[PracticeResultsService] Submitting to Firestore...');

      // Wrap Firestore operation in ngZone for proper Angular change detection
      const docRef = await this.ngZone.run(async () => {
        const ref = await addDoc(
          collection(this.firestore, this.collectionName),
          docData
        );
        return ref;
      });

      console.log('[PracticeResultsService] Document added successfully, ID:', docRef.id);

      return {
        success: true,
        message: 'Practice results saved successfully!',
        resultId: docRef.id
      };

    } catch (error: any) {
      console.error('[PracticeResultsService] Error submitting practice result:', {
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error',
        errorType: error.constructor?.name,
        fullError: error
      });

      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.error('[PracticeResultsService] Permission denied - check Firestore security rules');
        return {
          success: false,
          message: 'Permission denied. Please ensure you are logged in.'
        };
      }

      if (error.code === 'invalid-argument') {
        console.error('[PracticeResultsService] Invalid argument - data validation failed in Firestore');
        return {
          success: false,
          message: 'Invalid data format. Please try again.'
        };
      }

      if (error.code === 'unavailable') {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.'
        };
      }

      return {
        success: false,
        message: 'Failed to save practice results. Please try again.'
      };
    }
  }
}
