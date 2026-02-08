import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Target, 
  Dumbbell, 
  Bell, 
  Shield, 
  Trash2, 
  Save, 
  Plus, 
  X, 
  Camera,
  LogOut,
  Download,
  AlertTriangle,
  Check,
  Loader2,
  Users,
  Crown,
  Moon,
  Globe,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton, ForgeSlider, ForgeToggle, ForgeDropdown } from '../components';
import ImageUpload from '../components/ImageUpload';

interface PrivacySettings {
  profileVisible: boolean;
  showWorkouts: boolean;
  showMeals: boolean;
  showStats: boolean;
  allowFriendRequests: boolean;
}

interface NotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  friendActivity: boolean;
  achievements: boolean;
  coachUpdates: boolean;
  pushEnabled: boolean;
}

const EnhancedSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    updateUser, 
    settings, 
    updateSettings, 
    resetAllData,
  } = useApp();
  const { user: authUser, signOut } = useSupabase();

  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'exercises' | 'notifications' | 'privacy' | 'account'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isCoach, setIsCoach] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email || '',
    username: '',
    bio: ''
  });

  // Goals form
  const [goalsForm, setGoalsForm] = useState({
    caloriesGoal: user.caloriesGoal,
    proteinGoal: user.proteinGoal,
    carbsGoal: user.carbsGoal,
    fatsGoal: user.fatsGoal
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisible: true,
    showWorkouts: true,
    showMeals: false,
    showStats: true,
    allowFriendRequests: true
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    workoutReminders: true,
    mealReminders: true,
    friendActivity: true,
    achievements: true,
    coachUpdates: true,
    pushEnabled: settings.notificationsEnabled
  });

  // Exercise management
  const [newExercise, setNewExercise] = useState('');

  // Load privacy settings
  useEffect(() => {
    if (authUser) {
      loadPrivacySettings();
      checkCoachStatus();
    }
  }, [authUser]);

  const loadPrivacySettings = async () => {
    try {
      const { data } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', authUser?.id)
        .single();

      if (data) {
        setPrivacySettings({
          profileVisible: data.profile_visible,
          showWorkouts: data.show_workouts,
          showMeals: data.show_meals,
          showStats: data.show_stats,
          allowFriendRequests: data.allow_friend_requests
        });
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
    }
  };

  const checkCoachStatus = async () => {
    try {
      const { data } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', authUser?.id)
        .single();

      setIsCoach(!!data);
    } catch (err) {
      setIsCoach(false);
    }
  };

  const showSaveNotification = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      updateUser({ 
        name: profileForm.name.trim(), 
        email: profileForm.email.trim() 
      });
      showSaveNotification('Profile saved!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGoals = async () => {
    setIsSaving(true);
    try {
      updateUser({
        caloriesGoal: Math.max(500, goalsForm.caloriesGoal),
        proteinGoal: Math.max(10, goalsForm.proteinGoal),
        carbsGoal: Math.max(10, goalsForm.carbsGoal),
        fatsGoal: Math.max(5, goalsForm.fatsGoal)
      });
      showSaveNotification('Goals updated!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!authUser) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: authUser.id,
          profile_visible: privacySettings.profileVisible,
          show_workouts: privacySettings.showWorkouts,
          show_meals: privacySettings.showMeals,
          show_stats: privacySettings.showStats,
          allow_friend_requests: privacySettings.allowFriendRequests
        });

      if (error) throw error;
      showSaveNotification('Privacy settings saved!');
    } catch (err) {
      console.error('Error saving privacy settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    updateSettings({ notificationsEnabled: notificationSettings.pushEnabled });
    showSaveNotification('Notification preferences saved!');
  };

  const handleAddExercise = () => {
    if (newExercise.trim() && !settings.exerciseList.includes(newExercise.trim())) {
      updateSettings({
        exerciseList: [...settings.exerciseList, newExercise.trim()]
      });
      setNewExercise('');
      showSaveNotification('Exercise added!');
    }
  };

  const handleRemoveExercise = (exercise: string) => {
    updateSettings({
      exerciseList: settings.exerciseList.filter(e => e !== exercise)
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Collect all user data
      const exportData = {
        profile: user,
        settings: settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forge-fitness-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSaveNotification('Data exported!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    // In a real app, this would call a secure server function
    // For now, just reset local data
    resetAllData();
    await signOut();
    navigate('/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: Lock }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 border-b border-zinc-800">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
        {saveMessage && (
          <span className="ml-auto text-green-400 text-sm font-medium animate-fade-in">
            {saveMessage}
          </span>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-green-500 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-md">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-green-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                    <User size={40} className="text-zinc-500" />
                  </div>
                )}
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="absolute bottom-0 right-0 p-2 bg-green-500 text-black rounded-full hover:bg-green-400 transition-colors"
                >
                  <Camera size={16} />
                </button>
              </div>
              <button
                onClick={() => setShowImageUpload(true)}
                className="mt-3 text-sm text-green-500 hover:underline"
              >
                Change Avatar
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              {/* Stats Card */}
              <div className="p-4 bg-zinc-900 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Level</p>
                    <p className="text-zinc-400 text-sm">Level {user.level} • {user.xp.toLocaleString()} XP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-green-500">{user.level}</p>
                  </div>
                </div>
              </div>

              {/* Coach Application */}
              {!isCoach && (
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Crown size={24} className="text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">Become a Coach</h4>
                      <p className="text-sm text-zinc-400 mt-1">
                        Share your expertise and create workout plans for the community
                      </p>
                      <ForgeButton
                        variant="primary"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate('/coach/signup')}
                      >
                        Apply Now
                      </ForgeButton>
                    </div>
                  </div>
                </div>
              )}

              <ForgeButton
                variant="primary"
                onClick={handleSaveProfile}
                isLoading={isSaving}
                leftIcon={<Save size={18} />}
                fullWidth
              >
                Save Profile
              </ForgeButton>
            </div>

            {showImageUpload && (
              <ImageUpload
                onImageUploaded={(url) => {
                  updateUser({ avatar: url });
                  setShowImageUpload(false);
                }}
                onCancel={() => setShowImageUpload(false)}
                bucket="avatars"
                folder="profiles"
              />
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6 max-w-md">
            <div className="space-y-6">
              <ForgeSlider
                label="Daily Calories"
                value={goalsForm.caloriesGoal}
                onChange={(v) => setGoalsForm({ ...goalsForm, caloriesGoal: v })}
                min={1000}
                max={5000}
                step={50}
                color="green"
                valueFormatter={(v) => `${v} cal`}
              />

              <ForgeSlider
                label="Protein Goal"
                value={goalsForm.proteinGoal}
                onChange={(v) => setGoalsForm({ ...goalsForm, proteinGoal: v })}
                min={20}
                max={300}
                step={5}
                color="blue"
                valueFormatter={(v) => `${v}g`}
              />

              <ForgeSlider
                label="Carbs Goal"
                value={goalsForm.carbsGoal}
                onChange={(v) => setGoalsForm({ ...goalsForm, carbsGoal: v })}
                min={50}
                max={500}
                step={5}
                color="yellow"
                valueFormatter={(v) => `${v}g`}
              />

              <ForgeSlider
                label="Fats Goal"
                value={goalsForm.fatsGoal}
                onChange={(v) => setGoalsForm({ ...goalsForm, fatsGoal: v })}
                min={10}
                max={150}
                step={5}
                color="red"
                valueFormatter={(v) => `${v}g`}
              />

              <ForgeButton
                variant="primary"
                onClick={handleSaveGoals}
                isLoading={isSaving}
                leftIcon={<Save size={18} />}
                fullWidth
              >
                Update Goals
              </ForgeButton>
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-4 max-w-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddExercise()}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Add new exercise..."
              />
              <ForgeButton
                variant="primary"
                onClick={handleAddExercise}
                disabled={!newExercise.trim()}
              >
                <Plus size={20} />
              </ForgeButton>
            </div>

            <div className="space-y-2">
              {settings.exerciseList.map((exercise) => (
                <div 
                  key={exercise} 
                  className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl group"
                >
                  <span className="text-white">{exercise}</span>
                  <button
                    onClick={() => handleRemoveExercise(exercise)}
                    className="p-2 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-md">
            <div className="p-4 bg-zinc-900 rounded-xl">
              <ForgeToggle
                checked={notificationSettings.pushEnabled}
                onChange={(checked) => setNotificationSettings({ ...notificationSettings, pushEnabled: checked })}
                label="Push Notifications"
                description="Enable push notifications on your device"
              />
            </div>

            <div className="space-y-4 p-4 bg-zinc-900 rounded-xl">
              <h4 className="font-medium text-white mb-4">Notification Types</h4>
              
              <ForgeToggle
                checked={notificationSettings.workoutReminders}
                onChange={(checked) => setNotificationSettings({ ...notificationSettings, workoutReminders: checked })}
                label="Workout Reminders"
                description="Daily reminders to complete your workout"
              />

              <div className="border-t border-zinc-800 pt-4">
                <ForgeToggle
                  checked={notificationSettings.mealReminders}
                  onChange={(checked) => setNotificationSettings({ ...notificationSettings, mealReminders: checked })}
                  label="Meal Logging"
                  description="Reminders to log your meals"
                />
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <ForgeToggle
                  checked={notificationSettings.friendActivity}
                  onChange={(checked) => setNotificationSettings({ ...notificationSettings, friendActivity: checked })}
                  label="Friend Activity"
                  description="Updates about your friends' workouts"
                />
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <ForgeToggle
                  checked={notificationSettings.achievements}
                  onChange={(checked) => setNotificationSettings({ ...notificationSettings, achievements: checked })}
                  label="Achievements"
                  description="Celebrate when you reach milestones"
                />
              </div>
            </div>

            <ForgeButton
              variant="primary"
              onClick={handleSaveNotifications}
              leftIcon={<Save size={18} />}
              fullWidth
            >
              Save Preferences
            </ForgeButton>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4 max-w-md">
            <div className="space-y-4 p-4 bg-zinc-900 rounded-xl">
              <h4 className="font-medium text-white mb-4">Profile Visibility</h4>
              
              <ForgeToggle
                checked={privacySettings.profileVisible}
                onChange={(checked) => setPrivacySettings({ ...privacySettings, profileVisible: checked })}
                label="Public Profile"
                description="Allow others to find and view your profile"
              />

              <div className="border-t border-zinc-800 pt-4">
                <ForgeToggle
                  checked={privacySettings.allowFriendRequests}
                  onChange={(checked) => setPrivacySettings({ ...privacySettings, allowFriendRequests: checked })}
                  label="Allow Friend Requests"
                  description="Let others send you friend requests"
                />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-zinc-900 rounded-xl">
              <h4 className="font-medium text-white mb-4">Activity Sharing</h4>
              
              <ForgeToggle
                checked={privacySettings.showWorkouts}
                onChange={(checked) => setPrivacySettings({ ...privacySettings, showWorkouts: checked })}
                label="Share Workouts"
                description="Show your workouts in the social feed"
              />

              <div className="border-t border-zinc-800 pt-4">
                <ForgeToggle
                  checked={privacySettings.showMeals}
                  onChange={(checked) => setPrivacySettings({ ...privacySettings, showMeals: checked })}
                  label="Share Meals"
                  description="Show your meal logs in the social feed"
                />
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <ForgeToggle
                  checked={privacySettings.showStats}
                  onChange={(checked) => setPrivacySettings({ ...privacySettings, showStats: checked })}
                  label="Share Stats"
                  description="Display your level and XP on your profile"
                />
              </div>
            </div>

            <ForgeButton
              variant="primary"
              onClick={handleSavePrivacy}
              isLoading={isSaving}
              leftIcon={<Save size={18} />}
              fullWidth
            >
              Save Privacy Settings
            </ForgeButton>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-4 max-w-md">
            {/* Export Data */}
            <div className="p-4 bg-zinc-900 rounded-xl">
              <div className="flex items-start gap-3">
                <Download size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Export Your Data</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Download a copy of all your data
                  </p>
                  <ForgeButton
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={handleExportData}
                    isLoading={isExporting}
                  >
                    Export Data
                  </ForgeButton>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="p-4 bg-zinc-900 rounded-xl">
              <div className="flex items-start gap-3">
                <LogOut size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-white">Sign Out</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Sign out of your account on this device
                  </p>
                  <ForgeButton
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </ForgeButton>
                </div>
              </div>
            </div>

            {/* Delete Account */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-400">Delete Account</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                  <ForgeButton
                    variant="danger"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </ForgeButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-lg font-bold">Delete Account?</h2>
            </div>
            <p className="text-zinc-400 mb-4">
              This will permanently delete all your progress, data, and account. 
              Type <strong className="text-white">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3">
              <ForgeButton
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1"
              >
                Cancel
              </ForgeButton>
              <ForgeButton
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1"
              >
                Delete
              </ForgeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSettingsPage;
