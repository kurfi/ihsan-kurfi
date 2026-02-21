import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

export type OrderType = Database["public"]["Enums"]["order_type"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type ProductUnit = Database["public"]["Enums"]["product_unit"];

export interface Order {
  id: string;
  order_number: string | null;
  customer_id: string | null;
  order_type: OrderType;
  depot_id: string | null;
  truck_id: string | null;
  driver_id: string | null;
  cement_type: string;
  quantity: number;
  unit: ProductUnit;
  atc_number: string | null;
  cap_number: string | null;
  gate_pass_number: string | null;
  loading_manifest_number: string | null;
  waybill_url: string | null;
  delivery_otp: string | null;
  status: OrderStatus;
  total_amount: number | null;
  payment_status: string | null;
  cost_price: number | null;
  trip_profit: number | null;
  is_direct_drop: boolean | null;
  delivery_address: string | null;
  notes: string | null;
  waybill_number: string | null;
  fuel_cost: number | null;
  driver_allowance: number | null;
  other_trip_costs: number | null;
  sales_price_per_unit: number | null;
  transport_cost: number | null;
  // Dual Business Model Fields
  cement_purchase_price: number | null;
  cement_sale_price: number | null;
  total_cement_purchase: number | null;
  total_cement_sale: number | null;
  cement_profit: number | null;
  cement_margin_percent: number | null;
  payment_terms: string | null;
  total_trip_cost: number | null;
  created_at: string;
  updated_at: string;
  customer?: { name: string } | null;
  depot?: { name: string } | null;
  truck?: { plate_number: string; capacity_tons: number | null } | null;
  driver?: { name: string; phone: string | null } | null;
  purchases?: Array<{ atc_number: string | null; cap_number: string | null }> | null;
}

export function useOrders(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, enabled]);

  return useQuery({
    queryKey: ["orders"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name),
          depot:depots(name),
          truck:trucks(plate_number, capacity_tons),
          driver:drivers(name, phone),
          purchases:purchases!sales_order_id(atc_number, cap_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Order[];
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: {
      customer_id: string;
      order_type: OrderType;
      depot_id?: string;
      cement_type: string;
      quantity: number;
      unit?: ProductUnit;
      delivery_address?: string;
      notes?: string;
      supplier_id?: string;
      total_amount?: number;
      is_direct_drop?: boolean;
      transport_cost?: number;
      waybill_number?: string;
      fuel_cost?: number;
      driver_allowance?: number;
      other_trip_costs?: number;
      sales_price_per_unit?: number;
      cement_purchase_price?: number;
      cement_sale_price?: number;
      payment_terms?: string;
      atc_number?: string;
      cap_number?: string;
    }) => {
      // We process the order directly.
      if (!order.depot_id) throw new Error("Product Source is required");

      // 2. Create Order
      const { transport_cost, ...orderData } = order;

      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          ...orderData,
          unit: orderData.unit || "bags"
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // 2b. Create Transport Expense Logic
      if (transport_cost && transport_cost > 0) {
        const { error: expenseError } = await supabase
          .from("expenses")
          .insert({
            order_id: newOrder.id,
            expense_type: "transport",
            amount: transport_cost,
            description: `Transport cost for Order ${newOrder.order_number}`
          });

        if (expenseError) {
          console.error("Failed to create transport expense", expenseError);
          toast({
            title: "Warning",
            description: "Order created but failed to record transport cost: " + expenseError.message,
            variant: "destructive"
          });
        }
      }

      // 3. Plant Direct Logic - REMOVED, all orders are now universally sourced

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Order created successfully" });
    },
    onError: (error) => {
      console.error("Order creation error:", error);
      let message = error.message;
      if (error.message === "Failed to fetch" || error.message.includes("network") || error.message.includes("connection")) {
        message = "Network error: Could not connect to the database. Please check your internet connection and ensure no extensions (like ad blockers or VPNs) are blocking the request.";
      }
      toast({
        title: "Failed to create order",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    },
  });
}

export function useConfirmDispatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // We now rely on the database trigger `tr_inventory_on_dispatch` to handle deduction.
      // We just need to set the status to 'dispatched'.
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "dispatched" })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order dispatched (product stock updated via system trigger)" });
    },
    onError: (error) => {
      toast({ title: "Failed to dispatch order", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, truck_id, driver_id, delivery_otp, fuel_cost, driver_allowance }: {
      id: string;
      status: OrderStatus;
      truck_id?: string;
      driver_id?: string;
      delivery_otp?: string;
      fuel_cost?: number;
      driver_allowance?: number;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (truck_id) updateData.truck_id = truck_id;
      if (driver_id) updateData.driver_id = driver_id;
      if (delivery_otp) updateData.delivery_otp = delivery_otp;
      if (fuel_cost !== undefined) updateData.fuel_cost = fuel_cost;
      if (driver_allowance !== undefined) updateData.driver_allowance = driver_allowance;

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (newStatusData) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData<Order[]>(["orders"]);

      queryClient.setQueryData<Order[]>(["orders"], (old) =>
        old?.map((order) =>
          order.id === newStatusData.id
            ? { ...order, ...newStatusData, status: newStatusData.status }
            : order
        )
      );

      return { previousOrders };
    },
    onError: (error, _newStatus, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
      toast({ title: "Failed to update order", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onSuccess: () => {
      toast({ title: "Order updated successfully" });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      gate_pass_number?: string;
      loading_manifest_number?: string;
      waybill_url?: string;
      quantity?: number;
      unit?: ProductUnit;
      total_amount?: number;
      depot_id?: string;
      cement_type?: string;
      is_direct_drop?: boolean;
      transport_cost?: number;
      delivery_address?: string;
      notes?: string;
      waybill_number?: string;
      fuel_cost?: number;
      driver_allowance?: number;
      other_trip_costs?: number;
      sales_price_per_unit?: number;
      cement_purchase_price?: number;
      cement_sale_price?: number;
      payment_terms?: string;
      atc_number?: string;
      cap_number?: string;
    }) => {
      // 1. Update Order fields (including transport_cost)
      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update order", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: Order) => {
      // 1. Rollback reservation - REMOVED for Dropshipping
      /*
      if (order.order_type === "depot_dispatch" && order.depot_id && order.status === "requested") {
        await supabase.rpc("release_reservation", {
          p_depot_id: order.depot_id,
          p_cement_type: order.cement_type,
          p_quantity: order.quantity,
          p_unit: order.unit
        });
      }
      */

      // 2. Delete linked purchase if plant direct (legacy check)
      if (order.order_type === "plant_direct") {
        await supabase
          .from("purchases")
          .delete()
          .eq("sales_order_id", order.id);
      }

      // 3. Delete linked records (expenses, payments, etc.) that might block deletion
      // Constraints found earlier: expenses, payments, shortages, driver_transactions
      await supabase.from("expenses").delete().eq("order_id", order.id);
      await supabase.from("payments").delete().eq("order_id", order.id);
      await supabase.from("shortages").delete().eq("order_id", order.id);
      await supabase.from("driver_transactions").delete().eq("order_id", order.id);
      await supabase.from("credit_notes").delete().eq("order_id", order.id);

      // 4. Delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order deleted successfully" });
    },
    onError: (error) => {
      console.error("Order deletion error:", error);
      toast({ title: "Failed to delete order", description: error.message, variant: "destructive" });
    },
  });
}

export function useReassignFleet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, truckId, driverId }: {
      orderId: string;
      truckId: string;
      driverId: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({
          truck_id: truckId,
          driver_id: driverId
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Fleet re-assigned successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to re-assign fleet", description: error.message, variant: "destructive" });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status: "Confirmed" })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Payment confirmed successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to confirm payment", description: error.message, variant: "destructive" });
    },
  });
}

export function usePaginatedOrders(page: number, limit: number, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("paginated-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, enabled]);

  return useQuery({
    queryKey: ["orders", "paginated", page, limit],
    enabled,
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name),
          depot:depots(name),
          truck:trucks(plate_number, capacity_tons),
          driver:drivers(name, phone),
          purchases:purchases!sales_order_id(atc_number, cap_number)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { orders: data as unknown as Order[], count: count || 0 };
    },
  });
}

export function useOrdersMetrics(enabled = true) {
  return useQuery({
    queryKey: ["orders-metrics"],
    enabled,
    queryFn: async () => {
      // Fech minimal data for aggregation
      const { data: statusData, error: statusError } = await supabase
        .from("orders")
        .select("status");

      if (statusError) throw statusError;

      const counts: Record<string, number> = {
        requested: 0,
        dispatched: 0,
        delivered: 0,
      };

      statusData.forEach(row => {
        const status = row.status as string;
        if (status in counts) {
          counts[status]++;
        } else {
          counts[status] = 1;
        }
      });

      const { data: busyTruckData, error: busyError } = await supabase
        .from("orders")
        .select("truck_id")
        .neq("status", "delivered")
        .not("truck_id", "is", null);

      if (busyError) throw busyError;

      const busyTruckIds = Array.from(new Set(busyTruckData.map(r => r.truck_id).filter(Boolean))) as string[];

      return { counts, busyTruckIds };
    }
  });
}

export function useDashboardOrderMetrics() {
  return useQuery({
    queryKey: ["dashboard-order-metrics"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const { count: ordersToday, error: error1 } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", todayStr);

      if (error1) throw error1;

      const { count: deliveredToday, error: error2 } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("status", "delivered")
        .gte("updated_at", todayStr);

      if (error2) throw error2;

      return {
        ordersToday: ordersToday || 0,
        deliveredToday: deliveredToday || 0
      };
    }
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ["recent-orders", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, created_at, quantity, unit, total_amount, status,
          customer:customers(name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as Order[];
    }
  });
}
