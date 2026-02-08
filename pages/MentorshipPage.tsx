import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Target,
    Star,
    Users,
    Search,
    Filter,
    ArrowRight,
    ShieldCheck,
    Zap,
    Loader2,
    Calendar,
    DollarSign,
    Plus,
    Edit3,
    Trash2,
    MessageSquare
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';

interface Mentorship {
    id: string;
    coach_id: string;
    title: string;
    description: string;
    price_monthly: number;
    features: string[];
    is_active: boolean;
    coach_name?: string;
    coach_avatar?: string;
}

const MentorshipPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: authUser } = useSupabase();

    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCoach, setIsCoach] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newFeatures, setNewFeatures] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authUser?.id) return;
        checkCoachStatus();
        loadMentorships();
    }, [authUser?.id]);

    const checkCoachStatus = async () => {
        if (!authUser?.id) return;
        try {
            const { data } = await supabase
                .from('coach_profiles')
                .select('id')
                .eq('user_id', authUser.id)
                .single() as { data: any, error: any };

            if (data) setIsCoach(true);
        } catch (err) {
            // Not a coach or error
        }
    };

    const loadMentorships = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coach_mentorships')
                .select(`
          *
        `)
                .eq('is_active', true) as { data: any[] | null, error: any };

            if (error) throw error;

            // Manually fetch coach profile names
            const coachIds = [...new Set((data || []).map(m => m.coach_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', coachIds) as { data: any[] | null, error: any };

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const transformed = (data || []).map(m => ({
                ...m,
                coach_name: profilesMap.get(m.coach_id)?.name || 'Elite Coach',
                coach_avatar: profilesMap.get(m.coach_id)?.avatar_url
            }));

            setMentorships(transformed);
        } catch (err) {
            console.error('Error loading mentorships:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMentorship = async () => {
        if (!authUser || !newTitle || !newDesc) return;

        setIsSubmitting(true);
        try {
            const featuresArray = newFeatures.split(',').map(f => f.trim()).filter(f => f !== '');

            const { error } = await supabase
                .from('coach_mentorships')
                .insert({
                    coach_id: authUser.id,
                    title: newTitle,
                    description: newDesc,
                    price_monthly: parseFloat(newPrice) || 0,
                    features: featuresArray,
                    is_active: true
                } as any);

            if (error) throw error;

            // Log activity
            await supabase.from('social_activities').insert({
                user_id: authUser.id,
                type: 'mentorship',
                content: {
                    title: `New Mentorship: ${newTitle}`,
                    description: `I just launched a new mentorship program: ${newDesc.substring(0, 100)}...`
                }
            } as any);

            setShowCreateModal(false);
            loadMentorships();
            // Reset form
            setNewTitle('');
            setNewDesc('');
            setNewPrice('');
            setNewFeatures('');

        } catch (err) {
            console.error('Error creating mentorship:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            {/* Header */}
            <div className="relative h-64 overflow-hidden border-b border-zinc-900">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-black z-0" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="mt-auto">
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Social Mentorship</h1>
                        <p className="text-zinc-400 max-w-md text-sm font-medium">Elevate your game with 1-on-1 coaching from world-class athletes and fitness experts.</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Actions Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-4">
                        <button className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-sm font-bold flex items-center gap-2 hover:border-green-500 transition-all">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                    {isCoach && (
                        <ForgeButton
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            leftIcon={<Plus size={18} />}
                        >
                            Post Program
                        </ForgeButton>
                    )}
                </div>

                {/* Mentorship Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-green-500" />
                        <p className="mt-4 text-zinc-500 font-medium tracking-widest uppercase text-xs">Fetching Programs...</p>
                    </div>
                ) : mentorships.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
                        <Target size={48} className="mx-auto text-zinc-700 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Active Programs</h3>
                        <p className="text-zinc-500 text-sm mb-6">Be the first coach to offer expert guidance.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {mentorships.map((program) => (
                            <div
                                key={program.id}
                                className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-green-500/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Target size={80} />
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    {program.coach_avatar ? (
                                        <img src={program.coach_avatar} alt="" className="w-10 h-10 rounded-full border border-zinc-700" />
                                    ) : (
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                                            <Star size={18} className="text-green-500" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-green-500">{program.coach_name}</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Certified Pro Coach</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-3 group-hover:text-green-500 transition-colors">{program.title}</h3>
                                <p className="text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed">{program.description}</p>

                                <div className="space-y-3 mb-6">
                                    {program.features.slice(0, 3).map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                                            <Zap size={14} className="text-green-500" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-zinc-800">
                                    <div>
                                        <span className="text-2xl font-black text-white">${program.price_monthly}</span>
                                        <span className="text-zinc-500 text-[10px] uppercase font-bold ml-1">/ month</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/messages/${program.coach_id}`)}
                                        className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-500 transition-all active:scale-95"
                                    >
                                        Contact <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">New Mentorship Program</h2>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Forging Next-Gen Athletes</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Program Title</label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="e.g. 8-Week Strength Master"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all placeholder:text-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Monthly Price ($)</label>
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="99.00"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all placeholder:text-zinc-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description</label>
                                <textarea
                                    rows={4}
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Describe your coaching philosophy and what's included..."
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all resize-none placeholder:text-zinc-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Key Features (comma separated)</label>
                                <input
                                    type="text"
                                    value={newFeatures}
                                    onChange={(e) => setNewFeatures(e.target.value)}
                                    placeholder="Custom Plans, 24/7 Chat, Weekly Calls"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all placeholder:text-zinc-800"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 bg-zinc-800 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateMentorship}
                                    disabled={isSubmitting || !newTitle || !newDesc}
                                    className="flex-1 py-4 bg-green-500 text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-green-400 disabled:opacity-50 transition-all shadow-lg shadow-green-500/20"
                                >
                                    {isSubmitting ? 'Launching...' : 'Launch Program'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const X: React.FC<{ size?: number }> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default MentorshipPage;
