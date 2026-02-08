import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Search,
    MessageSquare,
    Loader2,
    MoreHorizontal,
    Circle,
    Plus
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface Conversation {
    id: string;
    last_message?: string;
    last_message_at?: string;
    unread_count: number;
    other_user: {
        id: string;
        name: string;
        avatar_url?: string;
    };
}

export default function MessagesScreen() {
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (authUser) {
            loadConversations();
        }
    }, [authUser]);

    const loadConversations = async () => {
        if (!authUser) return;
        try {
            const { data: memberships, error: memError } = await (supabase as any)
                .from('conversation_members')
                .select('conversation_id')
                .eq('user_id', authUser.id);

            if (memError) throw memError;

            const conversationIds = memberships?.map((m: any) => m.conversation_id) || [];
            if (conversationIds.length === 0) {
                setConversations([]);
                return;
            }

            const conversationsData: Conversation[] = [];
            for (const convId of conversationIds) {
                const { data: otherMemberRef } = await (supabase as any)
                    .from('conversation_members')
                    .select('user_id')
                    .eq('conversation_id', convId)
                    .neq('user_id', authUser.id)
                    .limit(1)
                    .single();

                if (!otherMemberRef) continue;

                const { data: profile } = await (supabase as any)
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .eq('id', otherMemberRef.user_id)
                    .single();

                if (!profile) continue;

                const { data: lastMessage } = await (supabase as any)
                    .from('messages')
                    .select('content, created_at')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                conversationsData.push({
                    id: convId,
                    last_message: lastMessage?.content || 'Started a conversation',
                    last_message_at: lastMessage?.created_at,
                    unread_count: 0,
                    other_user: profile
                });
            }

            conversationsData.sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return timeB - timeA;
            });

            setConversations(conversationsData);
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="p-6 border-b border-zinc-900 bg-black/80">
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => router.back()} className="p-3 bg-zinc-900 rounded-2xl">
                            <ChevronLeft size={20} color="white" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Secure Comms</Text>
                    </View>
                    <TouchableOpacity className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-500/20">
                        <Plus size={20} color="black" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                <View className="relative">
                    <View className="absolute left-5 top-[18px] z-10">
                        <Search size={16} color="#3f3f46" />
                    </View>
                    <TextInput
                        placeholder="Search Active Frequencies..."
                        placeholderTextColor="#3f3f46"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="bg-zinc-900/50 border border-zinc-900 rounded-3xl pl-12 pr-6 py-4 text-white font-bold text-xs shadow-inner"
                    />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="py-20">
                        <ActivityIndicator color="#22c55e" size="large" />
                    </View>
                ) : filteredConversations.length === 0 ? (
                    <View className="items-center py-32 opacity-30">
                        <MessageSquare size={48} color="#52525b" />
                        <Text className="text-white font-black uppercase text-[10px] tracking-widest mt-6 italic">No transmissions detected</Text>
                    </View>
                ) : (
                    <View className="p-2">
                        {filteredConversations.map((conv) => (
                            <TouchableOpacity
                                key={conv.id}
                                onPress={() => router.push(`/messages/${conv.other_user.id}`)}
                                className="flex-row items-center gap-5 p-4 mx-2 my-1 rounded-[2rem] hover:bg-zinc-900/40"
                            >
                                <View className="relative">
                                    {conv.other_user.avatar_url ? (
                                        <Image source={{ uri: conv.other_user.avatar_url }} className="w-14 h-14 rounded-[1.25rem] border-2 border-zinc-900" />
                                    ) : (
                                        <View className="w-14 h-14 rounded-[1.25rem] bg-zinc-900 border border-zinc-800 items-center justify-center">
                                            <Text className="text-green-500 font-black text-xl">{conv.other_user.name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border-2 border-black items-center justify-center">
                                        <View className="w-2 h-2 rounded-full bg-green-500" />
                                    </View>
                                </View>

                                <View className="flex-1 min-w-0">
                                    <View className="flex-row justify-between items-baseline mb-1">
                                        <Text className="text-white font-black uppercase italic tracking-tight text-sm truncate">{conv.other_user.name}</Text>
                                        {conv.last_message_at && (
                                            <Text className="text-[8px] font-black text-zinc-600 uppercase">
                                                {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        )}
                                    </View>
                                    <Text className="text-zinc-500 text-xs font-bold truncate lowercase" numberOfLines={1}>
                                        {conv.last_message}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
