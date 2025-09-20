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
  doctor_name?: string;
  doctor_specialty?: string;
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

      // Fetch services (doctor names are now stored directly in services table)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('medical_center_id', centerId)
        .eq('status', 'active')
        .eq('is_active', true);

      if (servicesError) {
        throw servicesError;
      }

      // Transform services data with real waiting count
      const transformedServices = await Promise.all(
        (servicesData || []).map(async (service) => {
          // Get real waiting count for this service
          const today = new Date().toISOString().split('T')[0];
          const { count: waitingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('medical_center_id', centerId)
            .eq('service_id', service.id)
            .eq('booking_date', today)
            .in('status', ['pending', 'confirmed', 'in_progress']);

          return {
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            doctor_name: service.doctor_name,
            doctor_specialty: service.doctor_specialty,
            waiting_count: waitingCount || 0
          };
        })
      );

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
