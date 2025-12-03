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
      brick_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          standard_bricks_per_punch: number
          type_name: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          standard_bricks_per_punch: number
          type_name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          standard_bricks_per_punch?: number
          type_name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      bricks_production: {
        Row: {
          actual_bricks_produced: number
          brick_type_id: string
          created_at: string
          date: string
          factory_id: string | null
          id: string
          number_of_punches: number
          remarks: string | null
          updated_at: string
        }
        Insert: {
          actual_bricks_produced: number
          brick_type_id: string
          created_at?: string
          date: string
          factory_id?: string | null
          id?: string
          number_of_punches: number
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          actual_bricks_produced?: number
          brick_type_id?: string
          created_at?: string
          date?: string
          factory_id?: string | null
          id?: string
          number_of_punches?: number
          remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bricks_production_brick_type_id_fkey"
            columns: ["brick_type_id"]
            isOneToOne: false
            referencedRelation: "brick_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bricks_production_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          factory_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          factory_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          factory_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      employee_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          employee_name: string
          factory_id: string | null
          id: string
          notes: string | null
          payment_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          employee_name: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          payment_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          employee_name?: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          payment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payments_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          daily_wage: number | null
          factory_id: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          daily_wage?: number | null
          factory_id: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          daily_wage?: number | null
          factory_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      factories: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      factory_rates: {
        Row: {
          brick_type_id: string | null
          created_at: string
          effective_date: string
          factory_id: string | null
          id: string
          is_active: boolean
          rate_amount: number
          rate_type: string
          updated_at: string
        }
        Insert: {
          brick_type_id?: string | null
          created_at?: string
          effective_date?: string
          factory_id?: string | null
          id?: string
          is_active?: boolean
          rate_amount: number
          rate_type: string
          updated_at?: string
        }
        Update: {
          brick_type_id?: string | null
          created_at?: string
          effective_date?: string
          factory_id?: string | null
          id?: string
          is_active?: boolean
          rate_amount?: number
          rate_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_rates_brick_type_id_fkey"
            columns: ["brick_type_id"]
            isOneToOne: false
            referencedRelation: "brick_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_rates_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_definitions: {
        Row: {
          created_at: string
          factory_id: string
          id: string
          name: string
          unit: string
        }
        Insert: {
          created_at?: string
          factory_id: string
          id?: string
          name: string
          unit: string
        }
        Update: {
          created_at?: string
          factory_id?: string
          id?: string
          name?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_definitions_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_purchases: {
        Row: {
          created_at: string
          date: string
          factory_id: string | null
          id: string
          material_id: string
          notes: string | null
          payment_made: number
          quantity_purchased: number
          supplier_name: string
          supplier_phone: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          factory_id?: string | null
          id?: string
          material_id: string
          notes?: string | null
          payment_made?: number
          quantity_purchased: number
          supplier_name: string
          supplier_phone?: string | null
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          factory_id?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          payment_made?: number
          quantity_purchased?: number
          supplier_name?: string
          supplier_phone?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_purchases_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_purchases_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_usage: {
        Row: {
          created_at: string
          date: string
          factory_id: string | null
          id: string
          material_id: string
          purpose: string
          quantity_used: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          factory_id?: string | null
          id?: string
          material_id: string
          purpose: string
          quantity_used: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          factory_id?: string | null
          id?: string
          material_id?: string
          purpose?: string
          quantity_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_usage_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          average_cost_per_unit: number
          created_at: string
          current_stock_qty: number
          factory_id: string | null
          id: string
          material_name: string
          unit: string
          updated_at: string
        }
        Insert: {
          average_cost_per_unit?: number
          created_at?: string
          current_stock_qty?: number
          factory_id?: string | null
          id?: string
          material_name: string
          unit: string
          updated_at?: string
        }
        Update: {
          average_cost_per_unit?: number
          created_at?: string
          current_stock_qty?: number
          factory_id?: string | null
          id?: string
          material_name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      other_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          expense_type: string
          factory_id: string | null
          id: string
          notes: string | null
          receipt_number: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description: string
          expense_type: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          receipt_number?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          expense_type?: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          receipt_number?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "other_expenses_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_definitions: {
        Row: {
          created_at: string
          factory_id: string
          id: string
          items_per_punch: number | null
          name: string
          size_description: string | null
          unit: string
        }
        Insert: {
          created_at?: string
          factory_id: string
          id?: string
          items_per_punch?: number | null
          name: string
          size_description?: string | null
          unit?: string
        }
        Update: {
          created_at?: string
          factory_id?: string
          id?: string
          items_per_punch?: number | null
          name?: string
          size_description?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_definitions_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      production_logs: {
        Row: {
          created_at: string
          date: string | null
          factory_id: string
          id: string
          product_id: string
          product_name: string
          punches: number | null
          quantity: number
          remarks: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          factory_id: string
          id?: string
          product_id: string
          product_name: string
          punches?: number | null
          quantity: number
          remarks?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          factory_id?: string
          id?: string
          product_id?: string
          product_name?: string
          punches?: number | null
          quantity?: number
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_production_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_received: number
          balance_due: number
          created_at: string
          customer_name: string
          customer_phone: string | null
          date: string
          factory_id: string | null
          id: string
          notes: string | null
          product_id: string
          quantity_sold: number
          rate_per_brick: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_received?: number
          balance_due?: number
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          date: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity_sold: number
          rate_per_brick: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_received?: number
          balance_due?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          date?: string
          factory_id?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity_sold?: number
          rate_per_brick?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_brick_type_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "brick_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string | null
          factory_id: string
          id: string
          material_type: string | null
          name: string
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string | null
          factory_id: string
          id?: string
          material_type?: string | null
          name: string
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string | null
          factory_id?: string
          id?: string
          material_type?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_factory_id: { Args: never; Returns: string }
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
