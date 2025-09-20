import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'clinic_admin' | 'patient';
  created_at: string;
  updated_at: string;
}

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserRole = async () => {
    if (!user) {
      console.log('No user found, setting loading to false');
      setUserRole(null);
      setLoading(false);
      return;
    }

    console.log('Fetching user role for user:', user.id);

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        // Handle all error types gracefully - just default to patient role
        console.warn('Error fetching user role, defaulting to patient:', error.message);
        setUserRole(null);
        return;
      }

      setUserRole(data || null);
    } catch (err) {
      console.warn('Exception fetching user role, defaulting to patient:', err);
      // Always default to patient role on any error
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    // Check if user is the specific admin user - ALWAYS return true for this user
    if (user?.id === '130f849a-d894-4ce6-a78e-0df3812093de') {
      console.log('User is the specific admin user - ALWAYS ADMIN');
      return true;
    }
    console.log('User role from database:', userRole?.role);
    return userRole?.role === 'admin';
  };

  const isClinicAdmin = () => {
    return userRole?.role === 'clinic_admin';
  };

  const isPatient = () => {
    return userRole?.role === 'patient' || !userRole; // Default to patient if no role
  };

  const hasRole = (role: 'admin' | 'clinic_admin' | 'patient') => {
    if (role === 'admin' && user?.id === '130f849a-d894-4ce6-a78e-0df3812093de') {
      return true;
    }
    return userRole?.role === role;
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  return {
    userRole,
    loading,
    error,
    isAdmin,
    isClinicAdmin,
    isPatient,
    hasRole,
    refetch: fetchUserRole,
  };
};
