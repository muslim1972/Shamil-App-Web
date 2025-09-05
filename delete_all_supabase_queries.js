
// سكربت JavaScript لحذف جميع الاستعلامات من Supabase عبر واجهة المتصفح
// يستخدم واجهة برمجة التطبيقات الداخلية لـ Supabase

// 1. دالة للحصول على جميع الاستعلامات من واجهة المستخدم
async function getAllSnippetsFromUI() {
  try {
    // محاولة متعددة للعثور على عناصر الاستعلامات
    let snippetElements = [];

    // المحاولة الأولى: البحث عن العناصر باستخدام محددات مختلفة
    const selectors = [
      '[data-testid*="snippet"]',
      '[class*="snippet"]',
      '[data-rbd-draggable-context-id]',
      '[data-id]',
      '.css-0', // قد يكون هذا هو الفئة المستخدمة في Supabase
      '[role="listitem"]', // قد تكون الاستعلامات في قائمة
      'div[tabindex]', // قد تكون العناصر قابلة للتركيز
      'div:not([class])' // عناصر بدون فئة محددة
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        snippetElements = Array.from(elements);
        break;
      }
    }

    // إذا لم يتم العثور على أي عناصر، محاولة البحث في جميع العناصر
    if (snippetElements.length === 0) {
      console.log('No elements found with specific selectors, trying all divs...');
      const allDivs = document.querySelectorAll('div');

      // البحث عن عناصر تحتوي على نص يشير إلى أنها استعلامات
      for (const div of allDivs) {
        const text = div.textContent || '';
        if (text.includes('SQL') || text.includes('Query') || text.includes('SELECT') || text.includes('INSERT')) {
          snippetElements.push(div);
        }
      }

      console.log(`Found ${snippetElements.length} potential snippet elements by content`);
    }

    // استخراج معلومات الاستعلامات
    const snippets = [];
    snippetElements.forEach(element => {
      // محاولة استخراج معرف الاستعلام واسمه
      const id = element.getAttribute('data-id') || 
                element.getAttribute('data-testid') || 
                element.id || 
                Math.random().toString(36).substr(2, 9); // معرف عشوائي إذا لم يتم العثور على معرف

      // البحث عن اسم الاستعلام في العنصر نفسه أو في العناصر التابعة
      let name = element.querySelector('[class*="name"], [class*="title"], h3, h4, .name, .title')?.textContent;

      // إذا لم يتم العثور على اسم، محاولة استخراجه من النص
      if (!name) {
        const text = element.textContent || '';
        // البحث عن نص قد يكون اسمًا (أول سطر أو نص قصير)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          name = lines[0].trim();
          // إذا كان الاسم طويلاً، قصره
          if (name.length > 50) {
            name = name.substring(0, 47) + '...';
          }
        }
      }

      name = name || 'Unnamed';

      // التحقق إذا كان العنصر يحتوي على محتوى SQL
      const hasSQLContent = (element.textContent || '').includes('SELECT') || 
                           (element.textContent || '').includes('INSERT') || 
                           (element.textContent || '').includes('UPDATE') || 
                           (element.textContent || '').includes('DELETE') || 
                           (element.textContent || '').includes('CREATE') || 
                           (element.textContent || '').includes('DROP');

      if (hasSQLContent) {
        snippets.push({ id, name, element });
      }
    });

    console.log(`Extracted ${snippets.length} snippets with SQL content`);
    return snippets;
  } catch (error) {
    console.error('Error fetching snippets from UI:', error);
    return [];
  }
}

// 2. دالة لمحاكاة النقر على زر حذف استعلام
async function deleteSnippetFromUI(snippet) {
  try {
    const { id, element } = snippet;

    if (!element) {
      return { success: false, snippetId: id, error: 'Snippet element not found' };
    }

    // البحث عن زر الخيارات (النقاط الثلاث) في العنصر نفسه أو في العناصر المجاورة
    let optionsButton = element.querySelector('button[aria-label*="options"], button[aria-label*="more"], button[title*="options"], button[title*="more"]');

    // إذا لم يتم العثور على الزر في العنصر، البحث في العناصر التابعة أو الأصل
    if (!optionsButton) {
      // البحث في العناصر التابعة
      optionsButton = element.querySelector('button');

      // إذا لم يتم العثور على الزر في العناصر التابعة، البحث في العنصر الأصل
      if (!optionsButton) {
        const parent = element.parentElement;
        if (parent) {
          optionsButton = parent.querySelector('button');
        }
      }

      // إذا لم يتم العثور على الزر في العنصر الأصل، البحث في العناصر المجاورة
      if (!optionsButton) {
        const nextSibling = element.nextElementSibling;
        if (nextSibling) {
          optionsButton = nextSibling.querySelector('button');
        }
      }
    }

    if (!optionsButton) {
      return { success: false, snippetId: id, error: 'Options button not found' };
    }

    // النقر على زر الخيارات
    optionsButton.click();

    // الانتظار ظهور قائمة الخيارات
    await new Promise(resolve => setTimeout(resolve, 500));

    // البحث عن زر الحذف في القائمة المنسدلة
    let deleteButton = document.querySelector('button[aria-label*="delete"], button[title*="delete"], button:contains("Delete"), button:contains("حذف")');

    // إذا لم يتم العثور على زر الحذف، محاولة البحث في جميع الأزرار
    if (!deleteButton) {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent || '';
        if (text.includes('Delete') || text.includes('حذف')) {
          deleteButton = button;
          break;
        }
      }
    }

    if (!deleteButton) {
      return { success: false, snippetId: id, error: 'Delete button not found' };
    }

    // النقر على زر الحذف
    deleteButton.click();

    // الانتظار ظهور نافذة التأكيد
    await new Promise(resolve => setTimeout(resolve, 500));

    // البحث عن زر تأكيد الحذف
    let confirmButton = document.querySelector('button[aria-label*="confirm"], button[title*="confirm"], button:contains("Confirm"), button:contains("Delete"), button:contains("حذف"), button[type="submit"]');

    // إذا لم يتم العثور على زر التأكيد، محاولة البحث في جميع الأزرار
    if (!confirmButton) {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent || '';
        if (text.includes('Confirm') || text.includes('Delete') || text.includes('حذف')) {
          confirmButton = button;
          break;
        }
      }
    }

    if (!confirmButton) {
      return { success: false, snippetId: id, error: 'Confirm button not found' };
    }

    // النقر على زر تأكيد الحذف
    confirmButton.click();

    // الانتظار اكتمال عملية الحذف
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, snippetId: id };
  } catch (error) {
    console.error(`Error deleting snippet ${snippet.id} from UI:`, error);
    return { success: false, snippetId: snippet.id, error: error.message };
  }
}

// 3. دالة رئيسية لحذف جميع الاستعلامات
async function cleanupAllSnippets() {
  console.log('Starting cleanup process for ALL snippets...');

  // الحصول على جميع الاستعلامات من واجهة المستخدم
  const snippets = await getAllSnippetsFromUI();
  console.log(`Found ${snippets.length} snippets to delete`);

  // عرض جميع الاستعلامات التي سيتم حذفها
  console.log('All snippets to be deleted:', snippets.map(s => ({ id: s.id, name: s.name })));

  // حذف جميع الاستعلامات واحدًا تلو الآخر
  const results = [];
  for (const snippet of snippets) {
    console.log(`Deleting snippet: ${snippet.name} (${snippet.id})`);
    const result = await deleteSnippetFromUI(snippet);
    results.push(result);

    // الانتظار قليلاً بين عمليات الحذف
    await new Promise(resolve => setTimeout(resolve, 1500));
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
    deleted: successfulDeletes.length,
    failed: failedDeletes.length
  };
}

// 4. تشغيل عملية التنظيف
cleanupAllSnippets().then(result => {
  console.log('Cleanup completed:', result);
  alert(`Cleanup completed. Deleted ${result.deleted} of ${result.total} total snippets.`);
}).catch(error => {
  console.error('Error during cleanup:', error);
  alert('Error during cleanup. See console for details.');
});
