import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const USER_ID = 'mathilde';
const SESSION_ID = Math.random().toString(36).substr(2, 9);

export const usePresence = () => {
  const [conflict, setConflict] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [otherNames, setOtherNames] = useState<string[]>([]);

  useEffect(() => {
    const register = async () => {
      await supabase.from('presence').upsert({
        session_id: SESSION_ID,
        user_id: USER_ID,
        last_seen: new Date().toISOString(),
        name: USER_ID
      });
    };

    const check = async () => {
      await supabase
        .from('presence')
        .delete()
        .eq('user_id', USER_ID)
        .lt('last_seen', new Date(Date.now() - 45 * 1000).toISOString());

      const { data } = await supabase
        .from('presence')
        .select('session_id, name')
        .eq('user_id', USER_ID);

      if (data) {
        const otherSessions = data.filter(s => s.session_id !== SESSION_ID);
        setSessionCount(data.length);
        setConflict(otherSessions.length > 0);
        setOtherNames(otherSessions.map(s => s.name || 'Inconnu'));
      }
    };

    const init = async () => {
      await supabase.from('presence').delete().eq('session_id', SESSION_ID);
      await register();
      await check();
    };

    init();

    const heartbeat = setInterval(() => {
      register();
      check();
    }, 20000);

    const channel = supabase
      .channel('presence-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presence',
        filter: `user_id=eq.${USER_ID}`
      }, () => {
        check();
      })
      .subscribe();

    const cleanup = () => {
      supabase.from('presence').delete().eq('session_id', SESSION_ID);
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, []);

  return { conflict, sessionCount, otherNames };
};
