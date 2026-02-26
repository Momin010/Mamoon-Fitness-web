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

  return (
    <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 overflow-hidden">
      <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
        <h2 className="text-lg font-bold text-white">Accept Terms</h2>
        <p className="text-xs text-gray-400 mt-0.5">Please review and accept to continue</p>
      </div>

      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {/* Privacy Policy Section */}
        <div className="border border-zinc-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
            className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-white text-sm">Privacy Policy</span>
            {expandedSection === 'privacy' ? (
              <ChevronUp className="text-green-500" size={16} />
            ) : (
              <ChevronDown className="text-gray-400" size={16} />
            )}
          </button>
          {expandedSection === 'privacy' && (
            <div className="border-t border-zinc-700 p-2.5 bg-zinc-800/30 text-xs text-gray-300">
              <p>We collect name, email, profile data, health & fitness data, and device information. Your data is encrypted and secured. You can request deletion anytime.</p>
            </div>
          )}
          <div className="border-t border-zinc-700 p-2.5 flex items-center gap-2">
            <input
              type="checkbox"
              id="privacy-accept"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-800 border border-zinc-600 cursor-pointer accent-green-500"
            />
            <label htmlFor="privacy-accept" className="text-xs text-gray-300 cursor-pointer">
              I accept the Privacy Policy
            </label>
          </div>
        </div>

        {/* Terms and Conditions Section */}
        <div className="border border-zinc-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'terms' ? null : 'terms')}
            className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-white text-sm">Terms & Conditions</span>
            {expandedSection === 'terms' ? (
              <ChevronUp className="text-green-500" size={16} />
            ) : (
              <ChevronDown className="text-gray-400" size={16} />
            )}
          </button>
          {expandedSection === 'terms' && (
            <div className="border-t border-zinc-700 p-2.5 bg-zinc-800/30 text-xs text-gray-300">
              <p>You must be 13+. The app is provided "as is". You are responsible for your account security.</p>
            </div>
          )}
          <div className="border-t border-zinc-700 p-2.5 flex items-center gap-2">
            <input
              type="checkbox"
              id="terms-accept"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-800 border border-zinc-600 cursor-pointer accent-green-500"
            />
            <label htmlFor="terms-accept" className="text-xs text-gray-300 cursor-pointer">
              I accept the Terms & Conditions
            </label>
          </div>
        </div>
      </div>

      {/* Accept Button */}
      <div className="p-4 pt-0">
        <button
          onClick={onAccept}
          disabled={!canAccept}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
            canAccept
              ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              : 'bg-zinc-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LegalModal;
