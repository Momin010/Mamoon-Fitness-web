import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2, TrendingUp, Settings, Plus, BarChart3, Trophy, Medal } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function LeaderboardScreen() {
    const router = useRouter();
    const { user, friends, workoutHistory } = useApp();
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Calculate user's tier based on level
    const getUserTier = (level: number): string => {
        if (level >= 80) return 'LEGENDARY';
        if (level >= 60) return 'ELITE';
        if (level >= 40) return 'MASTER';
        if (level >= 20) return 'VETERAN';
        return 'NOVICE';
    };

    const userTier = getUserTier(user.level);
    const xpToNextLevel = (user.level * 1000) - (user.xp % 1000);

    const allStandings = useMemo(() => {
        const standings = [
            ...friends.map(f => ({ ...f, tier: getUserTier(f.level) })),
            {
                id: 'me',
                name: user.name,
                xp: user.xp,
                level: user.level,
                tier: userTier,
                avatar: user.avatar || ''
            }
        ].sort((a, b) => b.xp - a.xp);
        return standings;
    }, [friends, user, userTier]);

    const myRank = allStandings.findIndex(f => f.id === 'me') + 1;

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'LEGENDARY': return '#facc15';
            case 'ELITE': return '#c084fc';
            case 'MASTER': return '#60a5fa';
            case 'VETERAN': return '#4ade80';
            default: return '#71717a';
        }
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return '#facc15';
        if (rank === 2) return '#d1d5db';
        if (rank === 3) return '#d97706';
        return '#3f3f46';
    };

    const weeklyXpGain = useMemo(() => {
        const lastWeek = workoutHistory
            .filter(w => w.date > Date.now() - 7 * 24 * 60 * 60 * 1000)
            .reduce((sum, w) => sum + w.totalXp, 0);
        return lastWeek;
    }, [workoutHistory]);

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-row justify-between items-center p-6 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic">System Progress</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} className="p-2 bg-zinc-900 rounded-full">
                    <Settings size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="items-center py-10">
                    <View className="relative">
                        <View className="absolute -inset-4 bg-green-500/10 rounded-full opacity-50" />
                        <Text className="text-7xl font-black italic tracking-tighter text-white">LVL {user.level}</Text>
                    </View>
                    <Text className="mt-4 font-black uppercase tracking-[0.3em] text-[10px]" style={{ color: getTierColor(userTier) }}>
                        {userTier} AGENT • {xpToNextLevel.toLocaleString()} XP TO EVOLVE
                    </Text>
                </View>

                <View className="px-6 flex-row gap-4 mb-10">
                    <View className="flex-1 bg-zinc-900/60 p-6 rounded-[2rem] border border-zinc-800 items-center">
                        <Text className="text-3xl font-black text-green-500 italic">{user.xp.toLocaleString()}</Text>
                        <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Total Intelligence</Text>
                    </View>
                    <View className="flex-1 bg-zinc-900/60 p-6 rounded-[2rem] border border-zinc-800 items-center">
                        <Text className="text-3xl font-black text-blue-500 italic">+{weeklyXpGain}</Text>
                        <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">7D Efficiency</Text>
                    </View>
                </View>

                <View className="px-6 mb-12">
                    <View className="flex-row justify-between items-end mb-8">
                        <View>
                            <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Global Standings</Text>
                            <Text className="text-2xl font-black italic text-white uppercase tracking-tighter">Leaderboard</Text>
                        </View>
                        <View className="bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                            <Text className="text-green-500 font-black uppercase text-[10px] tracking-widest">RANK #{myRank}</Text>
                        </View>
                    </View>

                    {allStandings.length === 1 ? (
                        <View className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 items-center opacity-40">
                            <Users size={48} color="#52525b" />
                            <Text className="text-white font-black uppercase text-center mt-6 italic">No Rivals Detected</Text>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {allStandings.map((friend, idx) => (
                                <View
                                    key={friend.id}
                                    className={`flex-row items-center gap-4 p-5 rounded-[2rem] border ${friend.id === 'me' ? 'bg-zinc-900 border-green-500/30' : 'bg-black border-zinc-900'
                                        }`}
                                >
                                    <View className="w-10 items-center">
                                        <Text className="font-black italic text-lg" style={{ color: getRankColor(idx + 1) }}>
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </Text>
                                    </View>

                                    <View className="relative">
                                        {friend.avatar ? (
                                            <Image source={{ uri: friend.avatar }} className="w-12 h-12 rounded-2xl" />
                                        ) : (
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center border-2 ${friend.id === 'me' ? 'bg-green-500 border-green-400' : 'bg-zinc-800 border-zinc-700'}`}>
                                                <Text className="font-black text-[10px] text-black italic">{friend.id === 'me' ? 'YOU' : 'CIV'}</Text>
                                            </View>
                                        )}
                                        {idx < 3 && (
                                            <View className="absolute -top-2 -right-2 p-1.5 rounded-full bg-black border border-zinc-800 shadow-xl">
                                                <Trophy size={10} color={getRankColor(idx + 1)} fill={getRankColor(idx + 1)} />
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-1 ml-2">
                                        <Text className="text-white font-black uppercase italic text-sm tracking-tight">{friend.name}</Text>
                                        <Text className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5" style={{ color: getTierColor(friend.tier) }}>{friend.tier}</Text>
                                    </View>

                                    <View className="items-end">
                                        <Text className="text-white font-black italic text-sm">{friend.xp.toLocaleString()}</Text>
                                        <Text className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-0.5">LVL {friend.level}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
