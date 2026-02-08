import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';

export interface Friend {
  id: string;
  friend_id: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  tier: string;
  last_active?: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_level: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export const useFriends = () => {
  const { user: authUser } = useSupabase();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const calculateTier = (level: number): string => {
    if (level >= 80) return 'LEGENDARY';
    if (level >= 60) return 'ELITE';
    if (level >= 40) return 'MASTER';
    if (level >= 20) return 'VETERAN';
    return 'NOVICE';
  };

  const loadFriends = useCallback(async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_connections')
        .select(`
          id,
          friend:friend_id(id, name, avatar_url, level, xp),
          created_at
        `)
        .eq('user_id', authUser.id);

      if (error) throw error;

      const transformed: Friend[] = (data || []).map((f: any) => ({
        id: f.id,
        friend_id: f.friend.id,
        name: f.friend.name,
        avatar: f.friend.avatar_url,
        level: f.friend.level,
        xp: f.friend.xp,
        tier: calculateTier(f.friend.level),
        last_active: f.created_at
      }));

      setFriends(transformed);
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  const loadRequests = useCallback(async () => {
    if (!authUser) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender:sender_id(id, name, avatar_url, level),
          status,
          created_at
        `)
        .eq('receiver_id', authUser.id)
        .eq('status', 'pending');

      if (error) throw error;

      const transformed: FriendRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        sender_id: r.sender.id,
        sender_name: r.sender.name,
        sender_avatar: r.sender.avatar_url,
        sender_level: r.sender.level,
        status: r.status,
        created_at: r.created_at
      }));

      setRequests(transformed);
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  }, [authUser]);

  const sendRequest = useCallback(async (userId: string) => {
    if (!authUser) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: authUser.id,
          receiver_id: userId,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error sending request:', err);
      return false;
    }
  }, [authUser]);

  const handleRequest = useCallback(async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      if (accept) {
        await loadFriends();
      }
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
      return true;
    } catch (err) {
      console.error('Error handling request:', err);
      return false;
    }
  }, [loadFriends]);

  const removeFriend = useCallback(async (friendConnectionId: string) => {
    try {
      const { error } = await supabase
        .from('friend_connections')
        .delete()
        .eq('id', friendConnectionId);

      if (error) throw error;
      
      setFriends(prev => prev.filter(f => f.id !== friendConnectionId));
      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      return false;
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!authUser || !query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, level, xp')
        .ilike('name', `%${query}%`)
        .neq('id', authUser.id)
        .limit(10);

      if (error) throw error;

      // Filter out existing friends
      const friendIds = new Set(friends.map(f => f.friend_id));
      return (data || []).filter((u: any) => !friendIds.has(u.id));
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, [authUser, friends]);

  useEffect(() => {
    if (authUser) {
      loadFriends();
      loadRequests();
    }
  }, [authUser, loadFriends, loadRequests]);

  return {
    friends,
    requests,
    isLoading,
    loadFriends,
    loadRequests,
    sendRequest,
    handleRequest,
    removeFriend,
    searchUsers
  };
};

export default useFriends;
