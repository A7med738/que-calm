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
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  doctor_name?: string;
  waiting_count?: number;
}

export const useMedicalCenter = (centerId: string) => {
  const [center, setCenter] = useState<MedicalCenter | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCenterData = async () => {
    if (!centerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch center details
      const { data: centerData, error: centerError } = await supabase
        .from('medical_centers')
        .select('*')
        .eq('id', centerId)
        .eq('status', 'active')
        .single();

      if (centerError) {
        throw centerError;
      }

      setCenter(centerData);

      // Fetch services with doctor names
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          doctors (
            name
          )
        `)
        .eq('medical_center_id', centerId)
        .eq('status', 'active');

      if (servicesError) {
        throw servicesError;
      }

      // Transform services data
      const transformedServices = servicesData?.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
        doctor_name: service.doctors?.name,
        waiting_count: Math.floor(Math.random() * 10) + 1 // Mock waiting count for now
      })) || [];

      setServices(transformedServices);

    } catch (err) {
      console.error('Error fetching center data:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب بيانات المركز');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenterData();
  }, [centerId]);

  return {
    center,
    services,
    loading,
    error,
    refetch: fetchCenterData,
  };
};
