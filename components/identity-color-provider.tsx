"use client";

import { createContext, useContext, useEffect } from "react";

import { useLocalStorageJson } from "@/lib/use-local-storage-json";

export type IdentityColorPreferences = {
  fernanIdentity: string;
  alphaIdentity: string;
};

const storageKey = "our-space-color-preferences";

export const defaultIdentityColors: IdentityColorPreferences = {
  fernanIdentity: "#5F8F6B",
  alphaIdentity: "#8B6AA8",
};

const colorKeys = ["fernanIdentity", "alphaIdentity"] as const;

function parsePreferences(value: unknown): IdentityColorPreferences {
  if (typeof value !== "object" || value === null) {
    throw new Error("Saved color preferences must be an object.");
  }

  const preferences = value as Record<string, unknown>;
  const parsed = { ...defaultIdentityColors };
  for (const key of colorKeys) {
    const color = preferences[key];
    if (color === undefined) continue;
    if (typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color)) {
      throw new Error("Saved color preferences contain an invalid color.");
    }
    parsed[key] = color;
  }
  return parsed;
}

type IdentityColorContextValue = {
  preferences: IdentityColorPreferences;
  setPreference: (key: keyof IdentityColorPreferences, color: string) => void;
  resetPreferences: () => void;
};

const IdentityColorContext = createContext<IdentityColorContextValue | null>(null);

export function IdentityColorProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [preferences, setPreferences] = useLocalStorageJson(storageKey, defaultIdentityColors, parsePreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--author-fernan-color", preferences.fernanIdentity);
    root.style.setProperty("--author-alpha-color", preferences.alphaIdentity);
  }, [preferences]);

  const setPreference = (key: keyof IdentityColorPreferences, color: string) => {
    setPreferences((current) => ({ ...current, [key]: color }));
  };

  const resetPreferences = () => setPreferences(defaultIdentityColors);

  return (
    <IdentityColorContext.Provider value={{ preferences, setPreference, resetPreferences }}>
      {children}
    </IdentityColorContext.Provider>
  );
}

export function useIdentityColors() {
  const context = useContext(IdentityColorContext);
  if (!context) throw new Error("useIdentityColors must be used within IdentityColorProvider.");
  return context;
}
