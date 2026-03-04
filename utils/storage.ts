import { AppData } from '../types';
import { supabase } from './supabaseClient';

const USER_ID = 'mathilde';

const DEFAULT_DATA: AppData = {
  students: [],
  activities: [],
  evaluations: [],
  weeklyComments: [],
  aiReports: [],
  notes: [],
};

export const loadData = async (): Promise<AppData> => {
  const result: AppData = { ...DEFAULT_DATA };

  const tables: { key: keyof AppData; table: string }[] = [
    { key: 'students', table: 'students' },
    { key: 'activities', table: 'activities' },
    { key: 'evaluations', table: 'evaluations' },
    { key: 'weeklyComments', table: 'weekly_comments' },
    { key: 'aiReports', table: 'ai_reports' },
    { key: 'notes', table: 'notes' },
  ];

  for (const { key, table } of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('data')
      .eq('user_id', USER_ID);
    if (!error && data) {
      (result as any)[key] = data.map((row: any) => row.data);
    }
  }

  return result;
};

const syncTable = async (table: string, rows: { id: string; user_id: string; data: any }[]) => {
  // Sécurité : si le tableau entrant est vide, on vérifie d'abord
  // qu'il n'y a pas de données existantes en base avant de supprimer
  if (rows.length === 0) {
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', USER_ID)
      .limit(1);
    if (data && data.length > 0) return; // Des données existent → on ne touche pas
  }

  await supabase.from(table).delete().eq('user_id', USER_ID);
  if (rows.length > 0) {
    await supabase.from(table).insert(rows);
  }
};

export const saveData = async (data: AppData): Promise<void> => {
  await syncTable('students', data.students.map(item => ({
    id: item.id,
    user_id: USER_ID,
    data: item
  })));

  await syncTable('activities', data.activities.map(item => ({
    id: item.id,
    user_id: USER_ID,
    data: item
  })));

  await syncTable('notes', data.notes.map(item => ({
    id: item.id,
    user_id: USER_ID,
    data: item
  })));

  await syncTable('evaluations', data.evaluations.map(eval_ => ({
    id: `${eval_.studentId}_${eval_.activityId}`,
    user_id: USER_ID,
    data: eval_
  })));

  await syncTable('weekly_comments', data.weeklyComments.map(comment => ({
    id: `${comment.studentId}_${comment.cycle}_${comment.week}`,
    user_id: USER_ID,
    data: comment
  })));

  await syncTable('ai_reports', data.aiReports.map(report => ({
    id: `${report.studentId}_${report.cycle}`,
    user_id: USER_ID,
    data: report
  })));
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]?.toString().replace(/"/g, '""') || ''}"`).join(','))
  ].join('\n');
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
