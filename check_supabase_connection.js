
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrsuvebfqubzejpmoqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
    } else {
      console.log('Successfully connected to Supabase.');
    }
  } catch (e) {
    console.error('Exception during Supabase connection check:', e.message);
  }
}

checkConnection();
