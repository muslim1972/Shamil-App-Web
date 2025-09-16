import React, { memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueryProvider } from './providers/QueryProvider';

// Lazy loading components with named imports for better debugging
const AuthScreen = React.lazy(() => import('./components/AuthScreen'));
const ConversationListScreen = React.lazy(() => import('./components/ConversationListScreen'));
const ChatScreen = React.lazy(() => import('./components/ChatScreen'));
const UserListScreen = React.lazy(() => import('./components/UserListScreen'));
const ArchivedConversationsScreen = React.lazy(() => import('./components/ArchivedConversationsScreen'));

// Enhanced loading component with animation
const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-600 dark:text-slate-300">جاري التحميل...</p>
  </div>
);

// Main component for routing - memoized to prevent unnecessary re-renders
const AppRoutes: React.FC = memo(() => {
  const { user, loading } = useAuth();

  // Show a loading indicator while checking for auth status
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/" replace />} />
        <Route path="/" element={user ? <ConversationListScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/conversations" element={user ? <ConversationListScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/chat/:conversationId" element={user ? <ChatScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/users" element={user ? <UserListScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/archived" element={user ? <ArchivedConversationsScreen /> : <Navigate to="/auth" replace />} />
      </Routes>
    </React.Suspense>
  );
});

AppRoutes.displayName = 'AppRoutes';

// Main App component - memoized for performance
const App: React.FC = memo(() => {
  return (
    <Router>
      <QueryProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryProvider>
    </Router>
  );
});

App.displayName = 'App';

export default App;