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

export const saveData = async (data: AppData): Promise<void> => {
  const withId: { key: keyof AppData; table: string }[] = [
    { key: 'students', table: 'students' },
    { key: 'activities', table: 'activities' },
    { key: 'notes', table: 'notes' },
  ];

  for (const { key, table } of withId) {
    const items = (data as any)[key] as any[];
    for (const item of items) {
      await supabase
        .from(table)
        .upsert({ id: item.id, user_id: USER_ID, data: item });
    }
  }

  for (const eval_ of data.evaluations) {
    const id = `${eval_.studentId}_${eval_.activityId}`;
    await supabase
      .from('evaluations')
      .upsert({ id, user_id: USER_ID, data: eval_ });
  }

  for (const comment of data.weeklyComments) {
    const id = `${comment.studentId}_${comment.cycle}_${comment.week}`;
    await supabase
      .from('weekly_comments')
      .upsert({ id, user_id: USER_ID, data: comment });
  }

  for (const report of data.aiReports) {
    const id = `${report.studentId}_${report.cycle}`;
    await supabase
      .from('ai_reports')
      .upsert({ id, user_id: USER_ID, data: report });
  }
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
