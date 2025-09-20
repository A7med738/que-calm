import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const redirectUrl = `${window.location.origin}/patient/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('clinic_session');
      localStorage.removeItem('supabase.auth.token');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Use local scope instead of global
      });
      
      // Clear user state immediately
      setUser(null);
      setSession(null);
      
      return { error };
    } catch (err) {
      console.error('Error during sign out:', err);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      localStorage.removeItem('clinic_session');
      localStorage.removeItem('supabase.auth.token');
      return { error: err as Error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };
}