import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Search,
    MessageSquare,
    Loader2,
    MoreHorizontal,
    Circle,
    Plus
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';

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

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
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
                setIsLoading(false);
                return;
            }

            const conversationsData: Conversation[] = [];

            for (const convId of conversationIds) {
                const { data: otherMemberRef, error: otherMemberError } = await (supabase as any)
                    .from('conversation_members')
                    .select('user_id')
                    .eq('conversation_id', convId)
                    .neq('user_id', authUser.id)
                    .limit(1)
                    .single();

                if (otherMemberError) continue;

                const { data: profile, error: profError } = await (supabase as any)
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .eq('id', otherMemberRef.user_id)
                    .single();

                if (profError) continue;

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

                // If neither has a message, sort by ID to keep order stable
                if (timeA === 0 && timeB === 0) return a.id.localeCompare(b.id);
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
        <div className="flex flex-col min-h-screen bg-black text-white pb-20">
            <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-lg z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Secure Comms</h1>
                    </div>
                    <button
                        onClick={() => navigate('/friends')}
                        className="p-3 bg-green-500 text-black rounded-2xl hover:bg-green-400 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="hidden sm:inline">New Transmission</span>
                    </button>
                </div>

                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search transmission..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-900 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold placeholder:text-zinc-700 focus:outline-none focus:border-green-500/50 transition-all"
                    />
                </div>
            </header>

            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-green-500" size={32} />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="px-6 py-32 text-center opacity-30 flex flex-col items-center">
                        <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6">
                            <MessageSquare size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{searchQuery ? 'No matching frequencies' : 'Frequencies silent'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-950">
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => navigate(`/messages/${conv.other_user.id}`)}
                                className="w-full flex items-center gap-4 p-6 hover:bg-zinc-900/40 transition-all group text-left"
                            >
                                <div className="relative">
                                    {conv.other_user.avatar_url ? (
                                        <img
                                            src={conv.other_user.avatar_url}
                                            alt={conv.other_user.name}
                                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-zinc-900 group-hover:ring-green-500/30 transition-all"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                            <span className="text-xl font-black text-green-500">{conv.other_user.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                    {conv.unread_count > 0 && (
                                        <div className="absolute -top-1 -right-1">
                                            <Circle size={14} className="fill-green-500 text-black stroke-[3px]" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-black text-sm uppercase tracking-tight truncate">{conv.other_user.name}</h4>
                                        {conv.last_message_at && (
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase ml-2">
                                                {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate font-medium">
                                        {conv.last_message}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
