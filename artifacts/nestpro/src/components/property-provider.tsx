import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PropertyContextValue {
  activeProperty: any | null;
  setActiveProperty: (p: any) => void;
  properties: any[];
  isLoading: boolean;
}

const PropertyContext = createContext<PropertyContextValue>({
  activeProperty: null,
  setActiveProperty: () => {},
  properties: [],
  isLoading: false,
});

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  });

  const [activeProperty, setActivePropertyState] = useState<any | null>(null);

  useEffect(() => {
    if (properties.length === 0) return;
    const stored = localStorage.getItem('nestpro_active_property');
    const found = stored ? properties.find((p: any) => p.id === parseInt(stored)) : null;
    setActivePropertyState(found ?? properties[0]);
  }, [properties]);

  const setActiveProperty = (p: any) => {
    setActivePropertyState(p);
    localStorage.setItem('nestpro_active_property', String(p.id));
  };

  return (
    <PropertyContext.Provider value={{ activeProperty, setActiveProperty, properties, isLoading }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function usePropertyContext() {
  return useContext(PropertyContext);
}
