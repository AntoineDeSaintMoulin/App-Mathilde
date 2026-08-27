import React from 'react';
import { Triangle, Hash, TrendingUp, BarChart2 } from 'lucide-react';

export type SubjectS1Math =
  | 'géométrie'
  | 'nombres-algèbre'
  | 'grandeurs-fonctions'
  | 'statistiques';

export const SUBJECTS_S1MATH: { value: SubjectS1Math; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'géométrie', label: 'Géométrie', color: 'bg-blue-500', icon: <Triangle size={18} /> },
  { value: 'nombres-algèbre', label: 'Nombres & Algèbre', color: 'bg-purple-500', icon: <Hash size={18} /> },
  { value: 'grandeurs-fonctions', label: 'Grandeurs & Fonctions', color: 'bg-emerald-500', icon: <TrendingUp size={18} /> },
  { value: 'statistiques', label: 'Statistiques', color: 'bg-orange-500', icon: <BarChart2 size={18} /> },
];

export const DOMAINS_S1MATH: Record<SubjectS1Math, string[]> = {
  'géométrie': [
    'Repère cartésien',
    'Médiatrice et bissectrice',
    'Théorème de Pythagore',
    'Théorème de Thalès',
    'Symétries et agrandissements',
    'Périmètres, aires et volumes',
  ],
  'nombres-algèbre': [
    'Entiers relatifs',
    'Fractions et rationnels',
    'Racines carrées',
    'Expressions algébriques',
    'Équations du 1er degré',
    'Priorité des opérations',
  ],
  'grandeurs-fonctions': [
    'Proportionnalité',
    'Fonctions du 1er degré',
    'Représentations graphiques',
    'Aires et volumes avec lettre',
  ],
  'statistiques': [
    'Population et effectifs',
    'Fréquences',
    'Diagrammes statistiques',
    'Moyenne',
    'Médiane',
  ],
};

export const getGradeConfigS1 = (grade: number) => {
  if (grade < 10) return { color: 'bg-red-500', textColor: 'text-red-500', lightColor: 'bg-red-50', label: 'Insuffisant' };
  if (grade >= 10 && grade <= 13) return { color: 'bg-orange-500', textColor: 'text-orange-500', lightColor: 'bg-orange-50', label: 'Fragile' };
  return { color: 'bg-green-500', textColor: 'text-green-500', lightColor: 'bg-green-50', label: 'Acquis' };
};
