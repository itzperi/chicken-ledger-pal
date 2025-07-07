export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bills: {
        Row: {
          balance_amount: number
          bank_name: string | null
          bill_date: string
          bill_number: string
          business_id: string
          cash_amount: number | null
          check_number: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string
          gpay_amount: number | null
          id: number
          items: Json
          paid_amount: number
          payment_method: string
          total_amount: number
          upi_type: string | null
        }
        Insert: {
          balance_amount: number
          bank_name?: string | null
          bill_date: string
          bill_number: string
          business_id: string
          cash_amount?: number | null
          check_number?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone: string
          gpay_amount?: number | null
          id?: number
          items: Json
          paid_amount: number
          payment_method: string
          total_amount: number
          upi_type?: string | null
        }
        Update: {
          balance_amount?: number
          bank_name?: string | null
          bill_date?: string
          bill_number?: string
          business_id?: string
          cash_amount?: number | null
          check_number?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string
          gpay_amount?: number | null
          id?: number
          items?: Json
          paid_amount?: number
          payment_method?: string
          total_amount?: number
          upi_type?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          balance: number | null
          business_id: string
          created_at: string | null
          id: number
          name: string
          phone: string
        }
        Insert: {
          balance?: number | null
          business_id: string
          created_at?: string | null
          id?: number
          name: string
          phone: string
        }
        Update: {
          balance?: number | null
          business_id?: string
          created_at?: string | null
          id?: number
          name?: string
          phone?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          business_id: string
          chicken_stock_kg: number
          id: number
          last_updated: string
        }
        Insert: {
          business_id: string
          chicken_stock_kg?: number
          id?: number
          last_updated?: string
        }
        Update: {
          business_id?: string
          chicken_stock_kg?: number
          id?: number
          last_updated?: string
        }
        Relationships: []
      }
      load_entries: {
        Row: {
          business_id: string
          created_at: string | null
          entry_date: string
          id: number
          no_of_boxes: number
          no_of_boxes_after: number
          quantity_after_box: number
          quantity_with_box: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          entry_date?: string
          id?: number
          no_of_boxes: number
          no_of_boxes_after: number
          quantity_after_box: number
          quantity_with_box: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          entry_date?: string
          id?: number
          no_of_boxes?: number
          no_of_boxes_after?: number
          quantity_after_box?: number
          quantity_with_box?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          theme: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          theme?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          box_weight_per_box: number
          business_id: string
          chicken_boxes: number
          chicken_kg: number
          created_at: string
          id: number
          notes: string | null
          purchase_date: string
          total_boxes: number
          total_load_kg: number
          updated_at: string
        }
        Insert: {
          box_weight_per_box?: number
          business_id: string
          chicken_boxes: number
          chicken_kg: number
          created_at?: string
          id?: number
          notes?: string | null
          purchase_date?: string
          total_boxes: number
          total_load_kg: number
          updated_at?: string
        }
        Update: {
          box_weight_per_box?: number
          business_id?: string
          chicken_boxes?: number
          chicken_kg?: number
          created_at?: string
          id?: number
          notes?: string | null
          purchase_date?: string
          total_boxes?: number
          total_load_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_bill_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
