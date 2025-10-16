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
      booking_services: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          price_paid: number
          service_id: string | null
          service_order: number | null
          staff_id: string | null
          start_time: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          price_paid: number
          service_id?: string | null
          service_order?: number | null
          staff_id?: string | null
          start_time?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          price_paid?: number
          service_id?: string | null
          service_order?: number | null
          staff_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          confirmation_number: string
          created_at: string | null
          customer_id: string | null
          deposit_amount: number | null
          id: string
          location_id: string | null
          notes: string | null
          payment_method_id: string | null
          remaining_amount: number
          start_all_same_time: boolean | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id: string | null
          subtotal: number
          total_duration_minutes: number
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          confirmation_number: string
          created_at?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          payment_method_id?: string | null
          remaining_amount: number
          start_all_same_time?: boolean | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          subtotal: number
          total_duration_minutes: number
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          confirmation_number?: string
          created_at?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          payment_method_id?: string | null
          remaining_amount?: number
          start_all_same_time?: boolean | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          total_duration_minutes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          apple_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          google_id: string | null
          has_accepted_policy: boolean | null
          id: string
          last_name: string | null
          phone: string
          policy_accepted_at: string | null
          promotional_texts_enabled: boolean | null
          sms_reminders_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          apple_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          google_id?: string | null
          has_accepted_policy?: boolean | null
          id?: string
          last_name?: string | null
          phone: string
          policy_accepted_at?: string | null
          promotional_texts_enabled?: boolean | null
          sms_reminders_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          apple_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          google_id?: string | null
          has_accepted_policy?: boolean | null
          id?: string
          last_name?: string | null
          phone?: string
          policy_accepted_at?: string | null
          promotional_texts_enabled?: boolean | null
          sms_reminders_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          cancellation_policy: string
          city: string
          created_at: string | null
          deposit_percentage: number | null
          email: string | null
          has_deposit_policy: boolean | null
          hero_image_url: string | null
          hours_weekday: string
          hours_weekend: string
          id: string
          name: string
          phone: string
          state: string
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          cancellation_policy?: string
          city: string
          created_at?: string | null
          deposit_percentage?: number | null
          email?: string | null
          has_deposit_policy?: boolean | null
          hero_image_url?: string | null
          hours_weekday?: string
          hours_weekend?: string
          id?: string
          name: string
          phone: string
          state: string
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          cancellation_policy?: string
          city?: string
          created_at?: string | null
          deposit_percentage?: number | null
          email?: string | null
          has_deposit_policy?: boolean | null
          hero_image_url?: string | null
          hours_weekday?: string
          hours_weekend?: string
          id?: string
          name?: string
          phone?: string
          state?: string
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last4: string
          created_at: string | null
          customer_id: string | null
          id: string
          is_default: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at: string | null
        }
        Insert: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last4: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_default?: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at?: string | null
        }
        Update: {
          card_brand?: string
          card_exp_month?: number
          card_exp_year?: number
          card_last4?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_default?: boolean | null
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string | null
          description: string | null
          discount_when_bundled: number | null
          display_order: number | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_add_on: boolean | null
          location_id: string | null
          name: string
          parent_service_id: string | null
          price_card: number
          price_cash: number
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string | null
          description?: string | null
          discount_when_bundled?: number | null
          display_order?: number | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          is_add_on?: boolean | null
          location_id?: string | null
          name: string
          parent_service_id?: string | null
          price_card: number
          price_cash: number
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string | null
          description?: string | null
          discount_when_bundled?: number | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_add_on?: boolean | null
          location_id?: string | null
          name?: string
          parent_service_id?: string | null
          price_card?: number
          price_cash?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_parent_service_id_fkey"
            columns: ["parent_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_verifications: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          is_verified: boolean | null
          phone: string
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_verified?: boolean | null
          phone: string
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          phone?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          display_order: number | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          location_id: string | null
          next_available_time: string | null
          specialties: string[] | null
          status: Database["public"]["Enums"]["staff_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_order?: number | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          location_id?: string | null
          next_available_time?: string | null
          specialties?: string[] | null
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_order?: number | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          location_id?: string | null
          next_available_time?: string | null
          specialties?: string[] | null
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      service_category:
        | "manicure"
        | "pedicure"
        | "extensions"
        | "nail_art"
        | "add_ons"
      staff_status: "available_now" | "available_later" | "unavailable"
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      service_category: [
        "manicure",
        "pedicure",
        "extensions",
        "nail_art",
        "add_ons",
      ],
      staff_status: ["available_now", "available_later", "unavailable"],
    },
  },
} as const
