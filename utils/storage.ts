// ============================================================
// storage.ts — Gestion de la persistance des données via Supabase
// Toutes les données de l'app sont stockées dans Supabase (PostgreSQL cloud).
// Ce fichier gère le chargement, la sauvegarde et l'export des données.
// ============================================================

import { AppData } from '../types';
import { supabase } from './supabaseClient';

// Identifiant fixe de l'utilisatrice — toutes les données sont filtrées par cet ID
const USER_ID = 'mathilde';

// Structure vide par défaut — utilisée comme base lors du chargement
// Si une table est vide en base, elle sera initialisée avec un tableau vide
const DEFAULT_DATA: AppData = {
  students: [],
  activities: [],
  evaluations: [],
  weeklyComments: [],
  aiReports: [],
  notes: [],
};

// ============================================================
// CHARGEMENT — Récupère toutes les données depuis Supabase
// ============================================================
export const loadData = async (): Promise<AppData> => {
  // On part des données vides par défaut
  const result: AppData = { ...DEFAULT_DATA };
  
  // Drapeau qui sera mis à true si une erreur Supabase survient
  // (ex: base en pause, réseau coupé, problème d'authentification)
  let hasError = false;

  // Liste de toutes les tables à charger avec leur correspondance
  // entre la clé TypeScript (ex: weeklyComments) et le nom de table Supabase (ex: weekly_comments)
  const tables: { key: keyof AppData; table: string }[] = [
    { key: 'students', table: 'students' },
    { key: 'activities', table: 'activities' },
    { key: 'evaluations', table: 'evaluations' },
    { key: 'weeklyComments', table: 'weekly_comments' },
    { key: 'aiReports', table: 'ai_reports' },
    { key: 'notes', table: 'notes' },
  ];

  // On charge chaque table une par une
  for (const { key, table } of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('data')         // On ne récupère que la colonne 'data' (le JSON de chaque entrée)
      .eq('user_id', USER_ID); // On filtre uniquement les données de Mathilde

    if (error) {
      // Erreur Supabase — on note l'erreur mais on continue pour les autres tables
      // Le drapeau hasError permettra de bloquer toute sauvegarde ultérieure
      hasError = true;
      console.error(`Erreur chargement ${table}:`, error);
    } else if (data) {
      // Succès — on extrait le contenu JSON de chaque ligne et on peuple le résultat
      (result as any)[key] = data.map((row: any) => row.data);
    }
  }

  // On attache le drapeau d'erreur aux données retournées
  // Ce drapeau sera lu par saveData pour bloquer toute sauvegarde si le chargement a échoué
  (result as any)._loadError = hasError;
  return result;
};

// ============================================================
// PROTECTION INDIVIDUELLE PAR TABLE
// Synchronise une table Supabase avec les données locales
// avec une protection contre l'écrasement accidentel de données existantes
// ============================================================
const syncTable = async (table: string, rows: { id: string; user_id: string; data: any }[]) => {
  
  // PROTECTION CLÉ : avant toute suppression, on vérifie si la table
  // contient déjà des données en base
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', USER_ID)
    .limit(1); // On ne récupère qu'une ligne — on veut juste savoir si la table est vide ou non

  // Si la table est PLEINE en base ET qu'on veut sauvegarder des données VIDES
  // → c'est suspect, on bloque pour éviter d'écraser des données existantes
  // Cas typique : Supabase était en pause, l'app a chargé des données vides,
  // et maintenant elle veut écraser les vraies données avec du vide
  if (existing && existing.length > 0 && rows.length === 0) {
    console.warn(`Sauvegarde bloquée pour ${table} — tentative d'écrasement avec données vides`);
    return; // On sort sans rien modifier
  }

  // Cas normal : on supprime les anciennes données puis on réinsère les nouvelles
  // C'est une stratégie "remplace tout" qui garantit la cohérence
  await supabase.from(table).delete().eq('user_id', USER_ID);
  if (rows.length > 0) {
    await supabase.from(table).insert(rows);
  }
};

// ============================================================
// SAUVEGARDE — Envoie toutes les données locales vers Supabase
// Deux niveaux de protection avant toute écriture
// ============================================================
export const saveData = async (data: AppData): Promise<void> => {

  // PROTECTION NIVEAU 1 : si loadData a détecté une erreur Supabase,
  // on bloque immédiatement toute sauvegarde — les données en mémoire
  // ne sont pas fiables car elles n'ont pas été correctement chargées
  if ((data as any)._loadError) {
    throw new Error('Données non fiables — sauvegarde bloquée');
  }

  // PROTECTION NIVEAU 2 : si students, activities ET evaluations sont tous vides
  // simultanément, c'est anormal — une vraie classe a toujours au moins un élève
  // Cela indique très probablement un chargement raté sans erreur explicite
  if (data.activities.length === 0 && data.evaluations.length === 0 && data.students.length === 0) {
    console.warn('Sauvegarde bloquée — données suspectes (tout est vide)');
    throw new Error('Données suspectes — sauvegarde bloquée');
  }

  // Sauvegarde de chaque table via syncTable qui applique sa propre protection individuelle
  
  // Élèves — identifiés par leur id unique
  await syncTable('students', data.students.map(item => ({
    id: item.id,
    user_id: USER_ID,
    data: item
  })));

  // Activités pédagogiques — identifiées par leur id unique
  await syncTable('activities', data.activities.map(item => ({
    id: item.id,
    user_id: USER_ID,
    data: item
  })));

  // Notes personnelles — identifiées par leur id unique
  await syncTable('notes', data.notes.map(item => ({
    id: item.id,
    user_id: USER_ID,
    data: item
  })));

  // Évaluations — identifiées par la combinaison élève + activité
  // (un élève ne peut avoir qu'une évaluation par activité)
  await syncTable('evaluations', data.evaluations.map(eval_ => ({
    id: `${eval_.studentId}_${eval_.activityId}`,
    user_id: USER_ID,
    data: eval_
  })));

  // Commentaires hebdomadaires — identifiés par élève + cycle + semaine
  // (un commentaire unique par élève, par semaine, par trimestre)
  await syncTable('weekly_comments', data.weeklyComments.map(comment => ({
    id: `${comment.studentId}_${comment.cycle}_${comment.week}`,
    user_id: USER_ID,
    data: comment
  })));

  // Rapports IA — identifiés par élève + cycle
  // (un rapport unique par élève, par trimestre)
  await syncTable('ai_reports', data.aiReports.map(report => ({
    id: `${report.studentId}_${report.cycle}`,
    user_id: USER_ID,
    data: report
  })));
};

// ============================================================
// EXPORT CSV — Génère et télécharge un fichier CSV
// Utilisé pour exporter les données de synthèse
// ============================================================
export const exportToCSV = (data: any[], filename: string) => {
  // Si pas de données, on ne génère rien
  if (data.length === 0) return;

  // On récupère les en-têtes depuis les clés du premier objet
  const headers = Object.keys(data[0]);

  // On construit le contenu CSV :
  // - première ligne : les en-têtes
  // - lignes suivantes : les valeurs, entourées de guillemets pour gérer les virgules et accents
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => 
      `"${row[header]?.toString().replace(/"/g, '""') || ''}"`
    ).join(','))
  ].join('\n');

  // On crée un fichier blob et on déclenche le téléchargement
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
