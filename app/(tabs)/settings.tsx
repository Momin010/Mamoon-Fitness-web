import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
    Lock,
    Crown
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useSupabase } from '../../context/SupabaseContext';
import { ForgeButton } from '../../components/ForgeButton';
import { ForgeSlider } from '../../components/ForgeSlider';
import { ForgeToggle } from '../../components/ForgeToggle';
import { ForgeDropdown } from '../../components/ForgeDropdown';

export default function SettingsScreen() {
    const router = useRouter();
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // State mirroring web forms
    const [profileForm, setProfileForm] = useState({
        name: user.name,
        email: user.email || '',
    });

    const [goalsForm, setGoalsForm] = useState({
        caloriesGoal: user.caloriesGoal,
        proteinGoal: user.proteinGoal,
        carbsGoal: user.carbsGoal,
        fatsGoal: user.fatsGoal
    });

    const [newExercise, setNewExercise] = useState('');

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            updateUser({
                name: profileForm.name.trim(),
                email: profileForm.email.trim()
            });
            Alert.alert("Success", "Profile updated");
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
            Alert.alert("Success", "Goals updated");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth');
    };

    const handleAddExercise = () => {
        if (newExercise.trim() && !settings.exerciseList.includes(newExercise.trim())) {
            updateSettings({
                exerciseList: [...settings.exerciseList, newExercise.trim()]
            });
            setNewExercise('');
        }
    };

    const handleRemoveExercise = (exercise: string) => {
        updateSettings({
            exerciseList: settings.exerciseList.filter(e => e !== exercise)
        });
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'goals', label: 'Goals', icon: Target },
        { id: 'exercises', label: 'Exercises', icon: Dumbbell },
        { id: 'notifications', label: 'Alerts', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'account', label: 'Safe', icon: Lock }
    ] as const;

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row items-center gap-4 p-6 border-b border-zinc-900">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 bg-zinc-900 rounded-full"
                >
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Settings</Text>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-zinc-900">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            className={`flex-row items-center gap-2 px-6 py-4 border-b-2 ${activeTab === tab.id ? 'border-green-500' : 'border-transparent'
                                }`}
                        >
                            <tab.icon size={16} color={activeTab === tab.id ? '#22c55e' : '#71717a'} />
                            <Text className={`font-black uppercase text-[10px] tracking-widest ${activeTab === tab.id ? 'text-green-500' : 'text-zinc-500'
                                }`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                {activeTab === 'profile' && (
                    <View className="space-y-8">
                        {/* Avatar */}
                        <View className="items-center mb-8">
                            <View className="relative">
                                {user.avatar ? (
                                    <View className="w-32 h-32 rounded-full overflow-hidden border-2 border-green-500 p-1">
                                        <Image
                                            source={{ uri: user.avatar }}
                                            className="w-full h-full rounded-full"
                                        />
                                    </View>
                                ) : (
                                    <View className="w-32 h-32 rounded-full bg-zinc-900 items-center justify-center border-2 border-zinc-800">
                                        <User size={48} color="#3f3f46" />
                                    </View>
                                )}
                                <TouchableOpacity
                                    className="absolute bottom-1 right-1 p-3 bg-green-500 rounded-full border-4 border-black"
                                >
                                    <Camera size={20} color="black" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-4">Security Level {user.level}</Text>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-zinc-500 font-black uppercase tracking-widest text-[10px] mb-2">Display Name</Text>
                                <TextInput
                                    value={profileForm.name}
                                    onChangeText={(val) => setProfileForm({ ...profileForm, name: val })}
                                    placeholder="Agent Name"
                                    placeholderTextColor="#3b3b3b"
                                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold"
                                />
                            </View>

                            <View>
                                <Text className="text-zinc-500 font-black uppercase tracking-widest text-[10px] mb-2">Communication Channel</Text>
                                <TextInput
                                    value={profileForm.email}
                                    onChangeText={(val) => setProfileForm({ ...profileForm, email: val })}
                                    placeholder="Secure Email"
                                    placeholderTextColor="#3b3b3b"
                                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl mt-4">
                                <View className="flex-row items-center gap-4">
                                    <Crown size={28} color="#22c55e" />
                                    <View className="flex-1">
                                        <Text className="text-white font-black uppercase text-sm italic">Elite Performance</Text>
                                        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Global Rank #249</Text>
                                    </View>
                                </View>
                            </View>

                            <ForgeButton
                                variant="primary"
                                onPress={handleSaveProfile}
                                isLoading={isSaving}
                                uppercase
                            >
                                Update Profile
                            </ForgeButton>
                        </View>
                    </View>
                )}

                {activeTab === 'goals' && (
                    <View className="space-y-8">
                        <ForgeSlider
                            label="Energy Expenditure"
                            value={goalsForm.caloriesGoal}
                            onChange={(v) => setGoalsForm({ ...goalsForm, caloriesGoal: v })}
                            min={1000}
                            max={5000}
                            color="green"
                        />
                        <ForgeSlider
                            label="Repair Macro (Protein)"
                            value={goalsForm.proteinGoal}
                            onChange={(v) => setGoalsForm({ ...goalsForm, proteinGoal: v })}
                            min={50}
                            max={300}
                            color="blue"
                        />
                        <ForgeSlider
                            label="Energy Macro (Carbs)"
                            value={goalsForm.carbsGoal}
                            onChange={(v) => setGoalsForm({ ...goalsForm, carbsGoal: v })}
                            min={50}
                            max={500}
                            color="blue"
                        />
                        <ForgeSlider
                            label="Hormone Macro (Fats)"
                            value={goalsForm.fatsGoal}
                            onChange={(v) => setGoalsForm({ ...goalsForm, fatsGoal: v })}
                            min={20}
                            max={150}
                            color="red"
                        />
                        <View className="mt-4">
                            <ForgeButton variant="primary" onPress={handleSaveGoals} isLoading={isSaving} uppercase>
                                Synchronize Goals
                            </ForgeButton>
                        </View>
                    </View>
                )}

                {activeTab === 'exercises' && (
                    <View className="space-y-6">
                        <View className="flex-row gap-2">
                            <TextInput
                                value={newExercise}
                                onChangeText={setNewExercise}
                                placeholder="New Training Move"
                                placeholderTextColor="#3f3f46"
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold"
                            />
                            <TouchableOpacity
                                onPress={handleAddExercise}
                                className="bg-white px-6 rounded-2xl items-center justify-center"
                            >
                                <Plus size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-3">
                            {settings.exerciseList.map((ex) => (
                                <View key={ex} className="flex-row justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
                                    <Text className="text-white font-black uppercase text-xs italic">{ex}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveExercise(ex)}>
                                        <X size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'notifications' && (
                    <View className="space-y-6">
                        <View className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 mb-4">
                            <ForgeToggle
                                label="Comms Enabled"
                                description="Push notifications for mission updates"
                                checked={settings.notificationsEnabled}
                                onChange={(val) => updateSettings({ notificationsEnabled: val })}
                            />
                        </View>
                        <View className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800">
                            <View className="mb-6">
                                <ForgeToggle label="Workout Reminders" checked={true} onChange={() => { }} />
                            </View>
                            <View className="mb-6 border-t border-zinc-800 pt-6">
                                <ForgeToggle label="Nutrition Alerts" checked={true} onChange={() => { }} />
                            </View>
                            <View className="border-t border-zinc-800 pt-6">
                                <ForgeToggle label="Social Intelligence" checked={false} onChange={() => { }} />
                            </View>
                        </View>
                        <ForgeButton variant="primary" uppercase>Save Comms Config</ForgeButton>
                    </View>
                )}

                {activeTab === 'privacy' && (
                    <View className="space-y-6">
                        <View className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800">
                            <View className="mb-6">
                                <ForgeToggle label="Ghost Mode" description="Disable public profile visibility" checked={false} onChange={() => { }} />
                            </View>
                            <View className="border-t border-zinc-800 pt-6">
                                <ForgeToggle label="Secure Sessions" description="Only friends can view training logs" checked={true} onChange={() => { }} />
                            </View>
                        </View>
                        <ForgeButton variant="primary" uppercase>Update Protocols</ForgeButton>
                    </View>
                )}

                {activeTab === 'account' && (
                    <View className="space-y-6 pb-12">
                        <View className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 flex-row items-center gap-4">
                            <Download size={24} color="#3b82f6" />
                            <View className="flex-1">
                                <Text className="text-white font-black uppercase text-xs">Mission Data Export</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Download your history (JSON)</Text>
                            </View>
                            <TouchableOpacity className="bg-zinc-800 px-4 py-2 rounded-lg">
                                <Text className="text-white font-black text-[9px] uppercase">Export</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleSignOut}
                            className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 flex-row items-center gap-4"
                        >
                            <LogOut size={24} color="#eab308" />
                            <View className="flex-1">
                                <Text className="text-white font-black uppercase text-xs">Terminate Session</Text>
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Secure logout from device</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowDeleteConfirm(true)}
                            className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20 flex-row items-center gap-4"
                        >
                            <Trash2 size={24} color="#ef4444" />
                            <View className="flex-1">
                                <Text className="text-red-500 font-black uppercase text-xs">Self-Destruct</Text>
                                <Text className="text-red-900/40 text-[9px] font-bold uppercase tracking-widest mt-1">Permanent data deletion</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="h-20" />
            </ScrollView>

            <Modal
                visible={showDeleteConfirm}
                transparent
                animationType="fade"
            >
                <View className="flex-1 bg-black/90 items-center justify-center p-10">
                    <View className="bg-zinc-900 p-8 rounded-[2.5rem] border border-red-500/20 w-full">
                        <View className="items-center mb-6">
                            <AlertTriangle size={48} color="#ef4444" />
                            <Text className="text-white font-black uppercase text-xl mt-4 italic">Confirm Wipe?</Text>
                            <Text className="text-zinc-500 text-center text-xs mt-2 font-bold leading-relaxed">
                                This will permanently erase your entire forge history. Type <Text className="text-white italic">DELETE</Text> to authorize.
                            </Text>
                        </View>

                        <TextInput
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            placeholder="Type DELETE"
                            placeholderTextColor="#3f3f46"
                            className="bg-black border border-red-500/20 rounded-2xl px-5 py-4 text-white font-black text-center mb-6"
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-zinc-800 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-zinc-400 font-black uppercase text-[10px]">Abort</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (deleteConfirmText === 'DELETE') {
                                        resetAllData();
                                        router.replace('/auth');
                                    }
                                }}
                                disabled={deleteConfirmText !== 'DELETE'}
                                className={`flex-1 bg-red-500 py-4 rounded-2xl items-center ${deleteConfirmText !== 'DELETE' ? 'opacity-30' : ''}`}
                            >
                                <Text className="text-black font-black uppercase text-[10px]">Execute</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
