import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    MapPin,
    Calendar,
    Trophy,
    Flame,
    MessageSquare,
    UserPlus,
    UserMinus,
    Loader2,
    Heart,
    Share2,
    MoreHorizontal,
    Plus
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';

interface ProfileData {
    id: string;
    name: string;
    avatar_url?: string;
    xp: number;
    level: number;
    rank: number;
    created_at: string;
    is_following: boolean;
    followers_count: number;
    following_count: number;
}

interface Activity {
    id: string;
    type: string;
    content: any;
    likes: number;
    created_at: string;
}

const PublicProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadProfile();
            loadActivities();
        }
    }, [id, authUser]);

    const loadProfile = async () => {
        if (!id) return;
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            let isFollowing = false;
            if (authUser && authUser.id !== id) {
                const { data: followData } = await (supabase as any)
                    .from('user_follows')
                    .select('*')
                    .eq('follower_id', authUser.id)
                    .eq('following_id', id);
                isFollowing = (followData?.length || 0) > 0;
            }

            // Get stats
            const { data: statsData } = await (supabase as any)
                .rpc('get_profile_stats', { profile_id: id });

            const stats = statsData && statsData.length > 0 ? statsData[0] : { followers_count: 0, following_count: 0 };

            setProfile({
                ...data,
                is_following: isFollowing,
                followers_count: stats.followers_count || 0,
                following_count: stats.following_count || 0
            });
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadActivities = async () => {
        if (!id) return;
        try {
            const { data, error } = await (supabase as any)
                .from('social_activities')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActivities(data || []);
        } catch (err) {
            console.error('Error loading activities:', err);
        }
    };

    const handleFollow = async () => {
        if (!authUser || !profile || !id) return;
        setIsActionLoading(true);
        try {
            if (profile.is_following) {
                await (supabase as any)
                    .from('user_follows')
                    .delete()
                    .eq('follower_id', authUser.id)
                    .eq('following_id', id);
            } else {
                await (supabase as any)
                    .from('user_follows')
                    .insert({
                        follower_id: authUser.id,
                        following_id: id
                    });
            }
            setProfile(prev => prev ? { ...prev, is_following: !prev.is_following } : null);
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const startMessage = async () => {
        if (!authUser || !id) return;
        navigate(`/messages/${id}`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-black">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-black p-6 text-center">
                <h1 className="text-2xl font-black uppercase mb-4 text-red-500">Athlete Not Found</h1>
                <ForgeButton onClick={() => navigate(-1)}>Go Back</ForgeButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white pb-20">
            {/* Header / Cover Area */}
            <div className="relative h-48 bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md rounded-2xl hover:bg-black transition-all z-10"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            <div className="px-6 -mt-16 relative z-10">
                <div className="flex justify-between items-end mb-6">
                    <div className="relative">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.name}
                                className="w-32 h-32 rounded-[2.5rem] border-4 border-black object-cover shadow-2xl"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-800 border-4 border-black flex items-center justify-center shadow-2xl">
                                <span className="text-4xl font-black text-green-500">{profile.name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-lg">
                            LVL {profile.level}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {authUser?.id !== id ? (
                            <>
                                <button
                                    onClick={startMessage}
                                    className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 transition-all active:scale-95"
                                >
                                    <MessageSquare size={20} />
                                </button>
                                <ForgeButton
                                    variant={profile.is_following ? "secondary" : "primary"}
                                    onClick={handleFollow}
                                    isLoading={isActionLoading}
                                    className="px-8"
                                    leftIcon={profile.is_following ? <UserMinus size={18} /> : <UserPlus size={18} />}
                                >
                                    {profile.is_following ? "Unfollow" : "Follow"}
                                </ForgeButton>
                            </>
                        ) : (
                            <ForgeButton onClick={() => navigate('/settings')}>Edit Profile</ForgeButton>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-1">{profile.name}</h1>
                    <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5 text-green-500"><Trophy size={12} /> Rank #{profile.rank}</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-3xl text-center">
                        <span className="text-xl font-black italic">{profile.followers_count}</span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Followers</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-3xl text-center">
                        <span className="text-xl font-black italic">{profile.following_count}</span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Following</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'Total XP', value: profile.xp.toLocaleString(), icon: <Flame size={14} className="text-orange-500" /> },
                        { label: 'Posts', value: activities.length, icon: <Share2 size={14} className="text-blue-500" /> },
                        { label: 'Level', value: profile.level, icon: <Trophy size={14} className="text-yellow-500" /> }
                    ].map((stat, i) => (
                        <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-3xl text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                {stat.icon}
                                <span className="text-xs font-black italic">{stat.value}</span>
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Feed Tab Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 italic">Athlete Activities</h3>
                    <div className="h-px flex-1 bg-zinc-900 mx-4" />
                </div>

                {/* Public Feed */}
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No activities recorded</p>
                        </div>
                    ) : (
                        activities.map(activity => (
                            <div key={activity.id} className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-3xl">
                                <div className="flex justify-between items-start mb-3">
                                    <h5 className="font-black text-xs text-white uppercase tracking-tight">{activity.content.title}</h5>
                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                        {new Date(activity.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 leading-relaxed mb-4">{activity.content.description}</p>
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-1.5 text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-red-500 transition-colors">
                                        <Heart size={14} /> {activity.likes || 0}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-blue-500 transition-colors ml-auto">
                                        <Share2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;
