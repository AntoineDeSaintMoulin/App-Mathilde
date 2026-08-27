import React from 'react';
import { Triangle, Hash, TrendingUp, BarChart2 } from 'lucide-react';
import { SubjectS1 } from './types';

export const SUBJECTS_S1: { value: SubjectS1; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'géométrie', label: 'Géométrie', color: 'bg-blue-500', icon: <Triangle size={18} /> },
  { value: 'nombres-algèbre', label: 'Nombres & Algèbre', color: 'bg-purple-500', icon: <Hash size={18} /> },
  { value: 'grandeurs-fonctions', label: 'Grandeurs & Fonctions', color: 'bg-emerald-500', icon: <TrendingUp size={18} /> },
  { value: 'statistiques', label: 'Statistiques', color: 'bg-orange-500', icon: <BarChart2 size={18} /> },
];

export const DOMAINS_S1: Record<SubjectS1, string[]> = {
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
