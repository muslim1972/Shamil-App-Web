
// سكربت JavaScript معدل لحذف الاستعلامات من Supabase عبر واجهة المتصفح
// يستخدم واجهة برمجة التطبيقات الداخلية لـ Supabase

// 1. دالة للحصول على جميع الاستعلامات من واجهة المستخدم
async function getAllSnippetsFromUI() {
  try {
    // البحث عن عناصر واجهة المستخدم التي تحتوي على الاستعلامات
    const snippetElements = document.querySelectorAll('[data-testid*="snippet"], [class*="snippet"], [data-rbd-draggable-context-id]');

    // استخراج معلومات الاستعلامات
    const snippets = [];
    snippetElements.forEach(element => {
      // محاولة استخراج معرف الاستعلام واسمه
      const id = element.getAttribute('data-id') || element.getAttribute('data-testid') || element.id;
      const name = element.querySelector('[class*="name"], [class*="title"], h3, h4, .name, .title')?.textContent || 'Unnamed';

      if (id) {
        snippets.push({ id, name });
      }
    });

    return snippets;
  } catch (error) {
    console.error('Error fetching snippets from UI:', error);
    return [];
  }
}

// 2. دالة لمحاكاة النقر على زر حذف استعلام
async function deleteSnippetFromUI(snippetId) {
  try {
    // البحث عن عنصر الاستعلام في واجهة المستخدم
    const snippetElement = document.querySelector(`[data-id="${snippetId}"], [data-testid*="${snippetId}"], #${snippetId}`);

    if (!snippetElement) {
      return { success: false, snippetId, error: 'Snippet element not found' };
    }

    // البحث عن زر الخيارات (النقاط الثلاث)
    const optionsButton = snippetElement.querySelector('button[aria-label*="options"], button[aria-label*="more"], button[title*="options"], button[title*="more"], button:contains("⋮")');

    if (!optionsButton) {
      return { success: false, snippetId, error: 'Options button not found' };
    }

    // النقر على زر الخيارات
    optionsButton.click();

    // الانتظار ظهور قائمة الخيارات
    await new Promise(resolve => setTimeout(resolve, 300));

    // البحث عن زر الحذف في القائمة المنسدلة
    const deleteButton = document.querySelector('button[aria-label*="delete"], button[title*="delete"], button:contains("Delete"), button:contains("حذف")');

    if (!deleteButton) {
      return { success: false, snippetId, error: 'Delete button not found' };
    }

    // النقر على زر الحذف
    deleteButton.click();

    // الانتظار ظهور نافذة التأكيد
    await new Promise(resolve => setTimeout(resolve, 300));

    // البحث عن زر تأكيد الحذف
    const confirmButton = document.querySelector('button[aria-label*="confirm"], button[title*="confirm"], button:contains("Confirm"), button:contains("Delete"), button:contains("حذف"), button[type="submit"]');

    if (!confirmButton) {
      return { success: false, snippetId, error: 'Confirm button not found' };
    }

    // النقر على زر تأكيد الحذف
    confirmButton.click();

    // الانتظار اكتمال عملية الحذف
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, snippetId };
  } catch (error) {
    console.error(`Error deleting snippet ${snippetId} from UI:`, error);
    return { success: false, snippetId, error: error.message };
  }
}

// 3. دالة رئيسية لحذف الاستعلامات غير الضرورية
async function cleanupSnippets() {
  console.log('Starting cleanup process...');

  // الحصول على جميع الاستعلامات من واجهة المستخدم
  const snippets = await getAllSnippetsFromUI();
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

    return importantKeywords.some(keyword => 
      name.includes(keyword.toLowerCase())
    );
  });

  console.log(`Found ${importantSnippets.length} important snippets to keep`);

  // تحديد الاستعلامات غير المهمة
  const unimportantSnippets = snippets.filter(snippet => {
    return !importantSnippets.some(important => important.id === snippet.id);
  });

  console.log(`Found ${unimportantSnippets.length} unimportant snippets to delete`);

  // حذف الاستعلامات غير المهمة واحدًا تلو الآخر
  const results = [];
  for (const snippet of unimportantSnippets) {
    console.log(`Deleting snippet: ${snippet.name} (${snippet.id})`);
    const result = await deleteSnippetFromUI(snippet.id);
    results.push(result);

    // الانتظار قليلاً بين عمليات الحذف
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

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

// 4. تشغيل عملية التنظيف
cleanupSnippets().then(result => {
  console.log('Cleanup completed:', result);
  alert(`Cleanup completed. Deleted ${result.deleted} of ${result.unimportant} unimportant snippets.`);
}).catch(error => {
  console.error('Error during cleanup:', error);
  alert('Error during cleanup. See console for details.');
});
