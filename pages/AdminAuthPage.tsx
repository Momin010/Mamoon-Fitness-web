import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Loader2, AlertCircle } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { ForgeButton } from '../components';

const AdminAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signOut, user } = useSupabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Admin credentials (harden: moved to environment variables)
  const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL;
  const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD;
  const ADMIN_USERNAME = (import.meta as any).env?.VITE_ADMIN_USERNAME;

  // Sign out if a non-admin user is logged in
  useEffect(() => {
    if (user) {
      if (user.email === ADMIN_EMAIL) {
        // If already admin, go to dashboard
        navigate('/admin/dashboard');
      } else {
        // If not admin, sign out to allow admin login
        const signOutExistingUser = async () => {
          setIsSigningOut(true);
          try {
            await signOut();
          } catch (err) {
            console.error('Error signing out:', err);
          } finally {
            setIsSigningOut(false);
          }
        };
        signOutExistingUser();
      }
    }
  }, [user, signOut, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password, username });

    setError(null);

    // Validate credentials against hardcoded admin values
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD || username !== ADMIN_USERNAME) {
      const errorMsg = 'Invalid admin credentials. Access denied.';
      console.error(errorMsg, {
        expected: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, username: ADMIN_USERNAME },
        received: { email, password, username }
      });
      setError(errorMsg);
      return;
    }

    setIsLoading(true);
    try {
      // Sign in with Supabase
      console.log('Attempting to sign in with:', email);
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Sign in error:', error);
        setError(`Sign in failed: ${error.message}`);
        return;
      }

      // Navigate to admin panel on success
      console.log('Sign in successful, navigating to admin dashboard');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(`Login failed: ${err.message || 'Failed to sign in'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSigningOut) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-6">
        <Loader2 className="animate-spin text-green-500" size={48} />
        <p className="mt-4 text-zinc-400">Signing out...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <Shield size={40} className="text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Access</h1>
          <p className="text-zinc-400">Sign in to access the admin panel</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Username</label>
            <div className="relative">
              <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Enter admin username"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Email</label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Enter admin email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Password</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Enter admin password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <ForgeButton
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            leftIcon={<Shield size={18} />}
          >
            Sign In as Admin
          </ForgeButton>
        </form>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">
            🔒 This is a restricted area. All access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthPage;
