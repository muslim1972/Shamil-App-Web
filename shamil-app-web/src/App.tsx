import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ForwardingProvider } from './context/ForwardingContext';
import { QueryProvider } from './providers/QueryProvider';

const AuthScreen = React.lazy(() => import('./components/AuthScreen'));
const ConversationListScreen = React.lazy(() => import('./components/ConversationListScreen'));
const ChatScreen = React.lazy(() => import('./components/ChatScreen'));
const UserListScreen = React.lazy(() => import('./components/UserListScreen'));
const ArchivedConversationsScreen = React.lazy(() => import('./components/ArchivedConversationsScreen'));

// Main component for routing
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  // Show a loading indicator while checking for auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div>Loading screen...</div>
      </div>
    }>
      <Routes>
        <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <ConversationListScreen /> : <Navigate to="/auth" />} />
        <Route path="/conversations" element={user ? <ConversationListScreen /> : <Navigate to="/auth" />} />
        <Route path="/chat/:conversationId" element={user ? <ChatScreen /> : <Navigate to="/auth" />} />
        <Route path="/users" element={user ? <UserListScreen /> : <Navigate to="/auth" />} />
        <Route path="/archived" element={user ? <ArchivedConversationsScreen /> : <Navigate to="/auth" />} />
      </Routes>
    </React.Suspense>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <QueryProvider>
        <AuthProvider>
          <ForwardingProvider>
            <AppRoutes />
          </ForwardingProvider>
        </AuthProvider>
      </QueryProvider>
    </Router>
  );
};

export default App;