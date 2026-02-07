
export enum CategoryType {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULT_BREAKDOWN = 'MULT_BREAKDOWN',
  MULT_NEAR = 'MULT_NEAR',
  DIVISION = 'DIVISION',
  FRACTIONS = 'FRACTIONS',
  ESTIMATION = 'ESTIMATION'
}

export interface Problem {
  id: string;
  question: string;
  answer: string | number;
  options?: string[];
  trick: string;
  explanation: string;
  category: CategoryType;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserProgress {
  badges: string[]; // IDs of collected stuffy animals
  level: number;
  completedCategories: Record<CategoryType, number>;
  seenProblemIds: string[];
}

export interface CategoryInfo {
  id: CategoryType;
  title: string;
  icon: string;
  color: string;
  description: string;
  example: string;
}

export type ProblemPool = Record<CategoryType, Problem[]>;

export interface StuffyBadge {
  id: string;
  emoji: string;
  name: string;
}
