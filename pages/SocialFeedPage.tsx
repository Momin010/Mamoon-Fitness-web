import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
  MoreHorizontal,
  Dumbbell,
  Plus,
  Send,
  X,
  Target,
  Zap,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';
import { uploadFile } from '../lib/storage';

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
  likes: number;
  comments: number;
  created_at: string;
  is_liked_by_me: boolean;
}

const SocialFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSupabase();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'friends'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Posting state
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authUser) return;
    loadActivities();
  }, [authUser, activeTab, page]);

  const loadActivities = async () => {
    if (!authUser) return;

    setIsLoading(true);
    try {
      // Get following IDs if filtering by following
      let followingIds: string[] = [];
      if (activeTab === 'friends') {
        const { data: following } = await (supabase as any)
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', authUser.id);

        followingIds = following?.map((f: any) => f.following_id) || [];
      }

      // Fetch activities
      let activitiesQuery = (supabase as any)
        .from('social_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (activeTab === 'friends') {
        activitiesQuery = activitiesQuery.in('user_id', [authUser.id, ...followingIds]);
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery as { data: any[] | null, error: any };

      if (activitiesError) throw activitiesError;

      // Get unique user IDs from activities
      const userIds = [...new Set((activitiesData || []).map(a => a.user_id))];

      if (userIds.length === 0) {
        setActivities(prev => page === 1 ? [] : prev);
        setHasMore(false);
        return;
      }

      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds) as { data: any[] | null, error: any };

      if (profilesError) throw profilesError;

      // Create a map for quick profile lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Fetch likes counts for activities
      const activityIds = (activitiesData || []).map(a => a.id);

      let likesCountMap = new Map<string, number>();
      let userLikedSet = new Set<string>();

      if (activityIds.length > 0) {
        const { data: likesData, error: likesError } = await (supabase as any)
          .from('social_likes')
          .select('activity_id')
          .in('activity_id', activityIds) as { data: any[] | null, error: any };

        if (likesError) throw likesError;

        likesData?.forEach(like => {
          const count = likesCountMap.get(like.activity_id) || 0;
          likesCountMap.set(like.activity_id, count + 1);
        });

        // Check which activities are liked by current user
        const { data: userLikesData, error: userLikesError } = await (supabase as any)
          .from('social_likes')
          .select('activity_id')
          .eq('user_id', authUser.id)
          .in('activity_id', activityIds) as { data: any[] | null, error: any };

        if (userLikesError) throw userLikesError;
        userLikedSet = new Set(userLikesData?.map(l => l.activity_id) || []);
      }

      // Merge data in code
      const transformed: Activity[] = (activitiesData || []).map((a: any) => {
        const profile = profilesMap.get(a.user_id) as any;
        return {
          id: a.id,
          user_id: a.user_id,
          user_name: profile?.name || 'Unknown User',
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
      setHasMore(transformed.length === 20);
    } catch (err) {
      console.error('Error loading activities:', err);
      if (page === 1) setActivities([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!authUser || (!postContent.trim() && !postTitle.trim() && !selectedFile && !mediaUrl.trim())) return;

    setIsSubmitLoading(true);
    let finalMediaUrl = mediaUrl;

    try {
      if (selectedFile) {
        setIsUploading(true);
        finalMediaUrl = await uploadFile(selectedFile, 'social_media', authUser.id);
        setIsUploading(false);
      }

      const { error } = await (supabase as any)
        .from('social_activities')
        .insert({
          user_id: authUser.id,
          type: 'post',
          content: {
            title: postTitle || 'Update',
            description: postContent
          },
          media_url: finalMediaUrl || null,
          media_type: finalMediaUrl ? 'image' : null
        });

      if (error) throw error;

      // Reset and reload
      setPostTitle('');
      setPostContent('');
      setMediaUrl('');
      setSelectedFile(null);
      setIsPosting(false);
      setPage(1);
      loadActivities();
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Error sharing post. Check your connection.');
    } finally {
      setIsSubmitLoading(false);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMediaUrl(''); // Clear mediaUrl if a file is selected
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this directive?')) return;
    try {
      const { error } = await (supabase as any)
        .from('social_activities')
        .delete()
        .eq('id', id)
        .eq('user_id', authUser?.id);

      if (error) throw error;
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting post:', err);
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
        await (supabase as any)
          .from('social_likes')
          .insert({ activity_id: activityId, user_id: authUser.id });
      }

      // Update local state
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? { ...a, likes: a.likes + (isLiked ? -1 : 1), is_liked_by_me: !isLiked }
          : a
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'workout': return <Dumbbell size={20} className="text-green-500" />;
      case 'meal': return <Utensils size={20} className="text-orange-500" />;
      case 'task': return <CheckCircle2 size={20} className="text-blue-500" />;
      case 'achievement': return <Trophy size={20} className="text-yellow-500" />;
      case 'level_up': return <Flame size={20} className="text-purple-500" />;
      case 'post': return <Send size={20} className="text-zinc-400" />;
      case 'mentorship': return <Target size={20} className="text-red-500" />;
      default: return <Zap size={20} className="text-green-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'workout': return 'bg-green-500/10 border-green-500/30';
      case 'meal': return 'bg-orange-500/10 border-orange-500/30';
      case 'task': return 'bg-blue-500/10 border-blue-500/30';
      case 'achievement': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'level_up': return 'bg-purple-500/10 border-purple-500/30';
      case 'post': return 'bg-zinc-800/50 border-zinc-700/50';
      case 'mentorship': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-zinc-800';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative pb-32">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-lg z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Forge Feed</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 sticky top-[73px] bg-black/80 backdrop-blur-lg z-10">
        {[
          { id: 'all', label: 'Discover' },
          { id: 'friends', label: 'Following' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPage(1);
            }}
            className={`flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === tab.id
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-zinc-500 hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1">
        {isLoading && page === 1 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-500" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Share2 size={32} className="text-zinc-700" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">The Silence of the Forge</h3>
            <p className="text-zinc-500 text-xs mb-8 max-w-[240px] mx-auto uppercase tracking-widest leading-loose">
              {activeTab === 'friends'
                ? 'Follow more athletes to fill your feed with power.'
                : 'Be the first to ignite the discussion.'}
            </p>
            {activeTab === 'friends' && (
              <ForgeButton
                variant="secondary"
                onClick={() => navigate('/hub')}
              >
                Find Athletes
              </ForgeButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-950">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => navigate(`/profile/${activity.user_id}`)}
                    className="flex items-center gap-4 text-left"
                  >
                    {activity.user_avatar ? (
                      <img
                        src={activity.user_avatar}
                        alt={activity.user_name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-900"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        <span className="text-lg font-black text-green-500">
                          {activity.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm uppercase tracking-tight text-white truncate">{activity.user_name}</h4>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </button>
                  {authUser?.id === activity.user_id && (
                    <button
                      onClick={() => handleDeletePost(activity.id)}
                      className="p-2 text-zinc-800 hover:text-red-500 transition-colors ml-auto"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className={`p-6 rounded-3xl border ${getActivityColor(activity.type)} mb-4 shadow-sm`}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-black/20 rounded-xl">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-xs text-white uppercase tracking-[0.1em] mb-1">{activity.content.title}</h5>
                      <p className="text-sm text-zinc-400 font-medium leading-relaxed mb-4">{activity.content.description}</p>
                      {(activity as any).media_url && (
                        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                          <img src={(activity as any).media_url} className="w-full h-auto object-cover max-h-96" alt="Post media" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => handleLike(activity.id, activity.is_liked_by_me)}
                    className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${activity.is_liked_by_me ? 'text-red-500' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                  >
                    <Heart
                      size={18}
                      className={activity.is_liked_by_me ? 'fill-current' : ''}
                    />
                    <span>{activity.likes}</span>
                  </button>
                  <button className="flex items-center gap-2.5 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-blue-400 transition-all hover:scale-105">
                    <MessageCircle size={18} />
                    <span>{activity.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-zinc-600 hover:text-green-400 transition-all ml-auto hover:scale-105">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-12 text-center">
                <ForgeButton
                  variant="secondary"
                  onClick={() => setPage(p => p + 1)}
                  isLoading={isLoading}
                >
                  Load More
                </ForgeButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button - Fixed position within viewport */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-20">
        <button
          onClick={() => setIsPosting(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 text-black rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/20 hover:scale-110 active:scale-95 transition-all border-2 border-black"
        >
          <Plus size={24} className="sm:w-7 sm:h-7" strokeWidth={3} />
        </button>
      </div>

      {/* Create Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-sm bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Ignite Post</h2>
              <button
                onClick={() => setIsPosting(false)}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2.5 ml-1">Title</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Headline..."
                  className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500 transition-all font-bold placeholder:text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2.5 ml-1">Message</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-5 text-white focus:outline-none focus:border-green-500 transition-all font-medium placeholder:text-zinc-800 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2.5 ml-1">Media</label>
                <div className="flex gap-4">
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
                    className={`flex-1 flex items-center justify-center gap-2 p-5 bg-black border rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${selectedFile ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-white'}`}
                  >
                    {selectedFile ? <ImageIcon size={18} /> : <Camera size={18} />}
                    {selectedFile ? selectedFile.name : 'Select Intelligence'}
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {!selectedFile && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Or enter image URL..."
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500 transition-all font-bold placeholder:text-zinc-800"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <ForgeButton
                  variant="primary"
                  fullWidth
                  onClick={handleCreatePost}
                  isLoading={isSubmitLoading || isUploading}
                  disabled={(!postContent.trim() && !postTitle.trim() && !selectedFile && !mediaUrl.trim()) || isUploading}
                  leftIcon={<Send size={18} />}
                >
                  {isUploading ? 'Uploading Transmission...' : 'Post to Feed'}
                </ForgeButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeedPage;
