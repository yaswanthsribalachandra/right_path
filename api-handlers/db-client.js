import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  {
    global: {
      fetch: async (url, options) => {
        const res = await fetch(url, options);
        if (!res.ok && res.status >= 500) triggerRestore();
        return res;
      },
    },
  }
);

export default supabase;
