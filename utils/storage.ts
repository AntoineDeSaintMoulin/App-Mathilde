import { Student, Activity, Evaluation, WeeklyComment, AIReport, Note } from '../types';
import { supabase } from './supabaseClient';

// ============================================================
// CLASSES
// ============================================================
export interface ClassInfo {
  id: string;
  name: string;
  level: string;
  subject: string;
}

export const fetchClasses = async (userId: string): Promise<ClassInfo[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    name: row.name,
    level: row.level,
    subject: row.subject,
  }));
};

export const createClass = async (userId: string, name: string, level: string, subject: string): Promise<ClassInfo | null> => {
  const { data, error } = await supabase
    .from('classes')
    .insert({ user_id: userId, name, level, subject })
    .select()
    .single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, level: data.level, subject: data.subject };
};

export const deleteClass = async (classId: string) => {
  await supabase.from('classes').delete().eq('id', classId);
};

// ============================================================
// CHARGEMENT INITIAL — filtré par class_id
// ============================================================
export const fetchAll = async (classId: string) => {
  const [
    studentsRes,
    activitiesRes,
    evaluationsRes,
    weeklyCommentsRes,
    aiReportsRes,
    notesRes,
  ] = await Promise.all([
    supabase.from('students').select('*').eq('class_id', classId).order('last_name', { ascending: true }),
    supabase.from('activities').select('*').eq('class_id', classId).order('date', { ascending: false }),
    supabase.from('evaluations').select('*').eq('class_id', classId),
    supabase.from('weekly_comments').select('*').eq('class_id', classId),
    supabase.from('ai_reports').select('*').eq('class_id', classId),
    supabase.from('notes').select('*').eq('class_id', classId).order('updated_at', { ascending: false }),
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
// MAPPERS
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
  cycle: Number(row.cycle) || 1,
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
export const dbAddStudent = async (student: Student, userId: string, classId: string) => {
  await supabase.from('students').insert({
    id: student.id,
    user_id: userId,
    class_id: classId,
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
export const dbAddActivity = async (activity: Activity, userId: string, classId: string) => {
  await supabase.from('activities').insert({
    id: activity.id,
    user_id: userId,
    class_id: classId,
    title: activity.title,
    date: activity.date,
    cycle: activity.cycle,
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
    cycle: activity.cycle,
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
export const dbSaveEvaluation = async (evaluation: Evaluation, userId: string, classId: string) => {
  const id = `${evaluation.studentId}_${evaluation.activityId}`;
  await supabase.from('evaluations').upsert({
    id,
    user_id: userId,
    class_id: classId,
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
export const dbSaveWeeklyComment = async (comment: WeeklyComment, userId: string, classId: string) => {
  const id = `${comment.studentId}_${comment.cycle}_${comment.week}`;
  await supabase.from('weekly_comments').upsert({
    id,
    user_id: userId,
    class_id: classId,
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
export const dbSaveAIReport = async (report: AIReport, userId: string, classId: string) => {
  const id = `${report.studentId}_${report.cycle}`;
  await supabase.from('ai_reports').upsert({
    id,
    user_id: userId,
    class_id: classId,
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
export const dbAddNote = async (note: Note, userId: string, classId: string) => {
  await supabase.from('notes').insert({
    id: note.id,
    user_id: userId,
    class_id: classId,
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
// EXPORT JSON
// ============================================================
export const uploadBackup = async (data: any, profName: string, className: string) => {
  const date = new Date().toISOString().split('T')[0];
  const safeProfName = profName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const safeClassName = className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `${safeProfName}_${safeClassName}_${date}.json`;

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob, filename);

  try {
    await fetch('https://dsmserver.myqnapcloud.com:5001/api/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': '9waQ2nloFhl4v8kSTk5afvSiPySNKFnSLzN5mHepquY',
      },
      body: formData,
    });
    console.log(`Backup envoyé : ${filename}`);
  } catch (error) {
    console.error('Erreur upload backup:', error);
  }
};

  try {
    await fetch('https://dsmserver.myqnapcloud.com:5001/api/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': '9waQ2nloFhl4v8kSTk5afvSiPySNKFnSLzN5mHepquY',
      },
      body: formData,
    });
    console.log('Backup envoyé au serveur');
  } catch (error) {
    console.error('Erreur upload backup:', error);
  }
};
