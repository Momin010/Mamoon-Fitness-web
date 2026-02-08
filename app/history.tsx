import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock, Trophy, Trash2, Dumbbell } from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export default function WorkoutHistoryScreen() {
    const router = useRouter();
    const { workoutHistory, deleteWorkoutSession } = useApp();

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const totalStats = workoutHistory.reduce((acc, session) => ({
        workouts: acc.workouts + 1,
        duration: acc.duration + session.duration,
        xp: acc.xp + session.totalXp,
        exercises: acc.exercises + session.exercises.length
    }), { workouts: 0, duration: 0, xp: 0, exercises: 0 });

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-row items-center gap-4 p-6 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">History</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Stats Dashboard */}
                <View className="p-6 border-b border-zinc-900">
                    <View className="flex-row flex-wrap gap-4">
                        <View className="flex-1 min-w-[45%] p-6 bg-zinc-900 rounded-3xl items-center border border-zinc-800">
                            <Text className="text-3xl font-black text-green-500 italic">{totalStats.workouts}</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Workouts</Text>
                        </View>
                        <View className="flex-1 min-w-[45%] p-6 bg-zinc-900 rounded-3xl items-center border border-zinc-800">
                            <Text className="text-3xl font-black text-blue-500 italic">{Math.round(totalStats.duration / 60)}h</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Total Time</Text>
                        </View>
                        <View className="flex-1 min-w-[45%] p-6 bg-zinc-900 rounded-3xl items-center border border-zinc-800">
                            <Text className="text-3xl font-black text-yellow-500 italic">{totalStats.xp.toLocaleString()}</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">XP Gained</Text>
                        </View>
                        <View className="flex-1 min-w-[45%] p-6 bg-zinc-900 rounded-3xl items-center border border-zinc-800">
                            <Text className="text-3xl font-black text-purple-500 italic">{totalStats.exercises}</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Moves</Text>
                        </View>
                    </View>
                </View>

                {/* History List */}
                <View className="p-6">
                    {workoutHistory.length === 0 ? (
                        <View className="items-center py-20 opacity-30">
                            <Dumbbell size={48} color="#52525b" />
                            <Text className="text-zinc-500 text-lg font-bold mt-4 uppercase italic tracking-tighter text-center">No logs detected</Text>
                            <TouchableOpacity onPress={() => router.push('/')} className="mt-4">
                                <Text className="text-green-500 font-black uppercase text-xs tracking-widest">Initiate Session</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="space-y-6">
                            {workoutHistory.map(session => (
                                <View key={session.id} className="p-6 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 mb-6">
                                    <View className="flex-row items-start justify-between mb-4">
                                        <View className="flex-row items-center gap-4">
                                            <View className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
                                                <Trophy size={20} color="#22c55e" />
                                            </View>
                                            <View>
                                                <Text className="text-white font-black uppercase italic">Log #{session.id.slice(-4)}</Text>
                                                <View className="flex-row items-center gap-2 mt-1">
                                                    <Calendar size={12} color="#71717a" />
                                                    <Text className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{formatDate(session.date)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => deleteWorkoutSession(session.id)}
                                            className="p-2"
                                        >
                                            <Trash2 size={16} color="#3f3f46" />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex-row items-center gap-6 mb-4 px-1">
                                        <View className="flex-row items-center gap-2">
                                            <Clock size={16} color="#71717a" />
                                            <Text className="text-white font-bold text-xs">{formatDuration(session.duration)}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <Trophy size={16} color="#eab308" />
                                            <Text className="text-yellow-500 font-bold text-xs">+{session.totalXp} XP</Text>
                                        </View>
                                    </View>

                                    <View className="space-y-1 mt-4">
                                        {session.exercises.map((exercise, idx) => (
                                            <View key={idx} className="flex-row items-center justify-between py-3 border-t border-zinc-800/50">
                                                <Text className="text-zinc-200 font-bold text-xs uppercase italic">{exercise.name}</Text>
                                                <Text className="text-zinc-500 text-[10px] font-black">
                                                    {exercise.completedSets}/{exercise.sets} SETS × {exercise.reps} REPS
                                                    {exercise.weight ? ` @ ${exercise.weight}LB` : ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {session.notes ? (
                                        <View className="mt-4 p-4 bg-black/40 rounded-xl border border-zinc-800/30">
                                            <Text className="text-zinc-500 text-[10px] font-bold italic tracking-wide">"{session.notes}"</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
