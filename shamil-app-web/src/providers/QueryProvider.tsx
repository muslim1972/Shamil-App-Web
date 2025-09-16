import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

// إنشاء عميل استعلام محسن مع إعدادات مخصصة
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // إعادة المحاولة مرة واحدة فقط عند الفشل
      retry: 1,
      // عدم إعادة جلب البيانات عند التركيز على النافذة
      refetchOnWindowFocus: false,
      // تخزين البيانات مؤقتاً لمدة 5 دقائق
      staleTime: 1000 * 60 * 5,
      // إخفاء البيانات القديمة لمدة 10 دقائق
      gcTime: 1000 * 60 * 10,
      // تمكين التخزين المؤقت في المتصفح
      // تم تعطيل خاصية التخزين المؤقت مؤقتاً
    },
    // إعدادات العمليات الطفرية (Mutations)
    mutations: {
      // عدم إعادة المحاولة عند الفشل في العمليات الطفرية
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* إضافة أدوات المطور للتحقق من حالة الاستعلامات في بيئة التطوير */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};
