import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Target, Zap, ArrowRight, Users, Trophy, Share2, MessageSquare } from 'lucide-react-native';

export default function HubScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <header className="mb-10 pt-4 px-2">
                    <Text className="text-4xl font-black uppercase tracking-tighter mb-2 italic text-white">Forge <Text className="text-green-500">Hub</Text></Text>
                    <View className="bg-zinc-900 self-start px-2 py-1 rounded-md">
                        <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Connect & Grow</Text>
                    </View>
                </header>

                <View className="space-y-6">
                    {/* Social Feed Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/social')}
                        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 mb-6 relative overflow-hidden"
                    >
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />

                        <View className="relative z-10">
                            <View className="w-14 h-14 bg-green-500/20 rounded-2xl items-center justify-center mb-10 border border-green-500/20">
                                <Share2 size={28} color="#22c55e" />
                            </View>

                            <Text className="text-3xl font-black uppercase tracking-tight mb-2 text-white italic">Social Feed</Text>
                            <Text className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-[240px] font-bold">
                                Share your progress and get inspired by the community.
                            </Text>

                            <View className="flex-row items-center gap-2">
                                <Text className="text-green-500 font-black uppercase tracking-[0.2em] text-[10px]">Open Feed</Text>
                                <ArrowRight size={14} color="#22c55e" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Human Mentorship Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/mentorship')}
                        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 mb-6 relative overflow-hidden"
                    >
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

                        <View className="relative z-10">
                            <View className="w-14 h-14 bg-blue-500/20 rounded-2xl items-center justify-center mb-10 border border-blue-500/20">
                                <Users size={28} color="#3b82f6" />
                            </View>

                            <Text className="text-3xl font-black uppercase tracking-tight mb-2 text-white italic">Expert Mentors</Text>
                            <Text className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-[240px] font-bold">
                                Elite human athletes. Custom coaching & 1-on-1 focus.
                            </Text>

                            <View className="flex-row items-center gap-2">
                                <Text className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px]">Discover Pro Coaches</Text>
                                <ArrowRight size={14} color="#3b82f6" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Secondary Actions */}
                    <View className="flex-row gap-4 mt-4">
                        <TouchableOpacity
                            onPress={() => router.push('/leaderboard')}
                            className="flex-1 items-center justify-center gap-3 p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2rem]"
                        >
                            <View className="w-12 h-12 items-center justify-center bg-zinc-900 rounded-2xl mb-1">
                                <Trophy size={24} color="#eab308" />
                            </View>
                            <Text className="font-black text-white text-[10px] uppercase tracking-widest text-center">Rankings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/messages')}
                            className="flex-1 items-center justify-center gap-3 p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2rem]"
                        >
                            <View className="w-12 h-12 items-center justify-center bg-zinc-900 rounded-2xl mb-1">
                                <MessageSquare size={24} color="#3b82f6" />
                            </View>
                            <Text className="font-black text-white text-[10px] uppercase tracking-widest text-center">Messages</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Accent */}
                <View className="mt-20 pb-12 items-center opacity-40">
                    <Text className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">Pure Performance. No AI.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
