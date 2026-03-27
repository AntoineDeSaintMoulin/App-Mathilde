import React from 'react';
import { Calculator, BookOpen } from 'lucide-react';
import { Subject } from './types';

export const SUBJECTS: { value: Subject; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'mathématiques', label: 'Mathématiques', color: 'bg-blue-500', icon: <Calculator size={18} /> },
  { value: 'français', label: 'Français', color: 'bg-red-500', icon: <BookOpen size={18} /> },
];

export const getGradeConfig = (grade: number) => {
  if (grade < 5) return { color: 'bg-red-500', textColor: 'text-red-500', lightColor: 'bg-red-50', label: 'Insuffisant' };
  if (grade >= 5 && grade <= 7) return { color: 'bg-orange-500', textColor: 'text-orange-500', lightColor: 'bg-orange-50', label: 'Fragile' };
  return { color: 'bg-green-500', textColor: 'text-green-500', lightColor: 'bg-green-50', label: 'Acquis' };
};

export const DOMAINS: Record<Subject, string[]> = {
  mathématiques: ['Dénombrer', 'Dictée', 'Comparer', 'Situer', 'Décomposer', 'Histoire', 'Calculs', 'Cartes-nombres'],
  français: ['Mots-clics', 'Entendre', 'Voir', 'Lecture', 'Genre', 'Mots-images', 'Dictée', 'Segmentation', 'Calligraphie'],
  lecture: [],
  écriture: [],
  sciences: [],
  éveil: [],
  sport: [],
  arts: [],
};
