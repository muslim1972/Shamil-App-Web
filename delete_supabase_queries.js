
// سكربت JavaScript لحذف الاستعلامات من Supabase عبر واجهة المتصفح
// يمكنك نسخ هذا الكود ولصقه في وحدة تحكم المتصفح (F12 > Console) في صفحة Supabase

// 1. تعريف معلومات المشروع
const projectId = "xuigvkwnjnfgxxnuhnhr";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWd2a3duam5mZ3h4bnVobmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc1MzA2NywiZXhwIjoyMDY3MzI5MDY3fQ.dkPEz8xBkKPCI8Wquc1PMoZbGmIB7rRqdQ31KHTaf3g";

// 2. دالة للحصول على قائمة جميع الاستعلامات
async function getAllSnippets() {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/sql/snippets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch snippets: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return [];
  }
}

// 3. دالة لحذف استعلام محدد
async function deleteSnippet(snippetId) {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/sql/snippets/${snippetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete snippet: ${response.status} ${response.statusText}`);
    }

    return { success: true, snippetId };
  } catch (error) {
    console.error(`Error deleting snippet ${snippetId}:`, error);
    return { success: false, snippetId, error: error.message };
  }
}

// 4. دالة رئيسية لحذف الاستعلامات غير الضرورية
async function cleanupSnippets() {
  console.log('Starting cleanup process...');

  // الحصول على جميع الاستعلامات
  const snippets = await getAllSnippets();
  console.log(`Found ${snippets.length} snippets`);

  // تحديد الاستعلامات المهمة التي يجب الاحتفاظ بها
  const importantKeywords = [
    'ensure_user_exists',
    'check_user_exists',
    'create_or_get_conversation_with_user',
    'users',
    'conversations',
    'messages',
    'profiles',
    'push_tokens',
    'RLS',
    'policy',
    'trigger',
    'function',
    'table'
  ];

  // تصفية الاستعلامات المهمة
  const importantSnippets = snippets.filter(snippet => {
    const name = (snippet.name || snippet.id || '').toLowerCase();
    const content = (snippet.content || snippet.sql || '').toLowerCase();

    return importantKeywords.some(keyword => 
      name.includes(keyword.toLowerCase()) || 
      content.includes(keyword.toLowerCase())
    );
  });

  console.log(`Found ${importantSnippets.length} important snippets to keep`);

  // تحديد الاستعلامات غير المهمة
  const unimportantSnippets = snippets.filter(snippet => {
    return !importantSnippets.some(important => important.id === snippet.id);
  });

  console.log(`Found ${unimportantSnippets.length} unimportant snippets to delete`);

  // حذف الاستعلامات غير المهمة
  const deletePromises = unimportantSnippets.map(snippet => deleteSnippet(snippet.id));
  const results = await Promise.all(deletePromises);

  // عرض النتائج
  const successfulDeletes = results.filter(r => r.success);
  const failedDeletes = results.filter(r => !r.success);

  console.log(`Successfully deleted ${successfulDeletes.length} snippets`);
  console.log(`Failed to delete ${failedDeletes.length} snippets`);

  if (failedDeletes.length > 0) {
    console.log('Failed deletions:', failedDeletes);
  }

  return {
    total: snippets.length,
    important: importantSnippets.length,
    unimportant: unimportantSnippets.length,
    deleted: successfulDeletes.length,
    failed: failedDeletes.length
  };
}

// 5. تشغيل عملية التنظيف
cleanupSnippets().then(result => {
  console.log('Cleanup completed:', result);
  alert(`Cleanup completed. Deleted ${result.deleted} of ${result.unimportant} unimportant snippets.`);
}).catch(error => {
  console.error('Error during cleanup:', error);
  alert('Error during cleanup. See console for details.');
});
