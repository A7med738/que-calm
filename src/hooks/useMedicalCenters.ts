import { useState, useEffect } from 'react';
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

  const fetchCenters = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('medical_centers_with_stats')
        .select('*')
        .eq('status', 'active')
        .order('average_rating', { ascending: false, nullsLast: true });

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
  };

  const searchCenters = async (query: string) => {
    if (!query.trim()) {
      await fetchCenters();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('medical_centers_with_stats')
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,specialty.ilike.%${query}%`)
        .order('average_rating', { ascending: false, nullsLast: true });

      if (error) {
        throw error;
      }

      setCenters(data || []);
    } catch (err) {
      console.error('Error searching medical centers:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

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
