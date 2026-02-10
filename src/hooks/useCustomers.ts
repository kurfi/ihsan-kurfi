import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  category: string | null;
  is_blocked: boolean | null;
  price_tier: "Wholesaler" | "Retailer" | "End-User" | null;
  created_at: string;
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add customer", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update customer", description: error.message, variant: "destructive" });
    },
  });
}

export function useToggleCustomerBlock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_blocked }: { id: string; is_blocked: boolean }) => {
      const { data, error } = await supabase
        .from("customers")
        .update({ is_blocked })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: data.is_blocked ? "Customer blocked" : "Customer unblocked" });
    },
    onError: (error) => {
      toast({ title: "Failed to update customer", description: error.message, variant: "destructive" });
    },
  });
}
