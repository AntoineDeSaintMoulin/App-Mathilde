
import React from 'react';
import { 
  Calculator, 
  BookOpen, 
  Search, 
  FlaskConical, 
  PenTool, 
  Palette, 
  Trophy, 
  Globe 
} from 'lucide-react';
import { Subject } from './types';

export const SUBJECTS: { value: Subject; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'mathématiques', label: 'Mathématiques', color: 'bg-blue-500', icon: <Calculator size={18} /> },
  { value: 'français', label: 'Français', color: 'bg-red-500', icon: <BookOpen size={18} /> },
  { value: 'lecture', label: 'Lecture', color: 'bg-purple-500', icon: <Search size={18} /> },
  { value: 'écriture', label: 'Écriture', color: 'bg-orange-500', icon: <PenTool size={18} /> },
  { value: 'sciences', label: 'Sciences', color: 'bg-emerald-500', icon: <FlaskConical size={18} /> },
  { value: 'éveil', label: 'Éveil', color: 'bg-yellow-500', icon: <Globe size={18} /> },
  { value: 'sport', label: 'Sport', color: 'bg-indigo-500', icon: <Trophy size={18} /> },
  { value: 'arts', label: 'Arts', color: 'bg-pink-500', icon: <Palette size={18} /> },
];

export const getGradeConfig = (grade: number) => {
  if (grade < 5) return { color: 'bg-red-500', textColor: 'text-red-500', lightColor: 'bg-red-50', label: 'Insuffisant' };
  if (grade >= 5 && grade <= 7) return { color: 'bg-orange-500', textColor: 'text-orange-500', lightColor: 'bg-orange-50', label: 'Fragile' };
  return { color: 'bg-green-500', textColor: 'text-green-500', lightColor: 'bg-green-50', label: 'Acquis' };
};

export const DOMAINS: Record<Subject, string[]> = {
  mathématiques: ['Calcul mental', 'Numération', 'Géométrie', 'Mesures', 'Résolution de problèmes'],
  français: ['Grammaire', 'Conjugaison', 'Orthographe', 'Vocabulaire'],
  lecture: ['Compréhension', 'Fluidité', 'Lecture à voix haute'],
  écriture: ['Graphisme', 'Production d\'écrits', 'Copie'],
  sciences: ['Vivant', 'Matière', 'Objets techniques'],
  éveil: ['Histoire', 'Géographie', 'Vivre ensemble'],
  sport: ['Coordination', 'Esprit d\'équipe', 'Endurance'],
  arts: ['Arts plastiques', 'Musique', 'Théâtre'],
};
