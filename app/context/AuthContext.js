"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isPremiumInternal, setIsPremiumInternal] = useState(false);
  const [isCheckingPro, setIsCheckingPro] = useState(true);
  const lastCheckedUser = useRef(null);
  const supabase = createClient();

  const setIsPremium = (newValue) => {
    console.trace('isPro changed to:', newValue);
    setIsPremiumInternal(newValue);
  };

  const checkProStatus = async (user) => {
    if (!user) {
      setIsCheckingPro(false);
      return;
    }
    // Prevent duplicate fetches if the user ID hasn't changed and we already checked
    if (lastCheckedUser.current === user.id) return;
    
    setIsCheckingPro(true);
    try {
      const { data, error } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      
      if (error && error.code === 'PGRST116') {
        // Fallback: Profile doesn't exist, create it instantly
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          is_pro: false
        });
        setIsPremium(false);
      } else if (error) {
        console.error("Failed to fetch Pro status:", error);
        // Do NOT reset setIsPremium(false) here. Prevents spontaneous downgrades on network blips.
      } else if (data) {
        setIsPremium(data.is_pro === true);
      } else {
        setIsPremium(false);
      }
    } catch (err) {
      console.error("Error in checkProStatus", err);
    } finally {
      lastCheckedUser.current = user.id;
      setIsCheckingPro(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) checkProStatus(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkProStatus(session.user);
      } else {
        setIsPremium(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isPremium: isPremiumInternal, setIsPremium, checkProStatus, isCheckingPro }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
