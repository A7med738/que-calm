import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MedicalCenter {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  email?: string;
  hours?: string;
  description?: string;
  rating: number;
  image_url?: string;
  serial_number: string;
  status: string;
  doctor_count: number;
  service_count: number;
  average_rating: number | null;
  review_count: number;
}

export const useMedicalCenters = () => {
  const [centers, setCenters] = useState<MedicalCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('patient_medical_centers_with_stats')
        .select('*')
        .order('average_rating', { ascending: false, nullsLast: true });

      if (error) {
        throw error;
      }

      // Only update if data has changed
      setCenters(prevCenters => {
        const newData = data || [];
        if (JSON.stringify(prevCenters) === JSON.stringify(newData)) {
          return prevCenters;
        }
        return newData;
      });
    } catch (err) {
      console.error('Error fetching medical centers:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب المراكز الطبية');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCenters = useCallback(async (query: string) => {
    if (!query.trim()) {
      await fetchCenters();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('patient_medical_centers_with_stats')
        .select('*')
        .or(`name.ilike.%${query}%,specialty.ilike.%${query}%`)
        .order('average_rating', { ascending: false, nullsLast: true });

      if (error) {
        throw error;
      }

      // Only update if data has changed
      setCenters(prevCenters => {
        const newData = data || [];
        if (JSON.stringify(prevCenters) === JSON.stringify(newData)) {
          return prevCenters;
        }
        return newData;
      });
    } catch (err) {
      console.error('Error searching medical centers:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  }, [fetchCenters]);

  useEffect(() => {
    fetchCenters();
  }, []);

  return {
    centers,
    loading,
    error,
    refetch: fetchCenters,
    search: searchCenters,
  };
};
