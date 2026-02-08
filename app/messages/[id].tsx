import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ChevronLeft,
    Send,
    Loader2,
    MoreHorizontal,
    Camera,
    Check,
    CheckCheck,
    X,
    Circle
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    media_url?: string;
    media_type?: string;
    created_at: string;
    is_read: boolean;
}

interface OtherUser {
    id: string;
    name: string;
    avatar_url?: string;
}

export default function ChatScreen() {
    const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (authUser && otherUserId) {
            initChat();
        }
    }, [authUser, otherUserId]);

    const initChat = async () => {
        try {
            // Load profile
            const { data: profile } = await (supabase as any).from('profiles').select('id, name, avatar_url').eq('id', otherUserId).single();
            setOtherUser(profile);

            // Find or create conversation
            const { data: convId, error: convError } = await (supabase as any).rpc('create_chat_with_user', { other_user_id: otherUserId });
            if (convError || !convId) throw convError;
            setConversationId(convId);

            // Load messages
            const { data: msgs } = await (supabase as any).from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
            setMessages(msgs || []);
        } catch (err) {
            console.error('Error init chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversationId || !authUser || isSending) return;

        setIsSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await (supabase as any).from('messages').insert({
                conversation_id: conversationId,
                sender_id: authUser.id,
                content: content
            });
            if (error) throw error;

            // For now, manually pessimistic update (or use real-time)
            // Real-time would be better, but adding manual for now
            const newMsg: Message = {
                id: Math.random().toString(),
                sender_id: authUser.id,
                content: content,
                created_at: new Date().toISOString(),
                is_read: false
            };
            setMessages(prev => [...prev, newMsg]);
        } catch (err) {
            setNewMessage(content);
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#22c55e" size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-zinc-900 bg-black">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-xl">
                            <ChevronLeft size={20} color="white" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-3">
                            {otherUser?.avatar_url ? (
                                <Image source={{ uri: otherUser.avatar_url }} className="w-10 h-10 rounded-xl" />
                            ) : (
                                <View className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center border border-zinc-700">
                                    <Text className="text-sm font-black text-green-500">{otherUser?.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View>
                                <Text className="text-sm font-black uppercase text-white tracking-widest">{otherUser?.name}</Text>
                                <View className="flex-row items-center gap-1.5">
                                    <View className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    <Text className="text-[8px] font-black text-green-500 uppercase tracking-widest">Encrypted Line</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity className="p-2">
                        <MoreHorizontal size={20} color="#3f3f46" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    className="flex-1 p-4"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item, index }) => {
                        const isMe = item.sender_id === authUser?.id;
                        return (
                            <View className={`mb-6 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <View className={`max-w-[85%] p-5 rounded-[2.2rem] ${isMe ? 'bg-white rounded-tr-none shadow-xl' : 'bg-zinc-900 border border-zinc-800 rounded-tl-none'
                                    }`}>
                                    {item.media_url && (
                                        <Image source={{ uri: item.media_url }} className="w-64 h-64 rounded-2xl mb-2" resizeMode="cover" />
                                    )}
                                    <Text className={`font-bold text-sm leading-relaxed ${isMe ? 'text-black' : 'text-zinc-200'}`}>
                                        {item.content}
                                    </Text>
                                    <View className="flex-row justify-end items-center mt-2 opacity-50">
                                        <Text className={`text-[8px] font-black uppercase mr-1 ${isMe ? 'text-black/50' : 'text-zinc-500'}`}>
                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        {isMe && (
                                            item.is_read ? <CheckCheck size={10} color="#3b82f6" /> : <Check size={10} color="#71717a" />
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Input */}
                <View className="p-6 bg-black border-t border-zinc-900">
                    <View className="flex-row gap-3">
                        <TouchableOpacity className="p-4 bg-zinc-900 border border-zinc-900 rounded-2xl items-center justify-center">
                            <Camera size={20} color="#3f3f46" />
                        </TouchableOpacity>
                        <View className="flex-1 relative">
                            <TextInput
                                placeholder="Transmit intelligence..."
                                placeholderTextColor="#3f3f46"
                                value={newMessage}
                                onChangeText={setNewMessage}
                                className="bg-zinc-900/50 border border-zinc-900 rounded-[2rem] px-6 py-4 text-white font-bold text-sm shadow-inner"
                            />
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                disabled={!newMessage.trim() || isSending}
                                className={`absolute right-1.5 top-1.5 w-11 h-11 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-green-500' : 'bg-zinc-800/50'
                                    }`}
                            >
                                <Send size={18} color={newMessage.trim() ? 'black' : '#3f3f46'} strokeWidth={3} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
