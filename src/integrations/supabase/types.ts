export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          doctor_id: string | null
          family_member_id: string | null
          id: string
          medical_center_id: string
          notes: string | null
          patient_id: string
          qr_code: string | null
          queue_number: number
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          doctor_id?: string | null
          family_member_id?: string | null
          id?: string
          medical_center_id: string
          notes?: string | null
          patient_id: string
          qr_code?: string | null
          queue_number: number
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          doctor_id?: string | null
          family_member_id?: string | null
          id?: string
          medical_center_id?: string
          notes?: string | null
          patient_id?: string
          qr_code?: string | null
          queue_number?: number
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_medical_center_id_fkey"
            columns: ["medical_center_id"]
            isOneToOne: false
            referencedRelation: "medical_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      doctors: {
        Row: {
          created_at: string
          email: string | null
          experience_years: number | null
          id: string
          medical_center_id: string
          name: string
          phone: string | null
          specialty: string
          status: string
          updated_at: string
          working_hours: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          medical_center_id: string
          name: string
          phone?: string | null
          specialty: string
          status?: string
          updated_at?: string
          working_hours?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          medical_center_id?: string
          name?: string
          phone?: string | null
          specialty?: string
          status?: string
          updated_at?: string
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_medical_center_id_fkey"
            columns: ["medical_center_id"]
            isOneToOne: false
            referencedRelation: "medical_centers"
            referencedColumns: ["id"]
          }
        ]
      }
      family_members: {
        Row: {
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          full_name: string
          id?: string
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          medical_center_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medical_center_id: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medical_center_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_medical_center_id_fkey"
            columns: ["medical_center_id"]
            isOneToOne: false
            referencedRelation: "medical_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_centers: {
        Row: {
          address: string
          created_at: string
          description: string | null
          email: string | null
          hours: string | null
          id: string
          image_url: string | null
          name: string
          phone: string
          rating: number
          serial_number: string
          specialty: string
          status: string
          updated_at: string
          owner_id: string | null
          admin_id: string | null
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          name: string
          phone: string
          rating?: number
          serial_number: string
          specialty: string
          status?: string
          updated_at?: string
          owner_id?: string | null
          admin_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          name?: string
          phone?: string
          rating?: number
          serial_number?: string
          specialty?: string
          status?: string
          updated_at?: string
          owner_id?: string | null
          admin_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          patient_id: string
          title: string
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          patient_id: string
          title: string
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          patient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      queue_tracking: {
        Row: {
          booking_id: string
          called_at: string | null
          created_at: string
          current_number: number
          estimated_wait_time: number | null
          id: string
          served_at: string | null
          status: string
          updated_at: string
          waiting_count: number
        }
        Insert: {
          booking_id: string
          called_at?: string | null
          created_at?: string
          current_number: number
          estimated_wait_time?: number | null
          id?: string
          served_at?: string | null
          status?: string
          updated_at?: string
          waiting_count?: number
        }
        Update: {
          booking_id?: string
          called_at?: string | null
          created_at?: string
          current_number?: number
          estimated_wait_time?: number | null
          id?: string
          served_at?: string | null
          status?: string
          updated_at?: string
          waiting_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          medical_center_id: string
          patient_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          medical_center_id: string
          patient_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          medical_center_id?: string
          patient_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_medical_center_id_fkey"
            columns: ["medical_center_id"]
            isOneToOne: false
            referencedRelation: "medical_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          doctor_name: string | null
          doctor_specialty: string | null
          id: string
          is_active: boolean
          medical_center_id: string
          name: string
          price: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doctor_name?: string | null
          doctor_specialty?: string | null
          id?: string
          is_active?: boolean
          medical_center_id: string
          name: string
          price: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doctor_name?: string | null
          doctor_specialty?: string | null
          id?: string
          is_active?: boolean
          medical_center_id?: string
          name?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_medical_center_id_fkey"
            columns: ["medical_center_id"]
            isOneToOne: false
            referencedRelation: "medical_centers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      medical_centers_with_stats: {
        Row: {
          address: string
          average_rating: number | null
          created_at: string
          description: string | null
          doctor_count: number
          email: string | null
          hours: string | null
          id: string
          image_url: string | null
          name: string
          phone: string
          rating: number
          review_count: number
          serial_number: string
          service_count: number
          specialty: string
          status: string
          updated_at: string
        }
        Relationships: []
      }
      patient_bookings_with_details: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          current_number: number | null
          doctor_id: string | null
          doctor_name: string | null
          family_member_id: string | null
          family_member_name: string | null
          id: string
          medical_center_address: string
          medical_center_id: string
          medical_center_name: string
          medical_center_phone: string
          notes: string | null
          patient_id: string
          price: number
          queue_number: number
          queue_status: string | null
          service_id: string
          service_name: string
          service_price: number
          status: string
          updated_at: string
          waiting_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          medical_center_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: any | null
          new_values: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          medical_center_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          medical_center_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
