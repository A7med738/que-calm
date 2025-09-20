import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  full_name: string;
  birth_date?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  birth_date?: string;
  relationship?: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFamilyMembers();
    } else {
      setProfile(null);
      setFamilyMembers([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile();
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const addFamilyMember = async (member: Omit<FamilyMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('family_members')
        .insert([{ ...member, user_id: user.id }]);

      if (error) throw error;
      await fetchFamilyMembers();
      return { error: null };
    } catch (error) {
      console.error('Error adding family member:', error);
      return { error };
    }
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchFamilyMembers();
      return { error: null };
    } catch (error) {
      console.error('Error updating family member:', error);
      return { error };
    }
  };

  const deleteFamilyMember = async (id: string) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchFamilyMembers();
      return { error: null };
    } catch (error) {
      console.error('Error deleting family member:', error);
      return { error };
    }
  };

  return {
    profile,
    familyMembers,
    loading,
    updateProfile,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    refreshProfile: fetchProfile,
    refreshFamilyMembers: fetchFamilyMembers
  };
}