import React, { createContext, useContext, useEffect, useState } from 'react';

interface LegalContextType {
  hasAcceptedLegal: boolean;
  acceptLegal: () => void;
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

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <LegalContext.Provider value={{ hasAcceptedLegal, acceptLegal }}>
      {children}
    </LegalContext.Provider>
  );
};

export const useLegal = () => {
  const context = useContext(LegalContext);
  if (!context) {
    throw new Error('useLegal must be used within LegalProvider');
  }
  return context;
};
