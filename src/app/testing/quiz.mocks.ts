import { Flag } from '../core/services/flag.service';
import { Question, AnswerOption, QuizState, QuizResults, AnswerResult } from '../core/services/quiz.service';

/**
 * Create a mock Flag for testing
 */
export function createMockFlag(overrides?: Partial<Flag>): Flag {
  return {
    id: 'alpha',
    name: 'Alpha',
    meaning: 'Diver down; keep clear',
    category: 'letters',
    imagePath: 'assets/flags/Alpha.png',
    ...overrides
  };
}

/**
 * Create multiple mock flags
 */
export function createMockFlags(count: number = 5): Flag[] {
  const letters = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
  const meanings = [
    'Diver down; keep clear',
    'Dangerous cargo',
    'Yes / Affirmative',
    'Keep clear of me',
    'Altering course to starboard',
    'I am disabled',
    'I require a pilot',
    'I have a pilot on board'
  ];

  return Array.from({ length: Math.min(count, letters.length) }, (_, i) => ({
    id: letters[i].toLowerCase(),
    name: letters[i],
    meaning: meanings[i],
    category: 'letters' as const,
    imagePath: `assets/flags/${letters[i]}.png`
  }));
}

/**
 * Create mock answer options
 */
export function createMockAnswerOptions(correctAnswer: string, incorrectAnswers: string[]): AnswerOption[] {
  const options: AnswerOption[] = [
    { id: 'correct', text: correctAnswer, isCorrect: true }
  ];

  incorrectAnswers.forEach((answer, index) => {
    options.push({
      id: `wrong_${index}`,
      text: answer,
      isCorrect: false
    });
  });

  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Create a mock Question
 */
export function createMockQuestion(overrides?: Partial<Question>): Question {
  const flag = createMockFlag();
  return {
    id: 'q1',
    flagId: flag.id,
    flag,
    quizType: 'identify-name',
    options: createMockAnswerOptions('Alpha', ['Bravo', 'Charlie', 'Delta']),
    correctAnswerId: 'correct',
    questionNumber: 1,
    totalQuestions: 10,
    ...overrides
  };
}

/**
 * Create mock quiz state
 */
export function createMockQuizState(overrides?: Partial<QuizState>): QuizState {
  return {
    mode: 'practice',
    totalQuestions: 10,
    currentQuestionIndex: 0,
    currentQuestion: createMockQuestion(),
    answeredQuestions: [],
    score: 0,
    accuracy: 0,
    startTime: new Date(),
    endTime: null,
    isActive: true,
    ...overrides
  };
}

/**
 * Create mock answer result
 */
export function createMockAnswerResult(overrides?: Partial<AnswerResult>): AnswerResult {
  const flag = createMockFlag();
  return {
    questionId: 'q1',
    selectedAnswerId: 'correct',
    correctAnswerId: 'correct',
    isCorrect: true,
    timeSpent: 3000,
    flag,
    ...overrides
  };
}

/**
 * Create mock quiz results
 */
export function createMockQuizResults(overrides?: Partial<QuizResults>): QuizResults {
  return {
    mode: 'practice',
    totalQuestions: 10,
    correctAnswers: 8,
    accuracy: 80,
    totalTime: 120000,
    averageTimePerQuestion: 12000,
    rating: 85,
    answers: [
      createMockAnswerResult(),
      createMockAnswerResult({ isCorrect: false, selectedAnswerId: 'wrong_0' })
    ],
    completedAt: new Date(),
    ...overrides
  };
}

/**
 * Create a sequence of mock questions for testing quiz flow
 */
export function createMockQuestionSequence(count: number): Question[] {
  const flags = createMockFlags(count);
  return flags.map((flag, index) => ({
    id: `q${index + 1}`,
    flagId: flag.id,
    flag,
    quizType: index % 2 === 0 ? 'identify-name' : 'identify-meaning',
    options: createMockAnswerOptions(
      index % 2 === 0 ? flag.name : flag.meaning,
      ['Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3']
    ),
    correctAnswerId: 'correct',
    questionNumber: index + 1,
    totalQuestions: count
  }));
}

/**
 * Simulate answering questions correctly
 */
export function createCorrectAnswerSequence(questions: Question[]): AnswerResult[] {
  return questions.map((question, index) => ({
    questionId: question.id,
    selectedAnswerId: question.correctAnswerId,
    correctAnswerId: question.correctAnswerId,
    isCorrect: true,
    timeSpent: 2000 + Math.random() * 3000,
    flag: question.flag
  }));
}

/**
 * Simulate answering questions with mixed results
 */
export function createMixedAnswerSequence(questions: Question[], correctPercentage: number = 0.7): AnswerResult[] {
  return questions.map((question, index) => {
    const isCorrect = Math.random() < correctPercentage;
    const incorrectOption = question.options.find(opt => !opt.isCorrect);

    return {
      questionId: question.id,
      selectedAnswerId: isCorrect ? question.correctAnswerId : incorrectOption!.id,
      correctAnswerId: question.correctAnswerId,
      isCorrect,
      timeSpent: 2000 + Math.random() * 5000,
      flag: question.flag
    };
  });
}
