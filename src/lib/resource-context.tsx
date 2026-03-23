import React, { createContext, useContext, useState, useCallback } from 'react';

interface ResourceContextType {
  savedIds: Set<string>;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const ResourceContext = createContext<ResourceContextType | null>(null);

export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  return (
    <ResourceContext.Provider value={{ savedIds, toggleSave, isSaved }}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => {
  const ctx = useContext(ResourceContext);
  if (!ctx) throw new Error('useResources must be used within ResourceProvider');
  return ctx;
};
