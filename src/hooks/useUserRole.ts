import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'clinic_admin' | 'patient';
  created_at: string;
  updated_at: string;
}

// Secure admin check function
const checkAdminUser = async (userId: string): Promise<boolean> => {
  try {
    // Use a secure RPC function to check admin status
    const { data, error } = await supabase
      .rpc('check_admin_user', { user_uuid: userId });
    
    if (error) {
      console.warn('Error checking admin status:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.warn('Exception checking admin status:', err);
    return false;
  }
};

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      // console.log('No user found, setting loading to false');
      setUserRole(null);
      setLoading(false);
      return;
    }

    // console.log('Fetching user role for user:', user.id);

    try {
      setLoading(true);
      setError(null);

      // Check if user is admin using secure method
      const isAdminUser = await checkAdminUser(user.id);
      if (isAdminUser) {
        // console.log('User is admin - setting admin role');
        setUserRole({
          id: 'admin-role',
          user_id: user.id,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      // Use the safe function to get user role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { user_uuid: user.id });

      if (roleError) {
        console.warn('Error fetching user role, defaulting to patient:', roleError.message);
        setUserRole(null);
        return;
      }

      // Create a user role object from the returned role
      if (roleData) {
        setUserRole({
          id: `role-${user.id}`,
          user_id: user.id,
          role: roleData as 'admin' | 'clinic_admin' | 'patient',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        setUserRole(null);
      }
    } catch (err) {
      console.warn('Exception fetching user role, defaulting to patient:', err);
      // Always default to patient role on any error
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isAdmin = () => {
    if (!user) return false;
    
    // Check if user role is admin
    // console.log('User role from database:', userRole?.role);
    return userRole?.role === 'admin';
  };

  const isClinicAdmin = () => {
    return userRole?.role === 'clinic_admin';
  };

  const isPatient = () => {
    return userRole?.role === 'patient' || !userRole; // Default to patient if no role
  };

  const hasRole = (role: 'admin' | 'clinic_admin' | 'patient') => {
    if (role === 'admin') {
      return isAdmin();
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
