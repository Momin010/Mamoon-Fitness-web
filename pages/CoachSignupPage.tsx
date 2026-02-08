import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle,
  Star,
  Users,
  Trophy,
  Upload,
  Loader2,
  AlertCircle,
  Clock,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton, ForgeSlider } from '../components';

interface CoachApplication {
  bio: string;
  specialties: string[];
  experience: number;
  certifications: string[];
  socialLinks: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

const SPECIALTIES_OPTIONS = [
  'Strength Training',
  'Weight Loss',
  'Bodybuilding',
  'CrossFit',
  'Yoga',
  'Nutrition',
  'HIIT',
  'Powerlifting',
  'Calisthenics',
  'Running'
];

interface ExistingApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const CoachSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSupabase();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const [application, setApplication] = useState<CoachApplication>({
    bio: '',
    specialties: [],
    experience: 1,
    certifications: [],
    socialLinks: {}
  });

  const [newCertification, setNewCertification] = useState('');

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!authUser) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('coach_applications')
          .select('id, status, admin_notes, created_at, updated_at')
          .eq('user_id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which is fine
          console.error('Error checking existing application:', error);
        }

        if (data) {
          setExistingApp(data as ExistingApplication);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingApplication();
  }, [authUser]);

  const toggleSpecialty = (specialty: string) => {
    setApplication(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setApplication(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setApplication(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!authUser) {
      setError('You must be logged in to apply');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('coach_applications')
        .insert({
          user_id: authUser.id,
          bio: application.bio,
          specialties: application.specialties,
          experience_years: application.experience,
          certifications: application.certifications,
          social_links: application.socialLinks,
          status: 'pending'
        });

      if (submitError) throw submitError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return application.bio.length >= 50;
      case 2:
        return application.specialties.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Show loading state while checking for existing application
  if (isChecking) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-6">
        <Loader2 className="animate-spin text-green-500" size={48} />
        <p className="mt-4 text-zinc-400">Checking application status...</p>
      </div>
    );
  }

  // Show existing application status
  if (existingApp && !success) {
    const getStatusConfig = () => {
      switch (existingApp.status) {
        case 'approved':
          return {
            icon: <CheckCircle size={48} className="text-green-500" />,
            bgColor: 'bg-green-500/20',
            title: 'Application Approved!',
            message: 'Congratulations! Your coach application has been approved. You can now access your coach dashboard.',
            showCoachLink: true
          };
        case 'rejected':
          return {
            icon: <XCircle size={48} className="text-red-500" />,
            bgColor: 'bg-red-500/20',
            title: 'Application Not Approved',
            message: 'Unfortunately, your coach application was not approved at this time.',
            showCoachLink: false
          };
        default:
          return {
            icon: <Clock size={48} className="text-yellow-500" />,
            bgColor: 'bg-yellow-500/20',
            title: 'Application Under Review',
            message: 'Your coach application is currently being reviewed. We\'ll notify you once a decision has been made.',
            showCoachLink: false
          };
      }
    };

    const config = getStatusConfig();

    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className={`w-24 h-24 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold mb-4">{config.title}</h1>
          <p className="text-zinc-400 mb-6">
            {config.message}
          </p>

          {/* Admin Notes */}
          {existingApp.admin_notes && (
            <div className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <MessageSquare size={16} />
                <span className="text-sm font-medium">Reviewer Notes</span>
              </div>
              <p className="text-zinc-300 text-sm text-left">{existingApp.admin_notes}</p>
            </div>
          )}

          {/* Application Details */}
          <div className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-500 text-sm">Submitted</span>
              <span className="text-zinc-300 text-sm">
                {new Date(existingApp.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-sm">Last Updated</span>
              <span className="text-zinc-300 text-sm">
                {new Date(existingApp.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {config.showCoachLink && (
              <ForgeButton
                variant="primary"
                fullWidth
                onClick={() => navigate('/coach')}
              >
                Go to Coach Dashboard
              </ForgeButton>
            )}
            <ForgeButton
              variant="secondary"
              fullWidth
              onClick={() => navigate('/settings')}
            >
              Back to Settings
            </ForgeButton>
          </div>
        </div>
      </div>
    );
  }

  // Show success after submission
  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
          <p className="text-zinc-400 mb-8">
            Thank you for your interest in becoming a Forge Fitness coach.
            We'll review your application and get back to you within 3-5 business days.
          </p>
          <ForgeButton
            variant="primary"
            fullWidth
            onClick={() => navigate('/settings')}
          >
            Back to Settings
          </ForgeButton>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Become a Coach</h1>
          <p className="text-xs text-zinc-500">Step {step} of 3</p>
        </div>
      </header>

      {/* Progress */}
      <div className="flex gap-1 p-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full transition-colors ${
              s <= step ? 'bg-green-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-zinc-400 text-sm">
                Share your fitness journey and what makes you unique
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Bio <span className="text-zinc-600">({application.bio.length}/500)</span>
              </label>
              <textarea
                value={application.bio}
                onChange={(e) => setApplication(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about your fitness philosophy, experience, and what motivates you..."
                maxLength={500}
                rows={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Minimum 50 characters required
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your Specialties</h2>
              <p className="text-zinc-400 text-sm">
                Select the areas you specialize in
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES_OPTIONS.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => toggleSpecialty(specialty)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    application.specialties.includes(specialty)
                      ? 'border-green-500 bg-green-500/10 text-green-500'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      application.specialties.includes(specialty)
                        ? 'border-green-500 bg-green-500'
                        : 'border-zinc-600'
                    }`}>
                      {application.specialties.includes(specialty) && (
                        <CheckCircle size={12} className="text-black" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{specialty}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500 text-center">
              Select at least one specialty
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-purple-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Experience & Credentials</h2>
              <p className="text-zinc-400 text-sm">
                Help us understand your background
              </p>
            </div>

            {/* Experience Slider */}
            <ForgeSlider
              label="Years of Experience"
              value={application.experience}
              onChange={(value) => setApplication(prev => ({ ...prev, experience: value }))}
              min={0}
              max={30}
              step={1}
              color="purple"
            />

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">
                Certifications
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                  placeholder="e.g., NASM-CPT"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
                />
                <ForgeButton
                  variant="secondary"
                  onClick={addCertification}
                  disabled={!newCertification.trim()}
                >
                  Add
                </ForgeButton>
              </div>
              
              {application.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {application.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300"
                    >
                      {cert}
                      <button
                        onClick={() => removeCertification(index)}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-400">
                Social Links (Optional)
              </label>
              <input
                type="text"
                value={application.socialLinks.instagram || ''}
                onChange={(e) => setApplication(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                }))}
                placeholder="Instagram URL"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
              />
              <input
                type="text"
                value={application.socialLinks.youtube || ''}
                onChange={(e) => setApplication(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                }))}
                placeholder="YouTube URL"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-800">
        <div className="flex gap-3">
          {step > 1 && (
            <ForgeButton
              variant="secondary"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </ForgeButton>
          )}
          {step < 3 ? (
            <ForgeButton
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continue
            </ForgeButton>
          ) : (
            <ForgeButton
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Submit Application
            </ForgeButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachSignupPage;
