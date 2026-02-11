import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Depot {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  depot_id: string;
  cement_type: string;
  quantity: number;
  unit: "tons" | "bags";
  cost_price_ton?: number;
  selling_price_ton?: number;
  cost_price_bag?: number;
  selling_price_bag?: number;
  last_updated: string;
  depot?: { name: string; address: string | null };
}

export function useDepots() {
  return useQuery({
    queryKey: ["depots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depots")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Depot[];
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          depot:depots(name, address)
        `)
        .order("depot_id");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data, error } = await supabase
        .from("inventory")
        .update({ quantity, last_updated: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as InventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Product updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddDepot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (depot: { name: string; address?: string }) => {
      const { data, error } = await supabase
        .from("depots")
        .insert(depot)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depots"] });
      toast({ title: "Depot added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add depot", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDepot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("depots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depots"] });
      toast({ title: "Depot deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete depot", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "last_updated" | "depot">) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Product added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add product", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory")
        .update({ ...updates, last_updated: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Product updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    },
  });
}
