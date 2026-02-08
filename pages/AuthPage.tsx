
import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Dumbbell, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { signIn, signUp, isConfigured } = useSupabase();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isConfigured) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white p-6 items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Dumbbell size={32} className="text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Cloud Sync Disabled</h1>
          <p className="text-zinc-400 mb-6">
            Supabase is not configured. Add your credentials to <code className="bg-zinc-900 px-2 py-1 rounded text-sm">.env.local</code> to enable cloud sync.
          </p>
          <div className="bg-zinc-900 p-4 rounded-lg text-left text-xs font-mono text-zinc-400">
            <p>VITE_SUPABASE_URL=your_url</p>
            <p>VITE_SUPABASE_ANON_KEY=your_key</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Failed to sign in');
      }
    } else {
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(error.message || 'Failed to sign up');
      } else {
        setMessage('Check your email to confirm your account!');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8">
          <Dumbbell size={40} className="text-green-500" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
          {isLogin ? 'Welcome Back' : 'Get Started'}
        </h1>
        <p className="text-zinc-400 mb-8">
          {isLogin ? 'Sign in to sync your progress' : 'Create an account to start tracking'}
        </p>

        {error && (
          <div className="w-full max-w-sm mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {message && (
          <div className="w-full max-w-sm mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-black py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setMessage('');
          }}
          className="mt-6 text-zinc-400 hover:text-white transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>

        <a
          href="/admin/coach-applications"
          className="mt-8 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          Staff / Coach Admin Portal
        </a>
      </div>
    </div>
  );
};

export default AuthPage;
