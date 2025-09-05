const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrsuvebfqubzejpmoqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getFunctionCode() {
  try {
    const { data, error } = await supabase.rpc('get_function_def', { func_name: 'get_user_conversations' });
    if (error) {
      console.error('Error getting function code:', error.message);
    } else {
      console.log(data);
    }
  } catch (e) {
    console.error('Exception during function code retrieval:', e.message);
  }
}

getFunctionCode();
