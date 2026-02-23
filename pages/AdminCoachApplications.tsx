import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Award,
  Briefcase,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';
import { ForgeButton } from '../components';

interface CoachApplication {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  certifications: string[];
  social_links: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url: string | null;
    level: number;
  };
}

const AdminCoachApplications: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSupabase();

  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<CoachApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL;

  // Load applications on mount (admin check is now done in AdminAuthPage)
  useEffect(() => {
    if (authUser && authUser.email !== ADMIN_EMAIL) {
      navigate('/admin/coach-applications');
      return;
    }
    loadApplications();
  }, [filter, authUser, navigate]);

  const loadApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('coach_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: appsData, error: appsError } = await query as { data: any[] | null, error: any };

      if (appsError) throw appsError;

      // Get user details for each application
      const userIds = appsData?.map(app => app.user_id) || [];

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url, level')
          .in('id', userIds) as { data: any[] | null, error: any };

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        const transformed: CoachApplication[] = (appsData || []).map((app: any) => ({
          ...app,
          user: profilesMap.get(app.user_id)
        }));

        setApplications(transformed);
      } else {
        setApplications(appsData || []);
      }
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    setProcessingId(appId);
    try {
      const { error } = await (supabase as any)
        .from('coach_applications')
        .update({
          status: 'approved',
          admin_notes: adminNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId);

      if (error) throw error;

      // Refresh the list
      await loadApplications();
      setSelectedApp(null);
      setAdminNote('');
    } catch (err: any) {
      console.error('Error approving application:', err);
      setError(err.message || 'Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    setProcessingId(appId);
    try {
      const { error } = await (supabase as any)
        .from('coach_applications')
        .update({
          status: 'rejected',
          admin_notes: adminNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId);

      if (error) throw error;

      // Refresh the list
      await loadApplications();
      setSelectedApp(null);
      setAdminNote('');
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      setError(err.message || 'Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-yellow-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 border-b border-zinc-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Coach Applications</h1>
          <p className="text-xs text-zinc-500">Review and manage coach applications</p>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                ? 'bg-green-500 text-black'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-2 text-xs opacity-70">
                  ({applications.filter(a => a.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/30 flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-green-500" size={32} />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-zinc-600" />
            </div>
            <p className="text-zinc-500">No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedApp(app);
                  setAdminNote(app.admin_notes || '');
                }}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                    {app.user?.avatar_url ? (
                      <img
                        src={app.user.avatar_url}
                        alt={app.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-zinc-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {app.user?.name || 'Unknown User'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-2">
                      {app.user?.email || 'No email'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {app.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400"
                        >
                          {specialty}
                        </span>
                      ))}
                      {app.specialties.length > 3 && (
                        <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                          +{app.specialties.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} />
                        {app.experience_years} years
                      </span>
                      <span className="flex items-center gap-1">
                        <Award size={12} />
                        {app.certifications.length} certs
                      </span>
                      <span>
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(app.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Application Details</h2>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setAdminNote('');
                }}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                  {selectedApp.user?.avatar_url ? (
                    <img
                      src={selectedApp.user.avatar_url}
                      alt={selectedApp.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-zinc-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedApp.user?.name}</h3>
                  <p className="text-zinc-500">{selectedApp.user?.email}</p>
                  <p className="text-sm text-zinc-400">Level {selectedApp.user?.level || 1}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <User size={16} />
                  Bio
                </h4>
                <p className="text-zinc-400 text-sm bg-zinc-950 p-3 rounded-lg">
                  {selectedApp.bio}
                </p>
              </div>

              {/* Specialties */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Award size={16} />
                  Specialties
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Briefcase size={16} />
                  Experience
                </h4>
                <p className="text-zinc-400">{selectedApp.experience_years} years</p>
              </div>

              {/* Certifications */}
              {selectedApp.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award size={16} />
                    Certifications
                  </h4>
                  <ul className="space-y-1">
                    {selectedApp.certifications.map((cert, idx) => (
                      <li key={idx} className="text-zinc-400 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Social Links */}
              {Object.keys(selectedApp.social_links || {}).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ExternalLink size={16} />
                    Social Links
                  </h4>
                  <div className="space-y-2">
                    {selectedApp.social_links.instagram && (
                      <a
                        href={selectedApp.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm flex items-center gap-2 hover:underline"
                      >
                        <ExternalLink size={14} />
                        Instagram
                      </a>
                    )}
                    {selectedApp.social_links.youtube && (
                      <a
                        href={selectedApp.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm flex items-center gap-2 hover:underline"
                      >
                        <ExternalLink size={14} />
                        YouTube
                      </a>
                    )}
                    {selectedApp.social_links.website && (
                      <a
                        href={selectedApp.social_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm flex items-center gap-2 hover:underline"
                      >
                        <ExternalLink size={14} />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Admin Notes
                </h4>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors resize-none text-sm"
                />
              </div>

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                  <ForgeButton
                    variant="secondary"
                    fullWidth
                    onClick={() => handleReject(selectedApp.id)}
                    disabled={processingId === selectedApp.id}
                  >
                    {processingId === selectedApp.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <XCircle size={18} className="mr-2" />
                        Reject
                      </>
                    )}
                  </ForgeButton>
                  <ForgeButton
                    variant="primary"
                    fullWidth
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={processingId === selectedApp.id}
                  >
                    {processingId === selectedApp.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Approve
                      </>
                    )}
                  </ForgeButton>
                </div>
              )}

              {selectedApp.status !== 'pending' && (
                <div className="pt-4 border-t border-zinc-800">
                  <p className="text-center text-zinc-500 text-sm">
                    This application has been {selectedApp.status}
                    {selectedApp.admin_notes && (
                      <span className="block mt-2 text-zinc-400">
                        Note: {selectedApp.admin_notes}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoachApplications;
