import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  UserPlus,
  UserMinus,
  Check,
  X,
  User,
  MoreHorizontal,
  MessageCircle,
  Trophy,
  Clock,
  Loader2,
  Users,
  Compass,
  Star
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';

interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  level: number;
  xp: number;
  is_following?: boolean;
}

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSupabase();

  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser?.id) return;
    loadUsers();
  }, [authUser?.id, activeTab]);

  const loadUsers = async () => {
    if (!authUser?.id) return;
    setIsLoading(true);
    try {
      if (activeTab === 'discover') {
        // Fetch all public profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, level, xp')
          .neq('id', authUser.id)
          .limit(50) as { data: any[] | null, error: any };

        if (profilesError) throw profilesError;

        // Check which ones we're following
        const { data: following, error: followingError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

        if (followingError) throw followingError;
        const followingIds = new Set(following?.map(f => f.following_id) || []);

        setUsers((profiles || []).map(p => ({
          ...p,
          is_following: followingIds.has(p.id)
        })));

      } else if (activeTab === 'following') {
        const { data: followingData, error: followError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

        if (followError) throw followError;

        const followingIds = followingData?.map(f => f.following_id) || [];

        if (followingIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, level, xp')
            .in('id', followingIds) as { data: any[] | null, error: any };

          setUsers((profiles || []).map(p => ({ ...p, is_following: true })));
        } else {
          setUsers([]);
        }

      } else if (activeTab === 'followers') {
        const { data: followerData, error: followError } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', authUser.id) as { data: any[] | null, error: any };

        if (followError) throw followError;

        const followerIds = followerData?.map(f => f.follower_id) || [];

        if (followerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, level, xp')
            .in('id', followerIds) as { data: any[] | null, error: any };

          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

          const followingIds = new Set(following?.map(f => f.following_id) || []);

          setUsers((profiles || []).map(p => ({
            ...p,
            is_following: followingIds.has(p.id)
          })));
        } else {
          setUsers([]);
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !authUser?.id) return;

    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, level, xp')
        .ilike('name', `%${searchQuery}%`)
        .neq('id', authUser.id)
        .limit(20) as { data: any[] | null, error: any };

      if (error) throw error;

      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

      const followingIds = new Set(following?.map(f => f.following_id) || []);

      setUsers((profiles || []).map(p => ({
        ...p,
        is_following: followingIds.has(p.id)
      })));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!authUser?.id) return;

    setIsActionLoading(targetUserId);
    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', authUser.id)
          .eq('following_id', targetUserId);
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: authUser.id,
            following_id: targetUserId
          } as any);
      }

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === targetUserId
          ? { ...u, is_following: !isCurrentlyFollowing }
          : u
      ));

      // If we are on 'following' tab and unfollowed, remove from list
      if (activeTab === 'following' && isCurrentlyFollowing) {
        setUsers(prev => prev.filter(u => u.id !== targetUserId));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-lg z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Community</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 sticky top-[73px] bg-black/80 backdrop-blur-lg z-10">
        {[
          { id: 'discover', label: 'Discover', icon: Compass },
          { id: 'following', label: 'Following', icon: Star },
          { id: 'followers', label: 'Followers', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
              ? 'text-green-500 border-b-2 border-green-500 bg-green-500/5'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search - Only show in Discover */}
      {activeTab === 'discover' && (
        <div className="p-6 pb-0">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search athletes and creators..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:bg-zinc-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); loadUsers(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-green-500" />
            <p className="mt-4 text-zinc-500 font-medium">Scanning network...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/50 rounded-3xl border border-zinc-900">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No users found</h3>
            <p className="text-zinc-500 text-sm px-10">Start discovery to connect with creators and friends.</p>
            {activeTab !== 'discover' && (
              <button
                onClick={() => setActiveTab('discover')}
                className="mt-6 text-green-500 font-bold uppercase text-xs tracking-widest hover:underline"
              >
                Go to Discover
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all group"
              >
                {/* Profile Link Area */}
                <button
                  onClick={() => navigate(`/profile/${profile.id}`)}
                  className="flex flex-1 items-center gap-4 text-left"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-zinc-900 group-hover:ring-green-500/20 transition-all"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center ring-2 ring-zinc-900 group-hover:ring-green-500/20 transition-all">
                        <User size={28} className="text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-black border border-zinc-800 text-green-500">
                      {profile.level}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate text-lg tracking-tight">{profile.name}</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      {profile.xp.toLocaleString()} XP • Athlete
                    </p>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/messages/${profile.id}`)}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-green-500 transition-all active:scale-95"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <ForgeButton
                    variant={profile.is_following ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => toggleFollow(profile.id, !!profile.is_following)}
                    isLoading={isActionLoading === profile.id}
                    leftIcon={profile.is_following ? <UserMinus size={16} /> : <UserPlus size={16} />}
                  >
                    {profile.is_following ? "Unfollow" : "Follow"}
                  </ForgeButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
