import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Heart,
    MessageCircle,
    Share2,
    Trophy,
    Flame,
    Utensils,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Dumbbell,
    Plus,
    Send,
    X,
    Target,
    Zap,
    Camera,
    Image as ImageIcon
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton } from '../../components/ForgeButton';

interface Activity {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    type: 'workout' | 'meal' | 'task' | 'achievement' | 'level_up' | 'post' | 'mentorship';
    content: {
        title: string;
        description: string;
        metadata?: Record<string, any>;
    };
    media_url?: string;
    likes: number;
    comments: number;
    created_at: string;
    is_liked_by_me: boolean;
}

export default function SocialFeedScreen() {
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'friends'>('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isPosting, setIsPosting] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [isSubmitLoading, setIsSubmitLoading] = useState(false);

    useEffect(() => {
        if (!authUser) return;
        loadActivities();
    }, [authUser, activeTab, page]);

    const loadActivities = async () => {
        if (!authUser) return;

        setIsLoading(true);
        try {
            // Fetch activities
            let activitiesQuery = (supabase as any)
                .from('social_activities')
                .select('*')
                .order('created_at', { ascending: false })
                .range((page - 1) * 20, page * 20 - 1);

            const { data: activitiesData, error: activitiesError } = await activitiesQuery as { data: any[] | null, error: any };
            if (activitiesError) throw activitiesError;

            // Get unique user IDs
            const userIds = [...new Set((activitiesData || []).map(a => a.user_id))];
            if (userIds.length === 0) {
                setActivities(prev => page === 1 ? [] : prev);
                setHasMore(false);
                return;
            }

            // Fetch profiles
            const { data: profilesData, error: profilesError } = await (supabase as any)
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds) as { data: any[] | null, error: any };

            const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

            // Fetch likes
            const activityIds = (activitiesData || []).map(a => a.id);
            let likesCountMap = new Map<string, number>();
            let userLikedSet = new Set<string>();

            if (activityIds.length > 0) {
                const { data: likesData } = await (supabase as any)
                    .from('social_likes')
                    .select('activity_id')
                    .in('activity_id', activityIds) as { data: any[] | null };

                likesData?.forEach(like => {
                    const count = likesCountMap.get(like.activity_id) || 0;
                    likesCountMap.set(like.activity_id, count + 1);
                });

                const { data: userLikesData } = await (supabase as any)
                    .from('social_likes')
                    .select('activity_id')
                    .eq('user_id', authUser.id)
                    .in('activity_id', activityIds) as { data: any[] | null };

                userLikedSet = new Set(userLikesData?.map(l => l.activity_id) || []);
            }

            const transformed: Activity[] = (activitiesData || []).map((a: any) => {
                const profile = profilesMap.get(a.user_id) as any;
                return {
                    id: a.id,
                    user_id: a.user_id,
                    user_name: profile?.name || 'Unknown User',
                    user_avatar: profile?.avatar_url,
                    type: a.type,
                    content: a.content,
                    media_url: a.media_url,
                    likes: likesCountMap.get(a.id) || 0,
                    comments: a.comments || 0,
                    created_at: a.created_at,
                    is_liked_by_me: userLikedSet.has(a.id)
                };
            });

            setActivities(prev => page === 1 ? transformed : [...prev, ...transformed]);
            setHasMore(transformed.length === 20);
        } catch (err) {
            console.error('Error loading activities:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!authUser || (!postContent.trim() && !postTitle.trim() && !mediaUrl.trim())) return;

        setIsSubmitLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('social_activities')
                .insert({
                    user_id: authUser.id,
                    type: 'post',
                    content: {
                        title: postTitle || 'Update',
                        description: postContent
                    },
                    media_url: mediaUrl.trim() || null,
                    media_type: mediaUrl.trim() ? 'image' : null
                });

            if (error) throw error;

            setPostTitle('');
            setPostContent('');
            setMediaUrl('');
            setIsPosting(false);
            setPage(1);
            loadActivities();
        } catch (err) {
            console.error('Error creating post:', err);
            Alert.alert('Error', 'Failed to share post.');
        } finally {
            setIsSubmitLoading(false);
        }
    };

    const handleLike = async (activityId: string, isLiked: boolean) => {
        if (!authUser) return;
        try {
            if (isLiked) {
                await (supabase as any)
                    .from('social_likes')
                    .delete()
                    .eq('activity_id', activityId)
                    .eq('user_id', authUser.id);
            } else {
                await (supabase as any).from('social_likes').insert({ activity_id: activityId, user_id: authUser.id });
            }
            setActivities(prev => prev.map(a =>
                a.id === activityId
                    ? { ...a, likes: a.likes + (isLiked ? -1 : 1), is_liked_by_me: !isLiked }
                    : a
            ));
        } catch (err) {
            console.error('Error liking:', err);
        }
    };

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'workout': return <Dumbbell size={20} color="#22c55e" />;
            case 'meal': return <Utensils size={20} color="#f97316" />;
            case 'task': return <CheckCircle2 size={20} color="#3b82f6" />;
            case 'achievement': return <Trophy size={20} color="#eab308" />;
            case 'level_up': return <Flame size={20} color="#a855f7" />;
            case 'post': return <Send size={20} color="#71717a" />;
            case 'mentorship': return <Target size={20} color="#ef4444" />;
            default: return <Zap size={20} color="#22c55e" />;
        }
    };

    const getActivityColor = (type: Activity['type']) => {
        switch (type) {
            case 'workout': return 'bg-green-500/10 border-green-500/20';
            case 'meal': return 'bg-orange-500/10 border-orange-500/20';
            case 'task': return 'bg-blue-500/10 border-blue-500/20';
            case 'achievement': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'level_up': return 'bg-purple-500/10 border-purple-500/20';
            case 'post': return 'bg-zinc-900 border-zinc-800';
            case 'mentorship': return 'bg-red-500/10 border-red-500/20';
            default: return 'bg-zinc-900';
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-row items-center gap-4 p-6 border-b border-zinc-900 sticky top-0 bg-black/80 z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Forge Feed</Text>
            </View>

            <View className="flex-row border-b border-zinc-900">
                {['Discover', 'Following'].map((label, idx) => (
                    <TouchableOpacity
                        key={label}
                        onPress={() => {
                            setActiveTab(idx === 0 ? 'all' : 'friends');
                            setPage(1);
                        }}
                        className={`flex-1 py-4 items-center border-b-2 ${(idx === 0 && activeTab === 'all') || (idx === 1 && activeTab === 'friends')
                                ? 'border-green-500' : 'border-transparent'
                            }`}
                    >
                        <Text className={`font-black uppercase text-[10px] tracking-widest ${(idx === 0 && activeTab === 'all') || (idx === 1 && activeTab === 'friends')
                                ? 'text-green-500' : 'text-zinc-500'
                            }`}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isLoading && page === 1 ? (
                    <View className="py-20">
                        <ActivityIndicator color="#22c55e" size="large" />
                    </View>
                ) : activities.length === 0 ? (
                    <View className="items-center py-20 px-8 opacity-40">
                        <Share2 size={48} color="#52525b" />
                        <Text className="text-white font-black uppercase text-center mt-6 italic">No broadcasts detected</Text>
                    </View>
                ) : (
                    <View className="p-4">
                        {activities.map((activity) => (
                            <View key={activity.id} className="mb-8 p-1">
                                <View className="flex-row items-center gap-4 mb-4">
                                    {activity.user_avatar ? (
                                        <Image source={{ uri: activity.user_avatar }} className="w-12 h-12 rounded-2xl" />
                                    ) : (
                                        <View className="w-12 h-12 rounded-2xl bg-zinc-900 items-center justify-center border border-zinc-800">
                                            <Text className="text-green-500 font-bold text-lg">{activity.user_name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View className="flex-1">
                                        <Text className="text-white font-black uppercase italic tracking-tight text-sm">{activity.user_name}</Text>
                                        <Text className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-0.5">{formatTimeAgo(activity.created_at)}</Text>
                                    </View>
                                    <TouchableOpacity className="p-2">
                                        <MoreHorizontal size={20} color="#3f3f46" />
                                    </TouchableOpacity>
                                </View>

                                <View className={`p-6 rounded-[2.5rem] border ${getActivityColor(activity.type)} shadow-lg`}>
                                    <View className="flex-row items-start gap-4 mb-4">
                                        <View className="p-3 bg-black/40 rounded-2xl border border-zinc-800/30">
                                            {getActivityIcon(activity.type)}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-black uppercase italic text-xs mb-1">{activity.content.title}</Text>
                                            <Text className="text-zinc-400 font-bold text-sm leading-relaxed">{activity.content.description}</Text>
                                        </View>
                                    </View>
                                    {activity.media_url && (
                                        <View className="rounded-3xl overflow-hidden border border-zinc-800 bg-black mt-2">
                                            <Image
                                                source={{ uri: activity.media_url }}
                                                className="w-full h-64"
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                </View>

                                <View className="flex-row items-center gap-8 mt-4 px-4">
                                    <TouchableOpacity
                                        onPress={() => handleLike(activity.id, activity.is_liked_by_me)}
                                        className="flex-row items-center gap-2"
                                    >
                                        <Heart size={20} color={activity.is_liked_by_me ? '#ef4444' : '#3f3f46'} fill={activity.is_liked_by_me ? '#ef4444' : 'transparent'} />
                                        <Text className={`font-black text-xs ${activity.is_liked_by_me ? 'text-red-500' : 'text-zinc-600'}`}>{activity.likes}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="flex-row items-center gap-2">
                                        <MessageCircle size={20} color="#3f3f46" />
                                        <Text className="font-black text-xs text-zinc-600">{activity.comments}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="ml-auto">
                                        <Share2 size={20} color="#3f3f46" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                <View className="h-32" />
            </ScrollView>

            <TouchableOpacity
                onPress={() => setIsPosting(true)}
                className="absolute bottom-10 right-8 w-16 h-16 bg-green-500 rounded-3xl items-center justify-center shadow-2xl shadow-green-500/20 border-4 border-black"
            >
                <Plus size={32} color="black" strokeWidth={3} />
            </TouchableOpacity>

            <Modal visible={isPosting} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/95 justify-center p-8">
                    <View className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Ignite Post</Text>
                            <TouchableOpacity onPress={() => setIsPosting(false)} className="bg-zinc-800 p-3 rounded-2xl">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-6">
                            <TextInput
                                placeholder="Post Headline"
                                placeholderTextColor="#3f3f46"
                                className="bg-black border border-zinc-800 rounded-3xl px-6 py-4 text-white font-black italic shadow-inner"
                                value={postTitle}
                                onChangeText={setPostTitle}
                            />
                            <TextInput
                                placeholder="Share your message..."
                                placeholderTextColor="#3f3f46"
                                multiline
                                numberOfLines={4}
                                className="bg-black border border-zinc-800 rounded-3xl px-6 py-5 text-white font-bold h-32"
                                value={postContent}
                                onChangeText={setPostContent}
                            />
                            <TextInput
                                placeholder="Image URL (Optional)"
                                placeholderTextColor="#3f3f46"
                                className="bg-black border border-zinc-800 rounded-3xl px-6 py-4 text-white font-bold text-xs"
                                value={mediaUrl}
                                onChangeText={setMediaUrl}
                            />

                            <View className="pt-4">
                                <ForgeButton
                                    variant="primary"
                                    onPress={handleCreatePost}
                                    isLoading={isSubmitLoading}
                                    uppercase
                                    leftIcon={<Send size={18} color="black" />}
                                >
                                    Launch Broadcast
                                </ForgeButton>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
