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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          category: string
          city: string
          created_at: string
          founded: number
          id: number
          latitude: number
          location_label: string
          logo_url: string | null
          longitude: number
          map_sprite: string
          name: string
          short_description: string
          slug: string
          source_url: string
          updated_at: string
          website: string
        }
        Insert: {
          category: string
          city: string
          created_at?: string
          founded: number
          id?: never
          latitude: number
          location_label: string
          logo_url?: string | null
          longitude: number
          map_sprite?: string
          name: string
          short_description: string
          slug: string
          source_url: string
          updated_at?: string
          website: string
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          founded?: number
          id?: never
          latitude?: number
          location_label?: string
          logo_url?: string | null
          longitude?: number
          map_sprite?: string
          name?: string
          short_description?: string
          slug?: string
          source_url?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      company_submission_requests: {
        Row: {
          category: string
          city: string
          company_name: string
          contact_email: string | null
          created_at: string
          founded: number
          id: number
          location_label: string
          notes: string | null
          short_description: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category: string
          city: string
          company_name: string
          contact_email?: string | null
          created_at?: string
          founded: number
          id?: never
          location_label: string
          notes?: string | null
          short_description: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          city?: string
          company_name?: string
          contact_email?: string | null
          created_at?: string
          founded?: number
          id?: never
          location_label?: string
          notes?: string | null
          short_description?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      meetups: {
        Row: {
          city: string
          contact_email: string | null
          created_at: string
          description: string
          ends_at: string | null
          event_url: string
          id: number
          latitude: number
          location_label: string
          longitude: number
          organizer_name: string
          payload_hash: string | null
          slug: string
          starts_at: string
          status: string
          title: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          city: string
          contact_email?: string | null
          created_at?: string
          description: string
          ends_at?: string | null
          event_url: string
          id?: never
          latitude: number
          location_label: string
          longitude: number
          organizer_name: string
          payload_hash?: string | null
          slug: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          city?: string
          contact_email?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          event_url?: string
          id?: never
          latitude?: number
          location_label?: string
          longitude?: number
          organizer_name?: string
          payload_hash?: string | null
          slug?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: []
      }
      meetup_submission_attempts: {
        Row: {
          created_at: string
          id: number
          ip_hash: string
          payload_hash: string
        }
        Insert: {
          created_at?: string
          id?: never
          ip_hash: string
          payload_hash: string
        }
        Update: {
          created_at?: string
          id?: never
          ip_hash?: string
          payload_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      published_upcoming_meetups: {
        Row: {
          city: string | null
          description: string | null
          ends_at: string | null
          event_url: string | null
          latitude: number | null
          location_label: string | null
          longitude: number | null
          organizer_name: string | null
          slug: string | null
          starts_at: string | null
          status: string | null
          title: string | null
          venue_name: string | null
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
