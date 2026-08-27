// ============================================================
// storage.ts — Gestion de la persistance via Supabase
// Écriture directe dans Supabase à chaque modification
// Realtime géré dans App.tsx via un channel Supabase
// ============================================================

import { Student, Activity, Evaluation, WeeklyComment, AIReport, Note } from '../types';
import { supabase } from './supabaseClient';

// ============================================================
// CHARGEMENT INITIAL — Charge toutes les tables en parallèle
// ============================================================
export const fetchAll = async () => {
  const [
    studentsRes,
    activitiesRes,
    evaluationsRes,
    weeklyCommentsRes,
    aiReportsRes,
    notesRes,
  ] = await Promise.all([
    supabase.from('students').select('*').order('last_name', { ascending: true }),
    supabase.from('activities').select('*').order('date', { ascending: false }),
    supabase.from('evaluations').select('*'),
    supabase.from('weekly_comments').select('*'),
    supabase.from('ai_reports').select('*'),
    supabase.from('notes').select('*').order('updated_at', { ascending: false }),
  ]);

  return {
    students: (studentsRes.data || []).map(mapStudent),
    activities: (activitiesRes.data || []).map(mapActivity),
    evaluations: (evaluationsRes.data || []).map(mapEvaluation),
    weeklyComments: (weeklyCommentsRes.data || []).map(mapWeeklyComment),
    aiReports: (aiReportsRes.data || []).map(mapAIReport),
    notes: (notesRes.data || []).map(mapNote),
    _loadError: !!(studentsRes.error || activitiesRes.error || evaluationsRes.error),
  };
};

// ============================================================
// MAPPERS — Convertit les lignes Supabase (snake_case) vers les types de l'app (camelCase)
// ============================================================
const mapStudent = (row: any): Student => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  observations: row.observations || '',
  birthDate: row.birth_date || '',
  parentPhones: row.parent_phones || '',
});

const mapActivity = (row: any): Activity => ({
  id: row.id,
  title: row.title,
  date: row.date,
  subject: row.subject,
  domain: row.domain,
  difficulty: row.difficulty,
  description: row.description || '',
  objective: row.objective || '',
  competencies: row.competencies || '',
  material: row.material || '',
});

const mapEvaluation = (row: any): Evaluation => ({
  studentId: row.student_id,
  activityId: row.activity_id,
  isPresent: row.is_present,
  grade: Number(row.grade),
  comment: row.comment || '',
});

const mapWeeklyComment = (row: any): WeeklyComment => ({
  studentId: row.student_id,
  cycle: row.cycle,
  week: row.week,
  content: row.content || '',
});

const mapAIReport = (row: any): AIReport => ({
  studentId: row.student_id,
  cycle: row.cycle,
  content: row.content,
  generatedAt: row.generated_at,
});

const mapNote = (row: any): Note => ({
  id: row.id,
  title: row.title || '',
  content: row.content || '',
  todos: row.todos || [],
  updatedAt: row.updated_at,
});

// ============================================================
// ÉLÈVES
// ============================================================
export const dbAddStudent = async (student: Student) => {
  await supabase.from('students').insert({
    id: student.id,
    first_name: student.firstName,
    last_name: student.lastName,
    observations: student.observations,
    birth_date: student.birthDate || '',
    parent_phones: student.parentPhones || '',
  });
};

export const dbUpdateStudent = async (student: Student) => {
  await supabase.from('students').update({
    first_name: student.firstName,
    last_name: student.lastName,
    observations: student.observations,
    birth_date: student.birthDate || '',
    parent_phones: student.parentPhones || '',
  }).eq('id', student.id);
};

export const dbDeleteStudent = async (id: string) => {
  await supabase.from('students').delete().eq('id', id);
};

// ============================================================
// ACTIVITÉS
// ============================================================
export const dbAddActivity = async (activity: Activity) => {
  await supabase.from('activities').insert({
    id: activity.id,
    title: activity.title,
    date: activity.date,
    subject: activity.subject,
    domain: activity.domain,
    difficulty: activity.difficulty,
    description: activity.description,
    objective: activity.objective || '',
    competencies: activity.competencies,
    material: activity.material || '',
  });
};

export const dbUpdateActivity = async (activity: Activity) => {
  await supabase.from('activities').update({
    title: activity.title,
    date: activity.date,
    subject: activity.subject,
    domain: activity.domain,
    difficulty: activity.difficulty,
    description: activity.description,
    objective: activity.objective || '',
    competencies: activity.competencies,
    material: activity.material || '',
  }).eq('id', activity.id);
};

export const dbDeleteActivity = async (id: string) => {
  await supabase.from('activities').delete().eq('id', id);
};

// ============================================================
// ÉVALUATIONS
// ============================================================
export const dbSaveEvaluation = async (evaluation: Evaluation) => {
  const id = `${evaluation.studentId}_${evaluation.activityId}`;
  await supabase.from('evaluations').upsert({
    id,
    student_id: evaluation.studentId,
    activity_id: evaluation.activityId,
    is_present: evaluation.isPresent,
    grade: evaluation.grade,
    comment: evaluation.comment,
  });
};

export const dbDeleteEvaluationsForActivity = async (activityId: string) => {
  await supabase.from('evaluations').delete().eq('activity_id', activityId);
};

export const dbDeleteEvaluationsForStudent = async (studentId: string) => {
  await supabase.from('evaluations').delete().eq('student_id', studentId);
};

// ============================================================
// COMMENTAIRES HEBDOMADAIRES
// ============================================================
export const dbSaveWeeklyComment = async (comment: WeeklyComment) => {
  const id = `${comment.studentId}_${comment.cycle}_${comment.week}`;
  await supabase.from('weekly_comments').upsert({
    id,
    student_id: comment.studentId,
    cycle: comment.cycle,
    week: comment.week,
    content: comment.content,
  });
};

export const dbDeleteWeeklyCommentsForStudent = async (studentId: string) => {
  await supabase.from('weekly_comments').delete().eq('student_id', studentId);
};

// ============================================================
// RAPPORTS IA
// ============================================================
export const dbSaveAIReport = async (report: AIReport) => {
  const id = `${report.studentId}_${report.cycle}`;
  await supabase.from('ai_reports').upsert({
    id,
    student_id: report.studentId,
    cycle: report.cycle,
    content: report.content,
    generated_at: report.generatedAt,
  });
};

export const dbDeleteAIReportsForStudent = async (studentId: string) => {
  await supabase.from('ai_reports').delete().eq('student_id', studentId);
};

// ============================================================
// NOTES
// ============================================================
export const dbAddNote = async (note: Note) => {
  await supabase.from('notes').insert({
    id: note.id,
    title: note.title,
    content: note.content,
    todos: note.todos,
    updated_at: note.updatedAt,
  });
};

export const dbUpdateNote = async (note: Note) => {
  await supabase.from('notes').update({
    title: note.title,
    content: note.content,
    todos: note.todos,
    updated_at: note.updatedAt,
  }).eq('id', note.id);
};

export const dbDeleteNote = async (id: string) => {
  await supabase.from('notes').delete().eq('id', id);
};

// ============================================================
// EXPORT JSON — Backup complet
// ============================================================
export const exportJSON = (data: any) => {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `backup-1MA-${date}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
