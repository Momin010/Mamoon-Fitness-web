import React from 'react';
import { X } from 'lucide-react';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

/**
 * Phone-container-safe modal that stays within the app boundaries
 * Replaces broken `fixed inset-0` patterns that escape the phone container
 */
export const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      
      {/* Modal content - constrained to phone container */}
      <div className={`relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl ${className}`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

/**
 * Full-screen modal within phone container for immersive experiences
 * Used for workout sessions, camera views, etc.
 */
export const FullScreenModal: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      
      {/* Full screen content */}
      <div className={`relative flex-1 flex flex-col ${className}`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-zinc-900 rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default ModalContainer;