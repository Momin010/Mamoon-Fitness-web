import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Send,
    Loader2,
    MoreHorizontal,
    Image as ImageIcon,
    Camera,
    Check,
    CheckCheck,
    X
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';

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

const ChatPage: React.FC = () => {
    const { id: otherUserId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (authUser && otherUserId) {
            initChat();
        }
    }, [authUser, otherUserId]);

    useEffect(() => {
        if (conversationId) {
            const subscription = (supabase as any)
                .channel(`chat_${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload: any) => {
                        setMessages(prev => [...prev, payload.new]);
                        scrollToBottom();
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const initChat = async () => {
        if (!authUser || !otherUserId) return;
        try {
            // 1. Load other user's profile
            const { data: profile, error: profError } = await (supabase as any)
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', otherUserId)
                .single();

            if (profError) throw profError;
            setOtherUser(profile);

            // 2. Find or create conversation using ATOMIC RPC
            const { data: convId, error: convError } = await (supabase as any)
                .rpc('create_chat_with_user', { other_user_id: otherUserId });

            if (convError || !convId) throw convError || new Error('Failed to establish frequency');

            setConversationId(convId);

            // 3. Load messages
            const { data: msgs, error: msgsError } = await (supabase as any)
                .from('messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });

            if (msgsError) throw msgsError;
            setMessages(msgs || []);
        } catch (err) {
            console.error('Error initializing chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !conversationId || !authUser || isSending || isUploading) return;

        setIsSending(true);
        const content = newMessage.trim();
        const file = selectedFile;

        setNewMessage('');
        setSelectedFile(null);

        try {
            let mediaUrl = null;
            if (file) {
                setIsUploading(true);
                mediaUrl = await uploadFile(file, 'social_media', `chats/${conversationId}`);
                setIsUploading(false);
            }

            const { error } = await (supabase as any)
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: authUser.id,
                    content: content || (file ? `Shared an image` : ''),
                    media_url: mediaUrl,
                    media_type: mediaUrl ? 'image' : null
                });

            if (error) throw error;
            // Realtime subscription will handle adding the message to state
        } catch (err) {
            console.error('Error sending message:', err);
            setNewMessage(content); // Restore if failed
            setSelectedFile(file); // Restore if failed
        } finally {
            setIsSending(false);
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-black">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-lg flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-zinc-900 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        {otherUser?.avatar_url ? (
                            <img src={otherUser.avatar_url} alt={otherUser.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <span className="text-sm font-black text-green-500">{otherUser?.name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tight">{otherUser?.name}</h2>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Active Tactical
                            </p>
                        </div>
                    </div>
                </div>
                <button className="p-2 hover:bg-zinc-900 rounded-xl transition-all">
                    <MoreHorizontal size={20} />
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === authUser?.id;
                    const showDate = idx === 0 ||
                        new Date(msg.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 3600000;

                    return (
                        <div key={msg.id || idx} className="space-y-2">
                            {showDate && (
                                <div className="flex justify-center my-4">
                                    <span className="text-[8px] font-black text-zinc-700 bg-zinc-900/50 px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-900">
                                        {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-5 py-4 rounded-[2rem] text-sm font-medium leading-relaxed ${isMe
                                        ? 'bg-white text-black rounded-tr-none'
                                        : 'bg-zinc-900 text-white rounded-tl-none border border-zinc-800'
                                    }`}>
                                    {msg.media_url && (
                                        <div className="mb-3 rounded-2xl overflow-hidden border border-zinc-200/10">
                                            <img src={msg.media_url} alt="Shared" className="w-full h-auto object-cover max-h-60" />
                                        </div>
                                    )}
                                    {msg.content}
                                    {isMe && (
                                        <div className="flex justify-end mt-1">
                                            {msg.is_read ? (
                                                <CheckCheck size={12} className="text-blue-500" />
                                            ) : (
                                                <Check size={12} className="text-zinc-400" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-black border-t border-zinc-900">
                {selectedFile && (
                    <div className="mb-4 flex items-center gap-3 p-3 bg-zinc-900 rounded-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800">
                            <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase text-zinc-500 truncate">{selectedFile.name}</p>
                            <p className="text-[8px] font-black uppercase text-green-500">Ready for transmission</p>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-center ${selectedFile ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white'
                            }`}
                    >
                        <Camera size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isUploading ? "Uploading intelligence..." : "Transmit intelligence..."}
                            className="w-full bg-zinc-900/50 border border-zinc-900 rounded-3xl px-6 py-4 text-sm font-bold placeholder:text-zinc-700 focus:outline-none focus:border-green-500/50 transition-all font-medium"
                        />
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                            className={`absolute right-2 top-2 p-3 rounded-[1.25rem] transition-all flex items-center justify-center ${(newMessage.trim() || selectedFile) && !isUploading
                                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                                    : 'bg-zinc-800 text-zinc-600'
                                }`}
                        >
                            {isSending || isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;
