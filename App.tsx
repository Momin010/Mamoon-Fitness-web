
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { AppProvider } from './context/AppContext';
import { SupabaseProvider } from './context/SupabaseContext';
import { ThemeProvider } from './context/ThemeContext';
import { useSupabase } from './context/SupabaseContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';

// Lazy load pages for code splitting
const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));
const MacrosPage = lazy(() => import('./pages/MacrosPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const AddMealPage = lazy(() => import('./pages/AddMealPage'));
const MealHistoryPage = lazy(() => import('./pages/MealHistoryPage'));
const WorkoutHistoryPage = lazy(() => import('./pages/WorkoutHistoryPage'));
const SettingsPage = lazy(() => import('./pages/EnhancedSettingsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const CoachSignupPage = lazy(() => import('./pages/CoachSignupPage'));
const SocialFeedPage = lazy(() => import('./pages/SocialFeedPage'));
const AdminCoachApplications = lazy(() => import('./pages/AdminCoachApplications'));
const AdminAuthPage = lazy(() => import('./pages/AdminAuthPage'));
const MentorshipPage = lazy(() => import('./pages/MentorshipPage'));
const CommunityHub = lazy(() => import('./pages/CommunityHub'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isConfigured } = useSupabase();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  // If Supabase is not configured, allow access (local-only mode)
  if (!isConfigured) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    // If it's an admin route, redirect to the admin auth page
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/coach-applications" />;
    }
    return <AuthPage />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, isConfigured } = useSupabase();
  const location = useLocation();

  // For admin routes, skip the early auth check
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Show auth page if Supabase is configured, user is not logged in, and it's not an admin route
  if (isConfigured && !user && !isAdminRoute) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative border-x border-zinc-900 shadow-2xl">
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-20 max-w-md mx-auto relative border-x border-zinc-900 shadow-2xl">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-green-500" size={48} />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Navigate to="/workout" />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/workout" element={
            <ProtectedRoute>
              <WorkoutPage />
            </ProtectedRoute>
          } />
          <Route path="/workout/history" element={
            <ProtectedRoute>
              <WorkoutHistoryPage />
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } />

          <Route path="/macros" element={
            <ProtectedRoute>
              <MacrosPage />
            </ProtectedRoute>
          } />
          <Route path="/macros/add" element={
            <ProtectedRoute>
              <AddMealPage />
            </ProtectedRoute>
          } />
          <Route path="/macros/history" element={
            <ProtectedRoute>
              <MealHistoryPage />
            </ProtectedRoute>
          } />

          <Route path="/hub" element={
            <ProtectedRoute>
              <CommunityHub />
            </ProtectedRoute>
          } />

          <Route path="/social" element={
            <ProtectedRoute>
              <SocialFeedPage />
            </ProtectedRoute>
          } />

          <Route path="/mentorship" element={
            <ProtectedRoute>
              <MentorshipPage />
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } />

          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <PublicProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />

          <Route path="/messages/:id" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />

          <Route path="/friends" element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          <Route path="/coach/signup" element={
            <ProtectedRoute>
              <CoachSignupPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/coach-applications" element={
            <AdminAuthPage />
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminCoachApplications />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
      {(!isConfigured || user) && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <ThemeProvider>
          <AppProvider>
            <Router>
              <AppContent />
            </Router>
          </AppProvider>
        </ThemeProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  );
};

export default App;
