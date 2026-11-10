"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getAppUser, type AppUser } from "@/lib/identity";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInDemo: (name: AppUser["name"]) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const demoUserStorageKey = "our-space-temporary-demo-user";

function getAllowedUser(session: Session | null) {
  return getAppUser(session?.user.email);
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      const timer = window.setTimeout(() => {
        try {
          const demoName = window.localStorage.getItem(demoUserStorageKey);
          if (demoName === "Fernan" || demoName === "Alpha") {
            setUser({
              name: demoName,
              email: demoName === "Fernan" ? "amberbambico.54@gmail.com" : "alpha.v.sugano@gmail.com",
            });
          }
        } catch {
          setError("Temporary sign-in could not be loaded from browser storage.");
        }
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    const signOutUnrecognizedSession = async () => {
      try {
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError && active) setError(signOutError.message);
      } catch (signOutError) {
        if (active) {
          setError(signOutError instanceof Error ? signOutError.message : "Unable to clear an unrecognized sign-in session.");
        }
      }
    };

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const allowedUser = getAllowedUser(session);
      setUser(allowedUser);
      setLoading(false);
      if (session && !allowedUser) {
        window.setTimeout(() => void signOutUnrecognizedSession(), 0);
      }
    });

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      const allowedUser = getAllowedUser(data.session);
      setUser(allowedUser);
      setLoading(false);
      if (data.session && !allowedUser) {
        void signOutUnrecognizedSession();
      }
    }).catch((sessionError: unknown) => {
      if (!active) return;
      setError(sessionError instanceof Error ? sessionError.message : "Unable to load your sign-in session.");
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInDemo = (name: AppUser["name"]) => {
    if (hasSupabaseConfig) {
      setError("Temporary sign-in is only available before Supabase accounts are configured.");
      return;
    }

    const email = name === "Fernan" ? "amberbambico.54@gmail.com" : "alpha.v.sugano@gmail.com";
    try {
      window.localStorage.setItem(demoUserStorageKey, name);
      setUser({ name, email });
      setError(null);
    } catch {
      setError("Temporary sign-in could not be saved to browser storage.");
    }
  };

  const signOut = async () => {
    window.localStorage.removeItem(demoUserStorageKey);
    if (supabase) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured: hasSupabaseConfig, error, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
