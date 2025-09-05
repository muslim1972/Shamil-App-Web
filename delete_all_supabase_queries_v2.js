
// سكربت JavaScript لحذف جميع الاستعلامات من Supabase عبر واجهة المتصفح
// يستخدم واجهة برمجة التطبيقات الداخلية لـ Supabase

// 1. دالة للحصول على جميع الاستعلامات من واجهة المستخدم
async function getAllSnippetsFromUI() {
  try {
    console.log("Starting to search for SQL snippets in the UI...");

    // أولاً، دعنا نبحث عن أي عناصر قد تحتوي على استعلامات SQL
    // سنستخدم مجموعة واسعة من المحددات للعثور على العناصر المحتملة
    const allElements = document.querySelectorAll('*');
    console.log(`Found ${allElements.length} total elements in the document`);

    // البحث عن عناصر تحتوي على كلمات مفتاحية SQL
    const potentialElements = [];
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];

    for (const element of allElements) {
      const text = element.textContent || '';

      // التحقق إذا كان العنصر يحتوي على كلمات SQL مفتاحية
      const hasSQL = sqlKeywords.some(keyword => text.includes(keyword));

      if (hasSQL) {
        // التحقق إذا كان العنصر مرئيًا
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';

        if (isVisible) {
          potentialElements.push(element);
        }
      }
    }

    console.log(`Found ${potentialElements.length} potential elements with SQL content`);

    // الآن، دعنا نحاول تحديد العناصر التي تمثل استعلامات SQL كاملة
    const snippets = [];

    // البحث عن العناصر التي قد تكون استعلامات SQL
    for (const element of potentialElements) {
      // تخطي العناصر الصغيرة جدًا
      if (element.textContent.length < 20) continue;

      // تخطي العناصر التي تحتوي على نصوص غير متعلقة بـ SQL
      const text = element.textContent.toLowerCase();
      if (text.includes('copyright') || 
          text.includes('all rights reserved') ||
          text.includes('terms of service') ||
          text.includes('privacy policy')) {
        continue;
      }

      // محاولة استخراج معرف الاستعلام واسمه
      const id = element.getAttribute('data-id') || 
                element.getAttribute('data-testid') || 
                element.id || 
                Math.random().toString(36).substr(2, 9);

      // البحث عن اسم الاستعلام في العنصر نفسه أو في العناصر التابعة
      let name = element.querySelector('[class*="name"], [class*="title"], h3, h4, .name, .title, [data-testid*="name"], [data-testid*="title"]')?.textContent;

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

      // إضافة العنصر إلى قائمة الاستعلامات
      snippets.push({ id, name, element });
    }

    console.log(`Extracted ${snippets.length} snippets`);

    // إذا لم يتم العثور على استعلامات، دعنا نبحث بطريقة مختلفة
    if (snippets.length === 0) {
      console.log("No snippets found with the first method, trying alternative approach...");

      // البحث عن جميع الأزرار التي قد تكون مرتبطة بالاستعلامات
      const buttons = document.querySelectorAll('button');
      console.log(`Found ${buttons.length} buttons`);

      // البحث عن الأزرار التي قد تكون أزرار حذف أو خيارات
      for (const button of buttons) {
        const text = button.textContent || '';
        const ariaLabel = button.getAttribute('aria-label') || '';

        if (text.includes('Delete') || text.includes('حذف') || 
            ariaLabel.includes('Delete') || ariaLabel.includes('حذف')) {
          console.log("Found delete button:", button);

          // البحث عن العنصر الأصل الذي قد يمثل استعلامًا
          let parent = button.parentElement;
          while (parent && parent !== document.body) {
            // التحقق إذا كان العنصر الأصل يحتوي على محتوى SQL
            const parentText = parent.textContent || '';
            const hasSQL = sqlKeywords.some(keyword => parentText.includes(keyword));

            if (hasSQL && parentText.length > 50) {
              // استخراج اسم الاستعلام
              let name = 'Unnamed';
              const nameElement = parent.querySelector('[class*="name"], [class*="title"], h3, h4, .name, .title');
              if (nameElement) {
                name = nameElement.textContent || 'Unnamed';
              }

              // إضافة الاستعلام إلى القائمة
              const id = parent.getAttribute('data-id') || 
                        parent.getAttribute('data-testid') || 
                        parent.id || 
                        Math.random().toString(36).substr(2, 9);

              snippets.push({ id, name, element: parent });
              console.log(`Found snippet: ${name} (${id})`);
              break;
            }

            parent = parent.parentElement;
          }
        }
      }
    }

    console.log(`Finally extracted ${snippets.length} snippets`);
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

    console.log(`Attempting to delete snippet: ${snippet.name} (${id})`);

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

    console.log("Found options button, clicking...");

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

    console.log("Found delete button, clicking...");

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

    console.log("Found confirm button, clicking...");

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

  // إذا لم يتم العثور على أي استعلامات، عرض رسالة
  if (snippets.length === 0) {
    console.log("No SQL snippets found. The page structure might have changed or you might not be on the SQL Editor page.");
    return {
      total: 0,
      deleted: 0,
      failed: 0,
      message: "No snippets found. Make sure you are on the SQL Editor page."
    };
  }

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
