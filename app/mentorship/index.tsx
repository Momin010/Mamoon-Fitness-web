import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Target,
    Star,
    Users,
    Search,
    Filter,
    ArrowRight,
    ShieldCheck,
    Zap,
    Loader2,
    Calendar,
    DollarSign,
    Plus,
    Edit3,
    Trash2,
    MessageSquare,
    X
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton } from '../../components/ForgeButton';

interface Mentorship {
    id: string;
    coach_id: string;
    title: string;
    description: string;
    price_monthly: number;
    features: string[];
    is_active: boolean;
    coach_name?: string;
    coach_avatar?: string;
}

export default function MentorshipScreen() {
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCoach, setIsCoach] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newFeatures, setNewFeatures] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authUser?.id) return;
        checkCoachStatus();
        loadMentorships();
    }, [authUser?.id]);

    const checkCoachStatus = async () => {
        try {
            const { data } = await supabase.from('coach_profiles').select('id').eq('user_id', authUser?.id).single();
            if (data) setIsCoach(true);
        } catch (err) { }
    };

    const loadMentorships = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await (supabase as any).from('coach_mentorships').select('*').eq('is_active', true);
            if (error) throw error;

            const coachIds = [...new Set((data || []).map(m => m.coach_id))];
            const { data: profiles } = await (supabase as any).from('profiles').select('id, name, avatar_url').in('id', coachIds);
            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const transformed = (data || []).map(m => ({
                ...m,
                coach_name: profilesMap.get(m.coach_id)?.name || 'Elite Coach',
                coach_avatar: profilesMap.get(m.coach_id)?.avatar_url
            }));

            setMentorships(transformed);
        } catch (err) {
            console.error('Error loading mentorships:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMentorship = async () => {
        if (!authUser || !newTitle || !newDesc) return;
        setIsSubmitting(true);
        try {
            const featuresArray = newFeatures.split(',').map(f => f.trim()).filter(f => f !== '');
            const { error } = await (supabase as any).from('coach_mentorships').insert({
                coach_id: authUser.id,
                title: newTitle,
                description: newDesc,
                price_monthly: parseFloat(newPrice) || 0,
                features: featuresArray,
                is_active: true
            });
            if (error) throw error;
            setShowCreateModal(false);
            loadMentorships();
            setNewTitle(''); setNewDesc(''); setNewPrice(''); setNewFeatures('');
        } catch (err) {
            Alert.alert('Error', 'Failed to launch program.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Visual Header */}
                <View className="h-72 bg-zinc-900 justify-end relative overflow-hidden">
                    <View className="absolute inset-0 bg-green-500/10" />
                    <View className="p-8 pb-10">
                        <TouchableOpacity onPress={() => router.back()} className="absolute top-4 left-6 p-3 bg-black/40 rounded-full">
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-4xl font-black uppercase tracking-tighter italic text-white leading-tight">Social{'\n'}<Text className="text-green-500">Mentorship</Text></Text>
                        <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4 max-w-[280px]">Direct 1-on-1 access to elite performers and professional coaches.</Text>
                    </View>
                </View>

                <View className="p-6">
                    <View className="flex-row items-center justify-between mb-8">
                        <TouchableOpacity className="flex-row items-center gap-2 px-4 py-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                            <Filter size={16} color="#71717a" />
                            <Text className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Filter</Text>
                        </TouchableOpacity>
                        {isCoach && (
                            <TouchableOpacity onPress={() => setShowCreateModal(true)} className="flex-row items-center gap-2 px-6 py-4 bg-green-500 rounded-2xl">
                                <Plus size={18} color="black" />
                                <Text className="text-black font-black uppercase text-[10px] tracking-widest">Post Program</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View className="py-20">
                            <ActivityIndicator color="#22c55e" size="large" />
                        </View>
                    ) : mentorships.length === 0 ? (
                        <View className="items-center py-20 px-10 opacity-40">
                            <Target size={48} color="#52525b" />
                            <Text className="text-white font-black uppercase text-center mt-6 italic">No active programs detected</Text>
                        </View>
                    ) : (
                        <View className="space-y-8">
                            {mentorships.map((program) => (
                                <View key={program.id} className="bg-zinc-900/60 border border-zinc-900 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden">
                                    <View className="absolute top-[-20] right-[-20] opacity-5">
                                        <Target size={120} color="white" />
                                    </View>

                                    <View className="flex-row items-center gap-4 mb-6">
                                        {program.coach_avatar ? (
                                            <Image source={{ uri: program.coach_avatar }} className="w-12 h-12 rounded-full border border-zinc-800" />
                                        ) : (
                                            <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700">
                                                <Star size={20} color="#22c55e" />
                                            </View>
                                        )}
                                        <View>
                                            <Text className="text-green-500 font-black uppercase italic text-xs">{program.coach_name}</Text>
                                            <Text className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">ELITE PRO COACH</Text>
                                        </View>
                                    </View>

                                    <Text className="text-2xl font-black uppercase italic text-white mb-3 tracking-tighter">{program.title}</Text>
                                    <Text className="text-zinc-500 text-sm font-bold leading-relaxed mb-6">{program.description}</Text>

                                    <View className="space-y-3 mb-8">
                                        {program.features.slice(0, 3).map((f, i) => (
                                            <View key={i} className="flex-row items-center gap-2">
                                                <Zap size={14} color="#22c55e" />
                                                <Text className="text-zinc-300 font-bold text-[10px] uppercase tracking-wide">{f}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View className="flex-row items-center justify-between border-t border-zinc-800/50 pt-6 mt-2">
                                        <View>
                                            <Text className="text-3xl font-black text-white italic">${program.price_monthly}</Text>
                                            <Text className="text-zinc-600 font-black uppercase text-[8px] tracking-[0.2em] mt-1">Monthly Subscription</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => router.push(`/messages/${program.coach_id}`)}
                                            className="bg-white px-6 py-4 rounded-2xl flex-row items-center gap-2 shadow-lg"
                                        >
                                            <Text className="text-black font-black uppercase tracking-widest text-[10px]">Contract</Text>
                                            <ArrowRight size={14} color="black" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                <View className="h-20" />
            </ScrollView>

            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/95 p-8 justify-center">
                    <ScrollView className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800" showsVerticalScrollIndicator={false}>
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Deploy Program</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} className="bg-zinc-800 p-3 rounded-2xl">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-widest px-2 mb-2">Operation Title</Text>
                                <TextInput
                                    className="bg-black border border-zinc-800 rounded-3xl p-5 text-white font-black italic shadow-inner"
                                    placeholder="PROGRAM NAME"
                                    placeholderTextColor="#3b3b3b"
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                />
                            </View>
                            <View>
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-widest px-2 mb-2">Monthly Fee ($)</Text>
                                <TextInput
                                    className="bg-black border border-zinc-800 rounded-3xl p-5 text-white font-black italic shadow-inner"
                                    placeholder="99.00"
                                    placeholderTextColor="#3b3b3b"
                                    keyboardType="numeric"
                                    value={newPrice}
                                    onChangeText={setNewPrice}
                                />
                            </View>
                            <View>
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-widest px-2 mb-2">Strategic Description</Text>
                                <TextInput
                                    className="bg-black border border-zinc-800 rounded-3xl p-5 text-white font-bold h-32"
                                    placeholder="Mission specifics..."
                                    placeholderTextColor="#3b3b3b"
                                    multiline
                                    value={newDesc}
                                    onChangeText={setNewDesc}
                                />
                            </View>
                            <View>
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-widest px-2 mb-2">Directives (Comma separated)</Text>
                                <TextInput
                                    className="bg-black border border-zinc-800 rounded-3xl p-5 text-white font-bold text-xs"
                                    placeholder="1-ON-1, CUSTOM PLAN, 24/7 SUPPORT"
                                    placeholderTextColor="#3b3b3b"
                                    value={newFeatures}
                                    onChangeText={setNewFeatures}
                                />
                            </View>

                            <View className="pt-8 mb-10">
                                <ForgeButton
                                    variant="primary"
                                    onPress={handleCreateMentorship}
                                    isLoading={isSubmitting}
                                    uppercase
                                >
                                    Activate Program
                                </ForgeButton>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
