import React, { createContext, useContext, useEffect, useState } from 'react';

interface LegalContextType {
  hasAcceptedLegal: boolean;
  acceptLegal: () => void;
  isLoading: boolean;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

export const LegalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load legal acceptance status from localStorage on mount
  useEffect(() => {
    const accepted = localStorage.getItem('legal_accepted') === 'true';
    setHasAcceptedLegal(accepted);
    setIsLoading(false);
  }, []);

  const acceptLegal = () => {
    localStorage.setItem('legal_accepted', 'true');
    setHasAcceptedLegal(true);
  };

  return (
    <LegalContext.Provider value={{ hasAcceptedLegal, acceptLegal, isLoading }}>
      {children}
    </LegalContext.Provider>
  );
};

export const useLegal = () => {
  const context = useContext(LegalContext);
  if (!context) {
    throw new Error('useLegal must be used within LegalProvider');
  }
  // Return default values during loading to prevent errors
  if (context.isLoading) {
    return { hasAcceptedLegal: false, acceptLegal: () => {}, isLoading: true };
  }
  return context;
};
