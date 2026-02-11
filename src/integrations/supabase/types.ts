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
      credit_notes: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          id: string
          order_id: string
          quantity_damaged: number
          reason: string | null
          status: string
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Insert: {
          amount?: number
          created_at?: string | null
          customer_id: string
          id?: string
          order_id: string
          quantity_damaged?: number
          reason?: string | null
          status?: string
          unit?: Database["public"]["Enums"]["product_unit"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          order_id?: string
          quantity_damaged?: number
          reason?: string | null
          status?: string
          unit?: Database["public"]["Enums"]["product_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_aging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          address: string
          category: string
          created_at: string | null
          credit_limit: number
          current_balance: number
          email: string | null
          id: string
          is_blocked: boolean | null
          name: string
          notes: string | null
          phone: string | null
          price_per_bag: number | null
          price_tier: Database["public"]["Enums"]["price_tier_type"]
        }
        Insert: {
          address: string
          category: string
          created_at?: string | null
          credit_limit?: number
          current_balance?: number
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          price_per_bag?: number | null
          price_tier?: Database["public"]["Enums"]["price_tier_type"]
        }
        Update: {
          address?: string
          category?: string
          created_at?: string | null
          credit_limit?: number
          current_balance?: number
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          price_per_bag?: number | null
          price_tier?: Database["public"]["Enums"]["price_tier_type"]
        }
        Relationships: []
      }
      depots: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          manager_name: string | null
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          manager_name?: string | null
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          manager_name?: string | null
          name?: string
        }
        Relationships: []
      }
      driver_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          driver_id: string
          id: string
          order_id: string | null
          transaction_date: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          driver_id: string
          id?: string
          order_id?: string | null
          transaction_date?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          driver_id?: string
          id?: string
          order_id?: string | null
          transaction_date?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_transactions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      drivers: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          license_number: string | null
          name: string
          phone: string | null
          wallet_balance: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          name: string
          phone?: string | null
          wallet_balance?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          name?: string
          phone?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          expense_type: string
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          truck_id: string | null
          category: Database["public"]["Enums"]["expense_category"] | null
        }
        Insert: {
          amount: number
          expense_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          truck_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"] | null
        }
        Update: {
          amount?: number
          expense_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          truck_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"] | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }

      fleet_availability: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          notes: string | null
          truck_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          truck_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_availability_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          }
        ]
      }
      haulage_payments: {
        Row: {
          amount_received: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_reference: string | null
          period_covered: string | null
        }
        Insert: {
          amount_received?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_reference?: string | null
          period_covered?: string | null
        }
        Update: {
          amount_received?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_reference?: string | null
          period_covered?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          cement_type: string
          created_at: string | null
          depot_id: string
          id: string
          last_updated: string | null
          price_end_user: number | null
          price_retail: number | null
          price_wholesale: number | null
          quantity: number
          quantity_reserved: number | null
          sale_price: number | null
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Insert: {
          cement_type: string
          created_at?: string | null
          depot_id: string
          id?: string
          last_updated?: string | null
          price_end_user?: number | null
          price_retail?: number | null
          price_wholesale?: number | null
          quantity?: number
          quantity_reserved?: number | null
          sale_price?: number | null
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Update: {
          cement_type?: string
          created_at?: string | null
          depot_id?: string
          id?: string
          last_updated?: string | null
          price_end_user?: number | null
          price_retail?: number | null
          price_wholesale?: number | null
          quantity?: number
          quantity_reserved?: number | null
          sale_price?: number | null
          unit?: Database["public"]["Enums"]["product_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          }
        ]
      }
      manufacturer_wallets: {
        Row: {
          balance: number | null
          cement_type: string
          created_at: string | null
          id: string
          supplier_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          cement_type: string
          created_at?: string | null
          id?: string
          supplier_id: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          cement_type?: string
          created_at?: string | null
          id?: string
          supplier_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_wallets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          cap_number: string | null
          cement_type: string
          cost_price: number | null
          created_at: string | null
          customer_id: string
          delivery_address: string | null
          delivery_otp: string | null
          depot_id: string | null
          driver_id: string | null
          gate_pass_number: string | null
          id: string
          is_direct_drop: boolean | null
          loading_manifest_number: string | null
          notes: string | null
          order_number: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          payment_status: string | null
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string | null
          total_amount: number | null
          trip_profit: number | null
          truck_id: string | null
          unit: Database["public"]["Enums"]["product_unit"]
          waybill_url: string | null
          waybill_number: string | null
          fuel_cost: number | null
          driver_allowance: number | null
          other_trip_costs: number | null
          sales_price_per_unit: number | null
          atc_number: string | null
        }
        Insert: {
          cap_number?: string | null
          cement_type: string
          cost_price?: number | null
          created_at?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_otp?: string | null
          depot_id?: string | null
          driver_id?: string | null
          gate_pass_number?: string | null
          id?: string
          is_direct_drop?: boolean | null
          loading_manifest_number?: string | null
          notes?: string | null
          order_number?: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          payment_status?: string | null
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string | null
          total_amount?: number | null
          transport_cost?: number | null
          trip_profit?: number | null
          truck_id?: string | null
          unit: Database["public"]["Enums"]["product_unit"]
          waybill_url?: string | null
          waybill_number?: string | null
          fuel_cost?: number | null
          driver_allowance?: number | null
          other_trip_costs?: number | null
          sales_price_per_unit?: number | null
          atc_number?: string | null
        }
        Update: {
          cap_number?: string | null
          cement_type?: string
          cost_price?: number | null
          created_at?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_otp?: string | null
          depot_id?: string | null
          driver_id?: string | null
          gate_pass_number?: string | null
          id?: string
          is_direct_drop?: boolean | null
          loading_manifest_number?: string | null
          notes?: string | null
          order_number?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          payment_status?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string | null
          total_amount?: number | null
          transport_cost?: number | null
          trip_profit?: number | null
          truck_id?: string | null
          unit?: Database["public"]["Enums"]["product_unit"]
          waybill_url?: string | null
          waybill_number?: string | null
          fuel_cost?: number | null
          driver_allowance?: number | null
          other_trip_costs?: number | null
          sales_price_per_unit?: number | null
          atc_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_aging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_accounts: {
        Row: {
          account_name: string
          account_number: string
          active: boolean | null
          bank_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          account_name: string
          account_number: string
          active?: boolean | null
          bank_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          account_name?: string
          account_number?: string
          active?: boolean | null
          bank_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          order_id: string | null
          payment_account_id: string | null
          payment_date: string | null
          payment_method: string
          receipt_url: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status_type"] | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_account_id?: string | null
          payment_date?: string | null
          payment_method: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status_type"] | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_account_id?: string | null
          payment_date?: string | null
          payment_method?: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_aging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          }
        ]
      }

      purchases: {
        Row: {
          atc_number: string | null
          cap_number: string | null
          cement_type: string
          cost_per_unit: number | null
          created_at: string | null
          date: string | null
          destination_depot_id: string | null
          id: string
          is_direct_delivery: boolean | null
          linked_customer_order_id: string | null
          purchase_number: string | null
          quantity: number
          sales_order_id: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          supplier_id: string | null
          supplier_name: string
          total_cost: number
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Insert: {
          atc_number?: string | null
          cap_number?: string | null
          cement_type: string
          cost_per_unit?: number | null
          created_at?: string | null
          date?: string | null
          destination_depot_id?: string | null
          id?: string
          is_direct_delivery?: boolean | null
          linked_customer_order_id?: string | null
          purchase_number?: string | null
          quantity: number
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          supplier_name: string
          total_cost: number
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Update: {
          atc_number?: string | null
          cap_number?: string | null
          cement_type?: string
          cost_per_unit?: number | null
          created_at?: string | null
          date?: string | null
          destination_depot_id?: string | null
          id?: string
          is_direct_delivery?: boolean | null
          linked_customer_order_id?: string | null
          purchase_number?: string | null
          quantity?: number
          sales_order_id?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          supplier_name?: string
          total_cost?: number
          unit?: Database["public"]["Enums"]["product_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "purchases_destination_depot_id_fkey"
            columns: ["destination_depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_linked_customer_order_id_fkey"
            columns: ["linked_customer_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      shortages: {
        Row: {
          created_at: string | null
          deduction_amount: number | null
          dispatched_quantity: number | null
          driver_id: string | null
          id: string
          liability: Database["public"]["Enums"]["shortage_liability"] | null
          order_id: string | null
          reason: string | null
          received_quantity: number | null
          shortage_quantity: number | null
          status: Database["public"]["Enums"]["shortage_status"] | null
          truck_id: string | null
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Insert: {
          created_at?: string | null
          deduction_amount?: number | null
          dispatched_quantity?: number | null
          driver_id?: string | null
          id?: string
          liability?: Database["public"]["Enums"]["shortage_liability"] | null
          order_id?: string | null
          reason?: string | null
          received_quantity?: number | null
          shortage_quantity?: number | null
          status?: Database["public"]["Enums"]["shortage_status"] | null
          truck_id?: string | null
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Update: {
          created_at?: string | null
          deduction_amount?: number | null
          dispatched_quantity?: number | null
          driver_id?: string | null
          id?: string
          liability?: Database["public"]["Enums"]["shortage_liability"] | null
          order_id?: string | null
          reason?: string | null
          received_quantity?: number | null
          shortage_quantity?: number | null
          status?: Database["public"]["Enums"]["shortage_status"] | null
          truck_id?: string | null
          unit: Database["public"]["Enums"]["product_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "shortages_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortages_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          address: string
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
        }
        Insert: {
          address: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
        }
        Relationships: []
      }
      trucks: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string
          number_plate: string
          status: string | null
          truck_type: string
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          number_plate: string
          status?: string | null
          truck_type: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          number_plate?: string
          status?: string | null
          truck_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trucks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          }
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          related_order_id: string | null
          status: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_order_id?: string | null
          status?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_order_id?: string | null
          status?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_wallets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      customer_aging: {
        Row: {
          id: string | null
          name: string | null
          current_balance: number | null
          credit_limit: number | null
          current_0_30: number | null
          days_31_60: number | null
          days_61_90: number | null
          over_90_days: number | null
        }
        Relationships: []
      }
      dual_stream_profitability: {
        Row: {
          id: string | null
          order_number: string | null
          waybill_number: string | null
          created_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          quantity: number | null
          unit: Database["public"]["Enums"]["product_unit"] | null
          customer_name: string | null
          haulage_revenue: number | null
          haulage_costs: number | null
          haulage_profit: number | null
          trading_revenue: number | null
          trading_costs: number | null
          trading_profit: number | null
          total_revenue: number | null
          total_costs: number | null
          total_profit: number | null
        }
        Relationships: []
      }
      expiring_documents: {
        Row: {
          id: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          entity_type: string | null
          entity_id: string | null
          document_number: string | null
          issue_date: string | null
          expiry_date: string | null
          created_at: string | null
          entity_name: string | null
          days_until_expiry: number | null
          status: string | null
        }
        Relationships: []
      }
      fleet_availability: {
        Row: {
          id: string | null
          plate_number: string | null
          model: string | null
          capacity_tons: number | null
          is_active: boolean | null
          availability_status: string | null
          expired_doc_count: number | null
        }
        Relationships: []
      }
      monthly_profit_loss: {
        Row: {
          month: string | null
          haulage_revenue: number | null
          cement_sales: number | null
          cement_purchases: number | null
          trip_costs: number | null
          other_expenses: number | null
          total_revenue: number | null
          total_costs: number | null
          net_profit: number | null
          trip_count: number | null
          total_quantity: number | null
        }
        Relationships: []
      }
      order_balances: {
        Row: {
          order_id: string | null
          order_number: string | null
          customer_id: string | null
          total_amount: number | null
          total_paid: number | null
          balance: number | null
          is_settled: boolean | null
        }
        Relationships: []
      }
      receivables_aging: {
        Row: {
          customer_name: string | null
          customer_id: string | null
          total_owed: number | null
          oldest_invoice_date: string | null
          aging_bucket: string | null
          days_outstanding: number | null
        }
        Relationships: []
      }
      transit_shipments: {
        Row: {
          id: string | null
          order_number: string | null
          customer_id: string | null
          order_type: Database["public"]["Enums"]["order_type"] | null
          depot_id: string | null
          truck_id: string | null
          driver_id: string | null
          cement_type: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
          delivery_address: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          dispatch_date: string | null
          delivery_date: string | null
          estimated_delivery_date: string | null
          carrier_name: string | null
          carrier_contact: string | null
          tracking_number: string | null
          cap_number: string | null
          gate_pass_number: string | null
          waybill_url: string | null
          loading_manifest_number: string | null
          cost_price: number | null
          delivery_otp: string | null
          unit: Database["public"]["Enums"]["product_unit"] | null
          customer_name: string | null
          customer_phone: string | null
          customer_address: string | null
          plate_number: string | null
          truck_model: string | null
          driver_name: string | null
          driver_phone: string | null
          depot_name: string | null
          depot_location: string | null
          estimated_hours: number | null
          hours_in_transit: number | null
          transit_status: string | null
        }
        Relationships: []
      }
      trip_profitability: {
        Row: {
          id: string | null
          order_number: string | null
          created_at: string | null
          revenue: number | null
          total_expenses: number | null
          net_profit: number | null
          profit_margin_percent: number | null
          truck_id: string | null
          plate_number: string | null
          driver_id: string | null
          driver_name: string | null
        }
        Relationships: []
      }
      trip_profitability_detailed: {
        Row: {
          id: string | null
          order_number: string | null
          created_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          customer_name: string | null
          cement_type: string | null
          quantity: number | null
          unit: Database["public"]["Enums"]["product_unit"] | null
          cement_sale_price: number | null
          total_cement_sale: number | null
          cement_purchase_price: number | null
          total_cement_purchase: number | null
          fuel_cost: number | null
          driver_allowance: number | null
          other_trip_costs: number | null
          total_trip_cost: number | null
          cement_profit: number | null
          cement_margin_percent: number | null
          total_trip_profit: number | null
          payment_status: Database["public"]["Enums"]["payment_status_type"] | null
          payment_terms: string | null
        }
        Relationships: []
      }
      trip_profitability_v2: {
        Row: {
          id: string | null
          order_number: string | null
          created_at: string | null
          quantity: number | null
          unit: Database["public"]["Enums"]["product_unit"] | null
          total_sale: number | null
          total_purchase: number | null
          cement_profit: number | null
          fuel_cost: number | null
          driver_allowance: number | null
          other_trip_costs: number | null
          total_logistics_cost: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_customer_aging: {
        Args: {
          p_customer_id: string
        }
        Returns: Json
      }
      get_monthly_revenue: {
        Args: {
          year_input: number
          month_input: number
        }
        Returns: number
      }
      process_delivery_reconciliation: {
        Args: {
          p_order_id: string
          p_otp: string
          p_qty_good: number
          p_qty_missing: number
          p_qty_damaged: number
          p_reason?: string
        }
        Returns: Json
      }
    }
    Enums: {
      document_type:
      | "license"
      | "insurance"
      | "road_worthiness"
      | "hackney_permit"
      | "heavy_duty_permit"
      | "vehicle_registration"
      expense_category:
      | "fuel"
      | "driver_allowance"
      | "toll"
      | "salary"
      | "maintenance"
      | "insurance"
      | "license"
      | "office"
      | "other"
      order_status:
      | "requested"
      | "in_gate"
      | "loaded"
      | "dispatched"
      | "delivered"
      order_type: "plant_direct" | "depot_dispatch"
      payment_status_type: "Pending" | "Confirmed" | "Rejected"
      price_tier_type: "Wholesaler" | "Retailer" | "End-User"
      product_unit: "tons" | "bags"
      purchase_status: "ordered" | "received" | "cancelled"
      shortage_liability: "driver" | "company"
      shortage_status: "pending" | "approved" | "deducted"
      transaction_type:
      | "shortage_deduction"
      | "allowance"
      | "salary_payment"
      | "bonus"
      | "deposit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      document_type: [
        "license",
        "insurance",
        "road_worthiness",
        "hackney_permit",
        "heavy_duty_permit",
        "vehicle_registration",
      ],
      expense_category: [
        "fuel",
        "driver_allowance",
        "toll",
        "salary",
        "maintenance",
        "insurance",
        "license",
        "office",
        "other",
      ],
      order_status: [
        "requested",
        "in_gate",
        "loaded",
        "dispatched",
        "delivered",
      ],
      order_type: ["plant_direct", "depot_dispatch"],
      payment_status_type: ["Pending", "Confirmed", "Rejected"],
      price_tier_type: ["Wholesaler", "Retailer", "End-User"],
      product_unit: ["tons", "bags"],
      purchase_status: ["ordered", "received", "cancelled"],
      shortage_liability: ["driver", "company"],
      shortage_status: ["pending", "approved", "deducted"],
      transaction_type: [
        "shortage_deduction",
        "allowance",
        "salary_payment",
        "bonus",
        "deposit",
      ],
    },
  },
} as const
