
const { createClient } = require('@supabase/supabase-js');

// معلومات الاتصال بقاعدة البيانات
const supabaseUrl = 'https://vrsuvebfqubzejpmoqqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q';

// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// دالة لإصلاح البيانات غير المتسقة
async function fixArchivedData() {
  try {
    console.log('بدء إصلاح البيانات غير المتسقة...');

    // 1. إصلاح الحالات حيث is_archived = true ولكن archived_at = null
    console.log('إصلاح الحالات حيث is_archived = true ولكن archived_at = null...');
    const { data: data1, error: error1 } = await supabase
      .from('user_conversation_settings')
      .update({ archived_at: new Date().toISOString() })
      .eq('is_archived', true)
      .is('archived_at', null);

    if (error1) {
      console.error('خطأ في إصلاح الحالات حيث is_archived = true ولكن archived_at = null:', error1);
    } else {
      console.log('تم إصلاح', data1?.length || 0, 'حالة حيث is_archived = true ولكن archived_at = null');
    }

    // 2. إصلاح الحالات حيث is_archived = false ولكن archived_at ليس null
    console.log('إصلاح الحالات حيث is_archived = false ولكن archived_at ليس null...');
    const { data: data2, error: error2 } = await supabase
      .from('user_conversation_settings')
      .update({ archived_at: null })
      .eq('is_archived', false)
      .not('archived_at', 'is', null);

    if (error2) {
      console.error('خطأ في إصلاح الحالات حيث is_archived = false ولكن archived_at ليس null:', error2);
    } else {
      console.log('تم إصلاح', data2?.length || 0, 'حالة حيث is_archived = false ولكن archived_at ليس null');
    }

    console.log('اكتمل إصلاح البيانات غير المتسقة');
  } catch (error) {
    console.error('حدث خطأ غير متوقع:', error);
  }
}

// تنفيذ الدالة
fixArchivedData();
