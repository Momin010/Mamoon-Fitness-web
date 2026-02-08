import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Menu, Check, Plus, Trash2, AlertCircle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function TasksScreen() {
    const { tasks, toggleTask, addTask, deleteTask } = useApp();
    const [view, setView] = useState<'home' | 'list'>('home');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [touched, setTouched] = useState(false);

    const filteredActive = tasks.filter(t => !t.completed && t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredCompleted = tasks.filter(t => t.completed && t.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const validateTask = (title: string): string => {
        if (!title.trim()) return 'Task title is required';
        if (title.trim().length < 2) return 'Title must be at least 2 characters';
        if (title.trim().length > 100) return 'Title must be less than 100 characters';
        if (tasks.some(t => t.title.toLowerCase() === title.trim().toLowerCase() && !t.completed)) {
            return 'This task already exists';
        }
        return '';
    };

    const handleAddTask = () => {
        setTouched(true);
        const validationError = validateTask(newTaskTitle);

        if (validationError) {
            setError(validationError);
            return;
        }

        addTask(newTaskTitle.trim());
        setNewTaskTitle('');
        setError('');
        setTouched(false);
    };

    const handleInputChange = (value: string) => {
        setNewTaskTitle(value);
        if (touched) {
            setError(validateTask(value));
        }
    };

    const completionPercentage = tasks.length > 0
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
        : 0;

    if (view === 'home') {
        return (
            <SafeAreaView className="flex-1 bg-black">
                <View className="flex-1">
                    <header className="p-8 flex-row justify-center relative">
                        <Text className="text-zinc-600 uppercase text-[10px] font-black tracking-[0.5em] italic">Current Ops</Text>
                        <TouchableOpacity
                            onPress={() => setView('list')}
                            className="absolute right-8 top-6 p-3 bg-zinc-900 rounded-2xl border border-zinc-800"
                        >
                            <Menu size={20} color="white" />
                        </TouchableOpacity>
                    </header>

                    <View className="flex-1 items-center justify-center -mt-20">
                        <View>
                            <View className="absolute inset-0 bg-green-500/10 blur-[100px]" />
                            <Text className="text-[10rem] font-black leading-none mb-0 tracking-tighter italic text-white">
                                {(tasks.filter(t => !t.completed).length).toString().padStart(2, '0')}
                            </Text>
                            {tasks.length > 0 && (
                                <View className="absolute -top-4 -right-4 bg-green-500 px-3 py-1.5 rounded-lg shadow-lg">
                                    <Text className="text-black text-[10px] font-black">{completionPercentage}%</Text>
                                </View>
                            )}
                        </View>
                        <Text className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.8em] mt-4 ml-4">Tasks Remaining</Text>

                        {tasks.length > 0 && (
                            <View className="mt-12 w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <View
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </View>
                        )}
                    </View>

                    <View className="p-8 space-y-4 pb-12">
                        <TouchableOpacity
                            onPress={() => setView('list')}
                            className="w-full bg-white py-6 rounded-3xl"
                        >
                            <Text className="text-black text-center font-black uppercase tracking-[0.2em] text-xs">Initiate Protocol</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setView('list')}
                            className="w-full border border-zinc-800 py-5 rounded-3xl"
                        >
                            <Text className="text-zinc-600 text-center font-black uppercase tracking-[0.2em] text-[10px]">Tactical Overview</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-row justify-between items-center p-8 mb-4">
                    <TouchableOpacity
                        onPress={() => setView('home')}
                        className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800"
                    >
                        <Menu size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black uppercase tracking-tighter italic text-white underline decoration-green-500">Forge <Text className="text-green-500">Tasks</Text></Text>
                    <TouchableOpacity
                        onPress={() => setShowSearch(!showSearch)}
                        className={`p-3 rounded-2xl border ${showSearch ? 'bg-green-500/10 border-green-500/50' : 'bg-zinc-900 border-zinc-800'}`}
                    >
                        <Search size={20} color={showSearch ? '#22c55e' : 'white'} />
                    </TouchableOpacity>
                </View>

                {showSearch && (
                    <View className="px-8 mb-8">
                        <TextInput
                            autoFocus
                            placeholder="Search objectives..."
                            placeholderTextColor="#3f3f46"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-green-500"
                        />
                    </View>
                )}

                <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
                    <View className="mb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic">Active Directives</Text>
                            <Text className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{filteredActive.length} Target{filteredActive.length !== 1 ? 's' : ''}</Text>
                        </View>

                        {filteredActive.length === 0 ? (
                            <View className="items-center py-20 opacity-30">
                                <View className="w-16 h-16 bg-zinc-900 rounded-2xl items-center justify-center mb-4">
                                    <Check size={28} color="#52525b" />
                                </View>
                                <Text className="text-[10px] font-black text-white uppercase tracking-widest">{searchQuery ? 'No matching objectives' : 'Area Clear'}</Text>
                            </View>
                        ) : (
                            <View className="space-y-3">
                                {filteredActive.map(task => (
                                    <View
                                        key={task.id}
                                        className="flex-row items-center gap-5 p-5 bg-zinc-900/50 border border-zinc-900 rounded-3xl mb-4"
                                    >
                                        <TouchableOpacity
                                            onPress={() => toggleTask(task.id)}
                                            className="w-8 h-8 bg-black border-2 border-zinc-800 rounded-xl items-center justify-center"
                                        >
                                            {task.completed && <Check size={16} color="#22c55e" strokeWidth={3} />}
                                        </TouchableOpacity>
                                        <View className="flex-1">
                                            <Text className="font-black text-sm uppercase tracking-tight text-white">{task.title}</Text>
                                            <Text className="text-[10px] font-bold text-green-500/50 uppercase tracking-widest mt-1">+{task.xpReward} XP Reward</Text>
                                        </View>
                                        <View className="items-end gap-2">
                                            <View className="bg-zinc-900 px-2 py-1 rounded-md">
                                                <Text className="text-zinc-700 text-[9px] font-black uppercase tracking-widest">{task.dueDate}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => deleteTask(task.id)}
                                                className="p-1"
                                            >
                                                <Trash2 size={14} color="#3f3f46" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {filteredCompleted.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-zinc-700 text-[10px] font-black uppercase tracking-widest mb-6 italic">Secure Zone</Text>
                            <View className="space-y-3">
                                {filteredCompleted.map(task => (
                                    <View
                                        key={task.id}
                                        className="flex-row items-center gap-5 p-5 bg-zinc-950 border border-transparent rounded-3xl opacity-40 mb-4"
                                    >
                                        <View className="w-8 h-8 bg-green-500/10 border-2 border-green-500/20 rounded-xl items-center justify-center">
                                            <Check size={16} color="#22c55e" strokeWidth={3} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-black text-sm uppercase tracking-tight text-zinc-600 line-through">{task.title}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => deleteTask(task.id)}
                                            className="p-2"
                                        >
                                            <Trash2 size={16} color="#3f3f46" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View className="p-8 pt-4 pb-12">
                    <View className="flex-row gap-2">
                        <TextInput
                            placeholder="New Tactical Objective"
                            placeholderTextColor="#3f3f46"
                            className={`flex-1 bg-zinc-900 border rounded-xl p-4 text-sm font-bold text-white ${error ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'}`}
                            value={newTaskTitle}
                            onChangeText={handleInputChange}
                        />
                        <TouchableOpacity
                            onPress={handleAddTask}
                            disabled={!newTaskTitle.trim()}
                            className="bg-white px-6 rounded-xl items-center justify-center"
                        >
                            <Plus size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    {error && (
                        <View className="flex-row items-center gap-1 mt-2 px-1">
                            <AlertCircle size={12} color="#f87171" />
                            <Text className="text-red-400 text-[10px] font-bold">{error}</Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
