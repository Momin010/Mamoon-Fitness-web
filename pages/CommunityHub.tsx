import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Zap, ArrowRight, Users, Trophy, Share2, MessageSquare } from 'lucide-react';
import { ForgeButton } from '../components';

const CommunityHub: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-black text-white p-6 pb-32">
            <header className="mb-8 pt-8 px-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Forge <span className="text-green-500">Hub</span></h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] bg-zinc-900 w-fit px-2 py-1 rounded-md">Connect & Grow</p>
            </header>

            <div className="space-y-6">
                {/* Social Feed Card */}
                <div
                    onClick={() => navigate('/social')}
                    className="group relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 cursor-pointer hover:border-green-500 transition-all overflow-hidden"
                >
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 blur-3xl group-hover:bg-green-500/20 transition-all" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center mb-8 border border-green-500/20 shadow-lg shadow-green-500/5">
                            <Share2 size={28} />
                        </div>

                        <h2 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-green-500 transition-colors">Social Feed</h2>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed max-w-[240px]">
                            Share your progress and get inspired by the community.
                        </p>

                        <div className="flex items-center gap-2 text-green-500 font-black uppercase tracking-widest text-[10px]">
                            Open Feed <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Human Mentorship Card */}
                <div
                    onClick={() => navigate('/mentorship')}
                    className="group relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 cursor-pointer hover:border-blue-500 transition-all overflow-hidden"
                >
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Users size={28} />
                        </div>

                        <h2 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-blue-500 transition-colors">Expert Mentors</h2>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed max-w-[240px]">
                            Elite human athletes. Custom coaching & 1-on-1 focus.
                        </p>

                        <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-[10px]">
                            Discover Pro Coaches <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                        onClick={() => navigate('/leaderboard')}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-600 transition-all group"
                    >
                        <Trophy size={24} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Rankings</span>
                    </button>
                    <button
                        onClick={() => navigate('/messages')}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-600 transition-all group"
                    >
                        <MessageSquare size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Messages</span>
                    </button>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="mt-auto pt-10 pb-4 text-center opacity-40">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Pure Performance. No AI.</p>
            </div>
        </div>
    );
};

export default CommunityHub;
