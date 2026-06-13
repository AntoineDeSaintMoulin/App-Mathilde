import { supabase } from './supabaseClient';

const LAST_PING_KEY = 'supabase_last_ping';
const PING_INTERVAL_DAYS = 4;

export const keepAlive = async () => {
  const lastPing = localStorage.getItem(LAST_PING_KEY);
  const now = Date.now();

  if (!lastPing || now - parseInt(lastPing) > PING_INTERVAL_DAYS * 24 * 60 * 60 * 1000) {
    try {
      await supabase.from('students').select('id').limit(1);
      localStorage.setItem(LAST_PING_KEY, now.toString());
    } catch (e) {
      console.error('Supabase keepAlive ping échoué', e);
    }
  }
};
