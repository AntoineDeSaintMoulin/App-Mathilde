
export type Subject = 'mathématiques' | 'français' | 'éveil' | 'sciences' | 'lecture' | 'écriture' | 'sport' | 'arts';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  observations: string;
  birthDate?: string;
  parentPhones?: string;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  subject: Subject;
  domain: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  objective?: string; // Optionnel
  competencies: string;
  material?: string;
}

export interface Evaluation {
  studentId: string;
  activityId: string;
  isPresent: boolean;
  grade: number; // Note sur 10
  comment: string;
}

export interface WeeklyComment {
  studentId: string;
  cycle: number;
  week: number;
  content: string;
}

export interface AIReport {
  studentId: string;
  cycle: number;
  content: string;
  generatedAt: string;
}

export interface AppData {
  students: Student[];
  activities: Activity[];
  evaluations: Evaluation[];
  weeklyComments: WeeklyComment[];
  aiReports: AIReport[];
  notes: Note[];
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  todos: TodoItem[];
  updatedAt: string;
}
