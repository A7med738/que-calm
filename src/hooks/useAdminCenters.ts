import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MedicalCenterForm {
  name: string;
  specialty: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  description: string;
  admin_email: string;
  admin_password: string;
}

export interface MedicalCenterWithAdmin {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  description: string;
  serial_number: string;
  status: string;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
  doctor_count: number;
  service_count: number;
  average_rating: number | null;
  review_count: number;
}

export const useAdminCenters = () => {
  const [centers, setCenters] = useState<MedicalCenterWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('medical_centers_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCenters(data || []);
    } catch (err) {
      console.error('Error fetching medical centers:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب المراكز الطبية');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMedicalCenter = async (centerData: MedicalCenterForm) => {
    try {
      setError(null);

      // Call the database function to create medical center
      const { data, error } = await supabase
        .rpc('create_medical_center_with_admin', {
          p_name: centerData.name,
          p_specialty: centerData.specialty,
          p_address: centerData.address,
          p_phone: centerData.phone,
          p_email: centerData.email,
          p_hours: centerData.hours,
          p_description: centerData.description,
          p_admin_email: centerData.admin_email,
          p_admin_password: centerData.admin_password
        });

      if (error) {
        throw error;
      }

      // Refresh the centers list
      await fetchCenters();

      return data;
    } catch (err) {
      console.error('Error creating medical center:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إنشاء المركز الطبي';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMedicalCenter = async (centerId: string, updates: Partial<MedicalCenterForm>) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('medical_centers')
        .update(updates)
        .eq('id', centerId);

      if (error) {
        throw error;
      }

      // Refresh the centers list
      await fetchCenters();

      return true;
    } catch (err) {
      console.error('Error updating medical center:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تحديث المركز الطبي';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMedicalCenter = async (centerId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('medical_centers')
        .delete()
        .eq('id', centerId);

      if (error) {
        throw error;
      }

      // Update local state immediately
      setCenters(prevCenters => 
        prevCenters.filter(center => center.id !== centerId)
      );

      return true;
    } catch (err) {
      console.error('Error deleting medical center:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف المركز الطبي';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleCenterStatus = async (centerId: string, newStatus: 'active' | 'inactive') => {
    try {
      setError(null);

      const { error } = await supabase
        .from('medical_centers')
        .update({ status: newStatus })
        .eq('id', centerId);

      if (error) {
        throw error;
      }

      // Update local state immediately
      setCenters(prevCenters => 
        prevCenters.map(center => 
          center.id === centerId 
            ? { ...center, status: newStatus }
            : center
        )
      );

      return true;
    } catch (err) {
      console.error('Error toggling center status:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تغيير حالة المركز';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  return {
    centers,
    loading,
    error,
    createMedicalCenter,
    updateMedicalCenter,
    deleteMedicalCenter,
    toggleCenterStatus,
    refetch: fetchCenters,
  };
};
