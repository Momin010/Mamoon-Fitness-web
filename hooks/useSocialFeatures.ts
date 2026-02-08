import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';

export interface SocialActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  type: 'workout' | 'meal' | 'task' | 'achievement' | 'level_up';
  content: {
    title: string;
    description: string;
    metadata?: Record<string, any>;
  };
  likes: number;
  comments: number;
  created_at: string;
  is_liked_by_me: boolean;
}

export const useSocialFeatures = () => {
  const { user: authUser } = useSupabase();
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadActivities = useCallback(async (page: number = 1, friendsOnly: boolean = true) => {
    if (!authUser) return;

    setIsLoading(true);
    try {
      // Get friend IDs if filtering by friends
      let friendIds: string[] = [];
      if (friendsOnly) {
        const { data: friends } = await supabase
          .from('friend_connections')
          .select('friend_id')
          .eq('user_id', authUser.id);

        friendIds = friends?.map(f => f.friend_id) || [];
      }

      // Fetch activities without implicit joins
      let activitiesQuery = supabase
        .from('social_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (friendsOnly) {
        activitiesQuery = activitiesQuery.in('user_id', [authUser.id, ...friendIds]);
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery;

      if (activitiesError) throw activitiesError;

      // Get unique user IDs from activities
      const userIds = [...new Set((activitiesData || []).map(a => a.user_id))];

      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map for quick profile lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Fetch likes counts for activities
      const activityIds = (activitiesData || []).map(a => a.id);
      const { data: likesData, error: likesError } = await supabase
        .from('social_likes')
        .select('activity_id')
        .in('activity_id', activityIds);

      if (likesError) throw likesError;

      // Count likes per activity
      const likesCountMap = new Map<string, number>();
      likesData?.forEach(like => {
        const count = likesCountMap.get(like.activity_id) || 0;
        likesCountMap.set(like.activity_id, count + 1);
      });

      // Check which activities are liked by current user
      const { data: userLikesData, error: userLikesError } = await supabase
        .from('social_likes')
        .select('activity_id')
        .eq('user_id', authUser.id)
        .in('activity_id', activityIds);

      if (userLikesError) throw userLikesError;

      const userLikedSet = new Set(userLikesData?.map(l => l.activity_id) || []);

      // Merge data in code
      const transformed: SocialActivity[] = (activitiesData || []).map((a: any) => {
        const profile = profilesMap.get(a.user_id);
        return {
          id: a.id,
          user_id: a.user_id,
          user_name: profile?.name || 'Unknown',
          user_avatar: profile?.avatar_url,
          type: a.type,
          content: a.content,
          likes: likesCountMap.get(a.id) || 0,
          comments: a.comments || 0,
          created_at: a.created_at,
          is_liked_by_me: userLikedSet.has(a.id)
        };
      });

      setActivities(prev => page === 1 ? transformed : [...prev, ...transformed]);
      return transformed.length === 20;
    } catch (err) {
      console.error('Error loading activities:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  const likeActivity = useCallback(async (activityId: string, isLiked: boolean) => {
    if (!authUser) return;

    try {
      if (isLiked) {
        await supabase
          .from('social_likes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', authUser.id);
      } else {
        await supabase
          .from('social_likes')
          .insert({ activity_id: activityId, user_id: authUser.id });
      }

      setActivities(prev => prev.map(a => 
        a.id === activityId 
          ? { ...a, likes: a.likes + (isLiked ? -1 : 1), is_liked_by_me: !isLiked }
          : a
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [authUser]);

  const createActivity = useCallback(async (
    type: SocialActivity['type'],
    content: SocialActivity['content']
  ) => {
    if (!authUser) return;

    try {
      const { error } = await supabase
        .from('social_activities')
        .insert({
          user_id: authUser.id,
          type,
          content,
          metadata: {}
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error creating activity:', err);
    }
  }, [authUser]);

  return {
    activities,
    isLoading,
    loadActivities,
    likeActivity,
    createActivity
  };
};

export default useSocialFeatures;
