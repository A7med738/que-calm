// Queue testing utilities
import { supabase } from '@/integrations/supabase/client';

export interface QueueTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const testQueueSystem = async (medicalCenterId: string, doctorId: string): Promise<QueueTestResult> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Test 1: Get current queue numbers
    const { data: currentQueues, error: queueError } = await supabase
      .from('bookings')
      .select('id, queue_number, status, created_at')
      .eq('medical_center_id', medicalCenterId)
      .eq('doctor_id', doctorId)
      .eq('booking_date', today)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('created_at', { ascending: true });

    if (queueError) {
      return {
        success: false,
        message: 'Failed to fetch current queues',
        error: queueError.message
      };
    }

    // Test 2: Get next queue number
    const { data: nextNumber, error: nextError } = await supabase
      .rpc('get_next_doctor_queue_number_safe', {
        p_medical_center_id: medicalCenterId,
        p_doctor_id: doctorId,
        p_booking_date: today
      });

    if (nextError) {
      return {
        success: false,
        message: 'Failed to get next queue number',
        error: nextError.message
      };
    }

    // Test 3: Check for duplicate queue numbers
    const queueNumbers = currentQueues?.map(b => b.queue_number) || [];
    const duplicates = queueNumbers.filter((num, index) => queueNumbers.indexOf(num) !== index);
    
    if (duplicates.length > 0) {
      return {
        success: false,
        message: 'Duplicate queue numbers found',
        data: {
          duplicates,
          currentQueues,
          nextNumber
        }
      };
    }

    // Test 4: Check sequential numbering
    const sortedNumbers = [...queueNumbers].sort((a, b) => a - b);
    const isSequential = sortedNumbers.every((num, index) => num === index + 1);
    
    if (!isSequential && queueNumbers.length > 0) {
      return {
        success: false,
        message: 'Queue numbers are not sequential',
        data: {
          queueNumbers: sortedNumbers,
          expectedSequential: Array.from({ length: queueNumbers.length }, (_, i) => i + 1),
          currentQueues,
          nextNumber
        }
      };
    }

    return {
      success: true,
      message: 'Queue system is working correctly',
      data: {
        currentQueues,
        nextNumber,
        queueNumbers: sortedNumbers,
        totalPatients: currentQueues?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error during queue test',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const reorganizeQueueForDoctor = async (medicalCenterId: string, doctorId: string, bookingDate: string): Promise<QueueTestResult> => {
  try {
    const { error } = await supabase
      .rpc('reorganize_doctor_queue', {
        p_medical_center_id: medicalCenterId,
        p_doctor_id: doctorId,
        p_booking_date: bookingDate
      });

    if (error) {
      return {
        success: false,
        message: 'Failed to reorganize queue',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Queue reorganized successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error during queue reorganization',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getQueueStatistics = async (medicalCenterId: string, doctorId: string): Promise<QueueTestResult> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: stats, error } = await supabase
      .rpc('get_doctor_queue_stats', {
        p_medical_center_id: medicalCenterId,
        p_doctor_id: doctorId,
        p_booking_date: today
      });

    if (error) {
      return {
        success: false,
        message: 'Failed to get queue statistics',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Queue statistics retrieved successfully',
      data: stats?.[0]
    };

  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error getting queue statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
