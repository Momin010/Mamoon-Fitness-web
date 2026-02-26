
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { AppProvider } from './context/AppContext';
import { SupabaseProvider } from './context/SupabaseContext';
import { ThemeProvider } from './context/ThemeContext';
import { LegalProvider, useLegal } from './context/LegalContext';
import { useSupabase } from './context/SupabaseContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import ScrollbarStyles from './components/ScrollbarStyles';
import LegalModal from './components/LegalModal';
import { supabase } from './lib/supabase';


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
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

// Protected route component with onboarding check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isConfigured } = useSupabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      if (!isConfigured || !user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding:', error);
        }
        
        // If no profile or onboarding not completed, redirect
        if (!data || !data.onboarding_completed) {
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setCheckingOnboarding(false);
      }
    }

    checkOnboarding();
  }, [user, isConfigured]);

  useEffect(() => {
    if (!checkingOnboarding && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [checkingOnboarding, needsOnboarding, navigate, location.pathname]);

  if (isLoading || checkingOnboarding) {
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

  // If needs onboarding, don't render children (will redirect)
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, isConfigured } = useSupabase();
  const { hasAcceptedLegal, acceptLegal } = useLegal();
  const location = useLocation();

  // For admin routes, skip the early auth check
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Show legal modal if user hasn't accepted
  if (!hasAcceptedLegal) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative border-x border-zinc-900 shadow-2xl overflow-hidden">
        <LegalModal onAccept={acceptLegal} />
      </div>
    );
  }

  // Show auth page if Supabase is configured, user is not logged in, and it's not an admin route
  if (isConfigured && !user && !isAdminRoute) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative border-x border-zinc-900 shadow-2xl overflow-hidden">
        <AuthPage />
      </div>
    );
  }


  // Check if on onboarding page
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <div className={`flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative border-x border-zinc-900 shadow-2xl overflow-hidden ${isOnboarding ? '' : 'pb-20'}`}>
      <Suspense fallback={

        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-green-500" size={48} />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Navigate to="/workout" />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

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
      {(!isConfigured || user) && !isOnboarding && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <ThemeProvider>
          <LegalProvider>
            <AppProvider>
              <Router>
                <ScrollbarStyles />
                <AppContent />
              </Router>
            </AppProvider>
          </LegalProvider>
        </ThemeProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  );
};


export default App;
