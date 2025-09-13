import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import ConversationListScreen from './components/ConversationListScreen';
import ChatScreen from './components/ChatScreen';
import UserListScreen from './components/UserListScreen';


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
    <Routes>
      <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <ConversationListScreen /> : <Navigate to="/auth" />} />
      <Route path="/conversations" element={user ? <ConversationListScreen /> : <Navigate to="/auth" />} />
      <Route path="/chat/:conversationId" element={user ? <ChatScreen /> : <Navigate to="/auth" />} />
      <Route path="/users" element={user ? <UserListScreen /> : <Navigate to="/auth" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
