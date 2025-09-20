import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  medical_center_id: string;
  name: string;
  description: string;
  price: number;
  doctor_name: string;
  doctor_specialty: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceForm {
  name: string;
  description: string;
  price: number;
  doctor_name: string;
  doctor_specialty: string;
}

export const useClinicServices = (medicalCenterId?: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!medicalCenterId) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('medical_center_id', medicalCenterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب الخدمات');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: ServiceForm) => {
    if (!medicalCenterId) {
      throw new Error('معرف المركز الطبي مطلوب');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          doctor_name: serviceData.doctor_name,
          doctor_specialty: serviceData.doctor_specialty,
          medical_center_id: medicalCenterId,
          is_active: true,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      
      // تسجيل عملية إنشاء الخدمة في سجل الأنشطة
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('log_audit_event', {
            p_user_id: user.id,
            p_medical_center_id: medicalCenterId,
            p_action: 'CREATE',
            p_table_name: 'services',
            p_record_id: data.id,
            p_new_values: { 
              name: serviceData.name,
              price: serviceData.price,
              doctor_name: serviceData.doctor_name
            }
          });
        }
      } catch (auditError) {
        console.error('Error logging audit event:', auditError);
        // لا نوقف العملية إذا فشل تسجيل السجل
      }
      
      setServices(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating service:', err);
      throw err;
    }
  };

  const updateService = async (serviceId: string, serviceData: Partial<ServiceForm>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (serviceData.name !== undefined) updateData.name = serviceData.name;
      if (serviceData.description !== undefined) updateData.description = serviceData.description;
      if (serviceData.price !== undefined) updateData.price = serviceData.price;
      if (serviceData.doctor_name !== undefined) updateData.doctor_name = serviceData.doctor_name;
      if (serviceData.doctor_specialty !== undefined) updateData.doctor_specialty = serviceData.doctor_specialty;

      const { data, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId ? data : service
        )
      );
      return data;
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      setServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (err) {
      console.error('Error deleting service:', err);
      throw err;
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          is_active: isActive,
          status: isActive ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId ? data : service
        )
      );
      return data;
    } catch (err) {
      console.error('Error toggling service status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [medicalCenterId]);

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    refetch: fetchServices
  };
};
