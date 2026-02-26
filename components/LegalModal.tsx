import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LegalModalProps {
  onAccept: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ onAccept }) => {
  const [expandedSection, setExpandedSection] = useState<'privacy' | 'terms' | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const canAccept = acceptedPrivacy && acceptedTerms;

  const PrivacyContent = () => (
    <div className="text-sm text-gray-300 space-y-3 max-h-96 overflow-y-auto pr-2">
      <div>
        <h4 className="font-semibold text-white mb-1">Introduction</h4>
        <p>Forge Fitness & RPG is committed to protecting your privacy and personal data.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">Information We Collect</h4>
        <p>Personal information you provide: Name, email, profile data, health & fitness data, and social content. Automatically collected: Device information, usage data, location, and cookies.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">How We Use Your Information</h4>
        <p>We use your information to provide services, personalize your experience, improve our services, communicate with you, and for legal compliance.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">Data Security</h4>
        <p>We implement encryption, access controls, secure authentication, and regular security assessments. However, no method is 100% secure.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">Your Rights</h4>
        <p>You have rights to access, correct, delete, and restrict processing of your data. Contact privacy@forgefitness.app to exercise your rights.</p>
      </div>
      <div className="text-xs text-gray-400 border-t border-zinc-700 pt-2">
        Last Updated: February 24, 2026
      </div>
    </div>
  );

  const TermsContent = () => (
    <div className="text-sm text-gray-300 space-y-3 max-h-96 overflow-y-auto pr-2">
      <div>
        <h4 className="font-semibold text-white mb-1">Acceptance of Terms</h4>
        <p>By using Forge Fitness & RPG, you agree to be bound by these Terms and Conditions.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">Description of Service</h4>
        <p>The App provides workout tracking, meal logging, social networking, AI food recognition, mentorship programs, and gamification features.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">Eligibility</h4>
        <p>You must be at least 13 years of age. You represent that you have the legal capacity to enter into these Terms.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">User Accounts</h4>
        <p>You must provide accurate information and are responsible for maintaining account security. You are liable for all activities under your account.</p>
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">Disclaimer</h4>
        <p>The app is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages.</p>
      </div>
      <div className="text-xs text-gray-400 border-t border-zinc-700 pt-2">
        Last Updated: February 24, 2026
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg shadow-2xl max-w-md w-full border border-zinc-700 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4">
          <h2 className="text-xl font-bold text-white">Accept Terms</h2>
          <p className="text-sm text-gray-400 mt-1">Please review and accept our legal documents</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Privacy Policy Section */}
          <div className="border border-zinc-700 rounded-lg">
            <button
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
              className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
            >
              <span className="font-semibold text-white">Privacy Policy</span>
              {expandedSection === 'privacy' ? (
                <ChevronUp className="text-green-500" size={20} />
              ) : (
                <ChevronDown className="text-gray-400" size={20} />
              )}
            </button>
            {expandedSection === 'privacy' && (
              <div className="border-t border-zinc-700 p-3 bg-zinc-800/30">
                <PrivacyContent />
              </div>
            )}
            <div className="border-t border-zinc-700 p-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="privacy-accept"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="w-5 h-5 rounded bg-zinc-800 border border-zinc-600 cursor-pointer accent-green-500"
              />
              <label htmlFor="privacy-accept" className="text-sm text-gray-300 cursor-pointer flex-1">
                I accept the Privacy Policy
              </label>
            </div>
          </div>

          {/* Terms and Conditions Section */}
          <div className="border border-zinc-700 rounded-lg">
            <button
              onClick={() => setExpandedSection(expandedSection === 'terms' ? null : 'terms')}
              className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
            >
              <span className="font-semibold text-white">Terms & Conditions</span>
              {expandedSection === 'terms' ? (
                <ChevronUp className="text-green-500" size={20} />
              ) : (
                <ChevronDown className="text-gray-400" size={20} />
              )}
            </button>
            {expandedSection === 'terms' && (
              <div className="border-t border-zinc-700 p-3 bg-zinc-800/30">
                <TermsContent />
              </div>
            )}
            <div className="border-t border-zinc-700 p-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="terms-accept"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-5 h-5 rounded bg-zinc-800 border border-zinc-600 cursor-pointer accent-green-500"
              />
              <label htmlFor="terms-accept" className="text-sm text-gray-300 cursor-pointer flex-1">
                I accept the Terms & Conditions
              </label>
            </div>
          </div>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
              canAccept
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                : 'bg-zinc-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>

          <p className="text-xs text-gray-500 text-center">
            You must accept both documents to continue using Forge Fitness & RPG
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
