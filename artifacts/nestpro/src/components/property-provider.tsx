import React, { createContext, useContext, useState, useEffect } from "react";

type PropertyContextType = {
  activePropertyId: number | null;
  setActivePropertyId: (id: number | null) => void;
};

const PropertyContext = createContext<PropertyContextType>({
  activePropertyId: null,
  setActivePropertyId: () => {},
});

export const PropertyProvider = ({ children }: { children: React.ReactNode }) => {
  const [activePropertyId, setActivePropertyId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("nestpro_active_property");
    if (saved) {
      setActivePropertyId(Number(saved));
    }
  }, []);

  const handleSetActivePropertyId = (id: number | null) => {
    setActivePropertyId(id);
    if (id) {
      localStorage.setItem("nestpro_active_property", String(id));
    } else {
      localStorage.removeItem("nestpro_active_property");
    }
  };

  return (
    <PropertyContext.Provider value={{ activePropertyId, setActivePropertyId: handleSetActivePropertyId }}>
      {children}
    </PropertyContext.Provider>
  );
};

export const usePropertyContext = () => useContext(PropertyContext);
