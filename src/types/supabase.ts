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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          business_name: string
          currency: string
          low_stock_threshold: number
          public_catalog_enabled: boolean
          public_intro: string
          public_slug: string
          updated_at: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          business_name?: string
          currency?: string
          low_stock_threshold?: number
          public_catalog_enabled?: boolean
          public_intro?: string
          public_slug?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string
        }
        Update: {
          business_name?: string
          currency?: string
          low_stock_threshold?: number
          public_catalog_enabled?: boolean
          public_intro?: string
          public_slug?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          notes: string
          phone: string
          user_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          name: string
          notes?: string
          phone?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      option_types: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      option_values: {
        Row: {
          created_at: string
          id: string
          name: string
          option_type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          option_type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          option_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_values_option_type_id_fkey"
            columns: ["option_type_id"]
            isOneToOne: false
            referencedRelation: "option_types"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          sku_snapshot: string
          unit_cost_snapshot: number
          unit_price: number
          variant_id: string | null
          variant_label_snapshot: string
        }
        Insert: {
          id?: string
          line_total?: number
          order_id: string
          product_id: string
          product_name_snapshot?: string
          quantity: number
          sku_snapshot?: string
          unit_cost_snapshot?: number
          unit_price: number
          variant_id?: string | null
          variant_label_snapshot?: string
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          sku_snapshot?: string
          unit_cost_snapshot?: number
          unit_price?: number
          variant_id?: string | null
          variant_label_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string
          order_number: string
          payment_status: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string
          order_number: string
          payment_status?: string
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string
          order_number?: string
          payment_status?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          inventory_cost: number
          low_stock_threshold: number
          name: string
          product_id: string
          sale_price: number
          sku: string
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_cost?: number
          low_stock_threshold?: number
          name?: string
          product_id: string
          sale_price: number
          sku: string
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_cost?: number
          low_stock_threshold?: number
          name?: string
          product_id?: string
          sale_price?: number
          sku?: string
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          category_id: string | null
          cost: number
          created_at: string
          description: string
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          price: number
          public_description: string
          published: boolean
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          price: number
          public_description?: string
          published?: boolean
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number
          public_description?: string
          published?: boolean
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_option_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_product_stock: {
        Args: { p_delta?: number; p_stock?: number; p_variant_id: string }
        Returns: undefined
      }
      cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      create_category: { Args: { p_name: string }; Returns: string }
      create_option_type: { Args: { p_name: string }; Returns: string }
      create_option_value: {
        Args: { p_name: string; p_option_type_id: string }
        Returns: string
      }
      create_order: {
        Args: { p_client_id: string; p_items: Json; p_payment_status?: string }
        Returns: string
      }
      create_variant: {
        Args: {
          p_inventory_cost: number
          p_option_value_ids?: string[]
          p_product_id: string
          p_sale_price: number
          p_sku: string
          p_stock: number
          p_variant_name: string
        }
        Returns: string
      }
      delete_category: { Args: { p_category_id: string }; Returns: undefined }
      delete_option_type: {
        Args: { p_option_type_id: string }
        Returns: undefined
      }
      delete_variant: { Args: { p_variant_id: string }; Returns: undefined }
      get_public_catalog: {
        Args: { p_slug: string }
        Returns: {
          business_name: string
          currency: string
          products: Json
          public_intro: string
          whatsapp_number: string
        }[]
      }
      inventory_aggregates: {
        Args: never
        Returns: {
          cost_total: number
          profit_total: number
          sale_total: number
        }[]
      }
      sales_aggregates: {
        Args: { p_period?: string }
        Returns: {
          label: string
          orders: number
          total: number
        }[]
      }
      update_order_payment: {
        Args: { p_order_id: string; p_payment_status: string }
        Returns: undefined
      }
      update_order_status: {
        Args: { p_order_id: string; p_status: string }
        Returns: undefined
      }
      update_product_atomic: {
        Args: {
          p_category_id: string
          p_image_url?: string
          p_inventory_cost?: number
          p_name: string
          p_product_id: string
          p_public_description?: string
          p_published?: boolean
          p_sale_price?: number
          p_sku?: string
          p_stock?: number
          p_variant_name?: string
        }
        Returns: undefined
      }
      update_variant: {
        Args: {
          p_inventory_cost: number
          p_option_value_ids?: string[]
          p_sale_price: number
          p_sku: string
          p_stock: number
          p_variant_id: string
          p_variant_name: string
        }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
