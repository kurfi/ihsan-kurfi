import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Truck {
  id: string;
  plate_number: string;
  model: string | null;
  capacity_tons: number | null;
  is_active: boolean;
  created_at: string;
  chassis_number: string | null;
  truck_type: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  current_mileage: number | null;
  service_interval_km: number | null;
  driver_id: string | null;
  default_fuel_cost: number | null;
  driver?: Driver | null;
}

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  next_of_kin: string | null;
  next_of_kin_phone: string | null;
  address: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  guarantor_address: string | null;
  license_number: string | null;
  license_class: string | null;
  standard_allowance: number | null;
  accident_count: number | null;
  successful_deliveries: number | null;
  total_deliveries: number | null;
}

export interface DriverTransaction {
  id: string;
  driver_id: string | null;
  order_id: string | null;
  type: "shortage_deduction" | "allowance" | "salary_payment" | "bonus" | "deposit" | null;
  amount: number | null;
  description: string | null;
  transaction_date: string | null;
  created_at: string | null;
}

export function useTrucks() {
  return useQuery({
    queryKey: ["trucks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trucks")
        .select("*, driver:drivers(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as Truck[];
    },
  });
}

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as Driver[];
    },
  });
}

export function useAddTruck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (truck: Partial<Omit<Truck, "id" | "created_at">> & { plate_number: string }) => {
      const { plate_number, ...rest } = truck;
      const { data, error } = await supabase
        .from("trucks")
        .insert({
          ...rest,
          number_plate: plate_number,
          truck_type: truck.truck_type || "Other"
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast({ title: "Truck added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add truck", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTruck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Truck> & { id: string }) => {
      const { plate_number, ...rest } = updates;
      const updatePayload: any = { ...rest };
      if (plate_number) updatePayload.number_plate = plate_number;

      const { data, error } = await supabase
        .from("trucks")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast({ title: "Truck updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update truck", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (driver: Partial<Omit<Driver, "id" | "created_at">> & { name: string }) => {
      const { data, error } = await supabase
        .from("drivers")
        .insert(driver as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Driver added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add driver", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Driver> & { id: string }) => {
      const { data, error } = await supabase
        .from("drivers")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Driver updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update driver", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTruck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("trucks")
        .update({ status: "Inactive" } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast({ title: "Truck deactivated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to deactivate truck", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("drivers")
        .update({ status: "Inactive" } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Driver deactivated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to deactivate driver", description: error.message, variant: "destructive" });
    },
  });
}

export function useDriverTransactions(driverId?: string) {
  return useQuery({
    queryKey: ["driver_transactions", driverId],
    queryFn: async () => {
      let query = supabase
        .from("driver_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (driverId) {
        query = query.eq("driver_id", driverId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DriverTransaction[];
    },
    enabled: !!driverId || driverId === undefined
  });
}

export function useAddDriverTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: Partial<Omit<DriverTransaction, "id" | "created_at">>) => {
      const { data, error } = await supabase
        .from("driver_transactions")
        .insert(transaction as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driver_transactions"] });
      if (variables.driver_id) {
        queryClient.invalidateQueries({ queryKey: ["driver_transactions", variables.driver_id] });
      }
      toast({ title: "Transaction added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add transaction", description: error.message, variant: "destructive" });
    },
  });
}
