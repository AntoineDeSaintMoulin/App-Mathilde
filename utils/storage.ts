import { AppData } from '../types';
import { supabase } from './supabaseClient';

const USER_ID = 'mathilde';

const DEFAULT_DATA: AppData = {
  students: [],
  activities: [],
  evaluations: [],
  weeklyComments: [],
  aiReports: [],
};

const tableMap: Record<keyof AppData, string> = {
  students: 'students',
  activities: 'activities',
  evaluations: 'evaluations',
  weeklyComments: 'weekly_comments',
  aiReports: 'ai_reports',
};

export const loadData = async (): Promise<AppData> => {
  const result: AppData = { ...DEFAULT_DATA };

  for (const [key, table] of Object.entries(tableMap)) {
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
  for (const [key, table] of Object.entries(tableMap)) {
    const items = (data as any)[key] as any[];

    for (const item of items) {
      await supabase
        .from(table)
        .upsert({ id: item.id, user_id: USER_ID, data: item });
    }
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
