
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Target, Dumbbell, Bell, Moon, Trash2, AlertTriangle, Save, Plus, X, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from '../components/ThemeToggle';
import ImageUpload from '../components/ImageUpload';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    updateUser, 
    settings, 
    updateSettings, 
    resetAllData,
    addFriend,
    removeFriend,
    friends,
    updateFriendXp
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'exercises' | 'friends' | 'preferences'>('profile');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newExercise, setNewExercise] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendXp, setNewFriendXp] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email || ''
  });

  // Goals form
  const [goalsForm, setGoalsForm] = useState({
    caloriesGoal: user.caloriesGoal,
    proteinGoal: user.proteinGoal,
    carbsGoal: user.carbsGoal,
    fatsGoal: user.fatsGoal
  });

  const handleSaveProfile = () => {
    updateUser({ 
      name: profileForm.name.trim(), 
      email: profileForm.email.trim() 
    });
    showSaveMessage('Profile saved!');
  };

  const handleSaveGoals = () => {
    updateUser({
      caloriesGoal: Math.max(500, goalsForm.caloriesGoal),
      proteinGoal: Math.max(10, goalsForm.proteinGoal),
      carbsGoal: Math.max(10, goalsForm.carbsGoal),
      fatsGoal: Math.max(5, goalsForm.fatsGoal)
    });
    showSaveMessage('Goals updated!');
  };

  const showSaveMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleAddExercise = () => {
    if (newExercise.trim() && !settings.exerciseList.includes(newExercise.trim())) {
      updateSettings({
        exerciseList: [...settings.exerciseList, newExercise.trim()]
      });
      setNewExercise('');
      showSaveMessage('Exercise added!');
    }
  };

  const handleRemoveExercise = (exercise: string) => {
    updateSettings({
      exerciseList: settings.exerciseList.filter(e => e !== exercise)
    });
  };

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      const xp = Math.max(0, newFriendXp);
      const level = Math.floor(xp / 1000) + 1;
      let tier = 'NOVICE';
      if (level >= 80) tier = 'LEGENDARY';
      else if (level >= 60) tier = 'ELITE';
      else if (level >= 40) tier = 'MASTER';
      else if (level >= 20) tier = 'VETERAN';

      addFriend({
        name: newFriendName.trim(),
        xp,
        level,
        tier,
        avatar: `https://picsum.photos/seed/${Date.now()}/200`,
        lastActive: Date.now()
      });
      setNewFriendName('');
      setNewFriendXp(0);
      showSaveMessage('Friend added!');
    }
  };

  const handleResetAll = () => {
    resetAllData();
    setShowResetConfirm(false);
    navigate('/');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'LEGENDARY': return 'text-yellow-400';
      case 'ELITE': return 'text-purple-400';
      case 'MASTER': return 'text-blue-400';
      case 'VETERAN': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center gap-4 p-6 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
        {saveMessage && (
          <span className="ml-auto text-green-400 text-sm font-medium animate-fade-out">{saveMessage}</span>
        )}
      </header>

      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'exercises', label: 'Exercises', icon: Dumbbell },
          { id: 'friends', label: 'Friends', icon: User },
          { id: 'preferences', label: 'Prefs', icon: Bell }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-green-500 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Upload */}
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
                  aria-label="Change avatar"
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

            <div>
              <label className="block text-zinc-400 text-sm mb-2">Display Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>
            <div className="pt-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                <div>
                  <p className="font-medium">Current Level</p>
                  <p className="text-zinc-400 text-sm">Level {user.level} • {user.xp.toLocaleString()} XP</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-500">{user.level}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full bg-green-500 text-black py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Profile
            </button>

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
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Calories</label>
                <input
                  type="number"
                  value={goalsForm.caloriesGoal}
                  onChange={(e) => setGoalsForm({ ...goalsForm, caloriesGoal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Protein (g)</label>
                <input
                  type="number"
                  value={goalsForm.proteinGoal}
                  onChange={(e) => setGoalsForm({ ...goalsForm, proteinGoal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Carbs (g)</label>
                <input
                  type="number"
                  value={goalsForm.carbsGoal}
                  onChange={(e) => setGoalsForm({ ...goalsForm, carbsGoal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Fats (g)</label>
                <input
                  type="number"
                  value={goalsForm.fatsGoal}
                  onChange={(e) => setGoalsForm({ ...goalsForm, fatsGoal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleSaveGoals}
              className="w-full bg-green-500 text-black py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Update Goals
            </button>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddExercise()}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Add new exercise..."
              />
              <button
                onClick={handleAddExercise}
                className="bg-green-500 text-black px-4 rounded-lg font-bold hover:bg-green-400 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {settings.exerciseList.map((exercise) => (
                <div key={exercise} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                  <span>{exercise}</span>
                  <button
                    onClick={() => handleRemoveExercise(exercise)}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="text"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Friend name..."
              />
              <input
                type="number"
                value={newFriendXp}
                onChange={(e) => setNewFriendXp(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Starting XP..."
              />
              <button
                onClick={handleAddFriend}
                className="w-full bg-green-500 text-black py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Friend
              </button>
            </div>
            <div className="space-y-2 pt-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className={`text-xs font-bold ${getTierColor(friend.tier)}`}>{friend.tier}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm">Lvl {friend.level}</span>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-zinc-400" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-zinc-400 text-sm">Daily reminders and updates</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.notificationsEnabled ? 'bg-green-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Moon size={20} className="text-zinc-400" />
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-zinc-400 text-sm">Choose your preferred appearance</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <div className="pt-8 border-t border-zinc-800">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={18} />
                Reset All Data
              </button>
            </div>
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-lg font-bold">Reset All Data?</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              This will permanently delete all your progress, tasks, meals, and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 border border-zinc-700 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
