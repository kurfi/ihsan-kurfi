import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"] & {
    suppliers: Supplier | null;
    depots: { name: string } | null;
    is_direct_delivery?: boolean | null;
    linked_customer_order_id?: string | null;
    atc_number?: string | null;
    cap_number?: string | null;
};

export function useSuppliers() {
    return useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("suppliers")
                .select("*")
                .order("name");

            if (error) throw error;
            return data as Supplier[];
        },
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (newSupplier: Database["public"]["Tables"]["suppliers"]["Insert"]) => {
            const { data, error } = await supabase
                .from("suppliers")
                .insert(newSupplier)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast({ title: "Manufacturer added successfully" });
        },
        onError: (error) => {
            toast({
                title: "Failed to add manufacturer",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
            const { data, error } = await supabase
                .from("suppliers")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast({ title: "Manufacturer updated successfully" });
        },
        onError: (error) => {
            toast({
                title: "Failed to update manufacturer",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("suppliers")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast({ title: "Manufacturer deleted successfully" });
        },
        onError: (error) => {
            toast({
                title: "Failed to delete manufacturer",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function usePurchases() {
    return useQuery({
        queryKey: ["purchases"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("purchases")
                .select(`
                    *,
                    suppliers (*),
                    depots (name)
                `)
                .order("date", { ascending: false });

            if (error) {
                console.error("Error fetching purchases:", error);
                throw error;
            }
            return data as unknown as Purchase[];
        },
    });
}

export function useCreatePurchase() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (newPurchase: unknown) => {
            const { data, error } = await supabase
                .from("purchases")
                .insert(newPurchase as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            toast({ title: "Purchase order created" });
        },
        onError: (error) => {
            toast({
                title: "Failed to create purchase",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useUpdatePurchase() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Database["public"]["Tables"]["purchases"]["Row"]> & { id: string }) => {
            const { data, error } = await supabase
                .from("purchases")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            toast({ title: "Purchase order updated" });
        },
        onError: (error) => {
            toast({
                title: "Failed to update purchase order",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useDeletePurchase() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("purchases")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            toast({ title: "Purchase order deleted" });
        },
        onError: (error) => {
            toast({
                title: "Failed to delete purchase order",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useReceiveStock() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ purchaseId, depotId, quantity, unit, cementType, isDirectDelivery, linkedCustomerOrderId }: {
            purchaseId: string;
            depotId: string | null;
            quantity: number;
            unit: "tons" | "bags";
            cementType: string;
            isDirectDelivery?: boolean;
            linkedCustomerOrderId?: string | null;
        }) => {
            // 1. Update purchase status
            const { error: purchaseError } = await supabase
                .from("purchases")
                .update({ status: "received" })
                .eq("id", purchaseId);

            if (purchaseError) throw purchaseError;

            // 2. Direct Delivery logic - Keep this for tracking
            if (isDirectDelivery && linkedCustomerOrderId) {
                // Mark customer order as delivered (or at least acknowledge manufacturer handoff)
                // For dropshipping, "Received" from Supplier usually means "On its way" to customer or "Delivered" depending on process.
                // Let's keep it as is or maybe just log it.
                // The main thing is to NOT update local inventory.
            }

            // REMOVED INVENTORY UPDATES FOR DROPSHIPPING MODEL
            // We no longer track Depot Inventory quantities.
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast({ title: "Stock received successfully" });
        },
        onError: (error) => {
            toast({
                title: "Failed to receive stock",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useWallets() {
    return useQuery({
        queryKey: ["manufacturer_wallets"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("manufacturer_wallets")
                .select(`
                    *,
                    suppliers (name)
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });
}

export function useAddWalletTransaction() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (transaction: unknown) => {
            const { data, error } = await (supabase
                .from("wallet_transactions" as any) as any)
                .insert(transaction as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["manufacturer_wallets"] });
            toast({ title: "Transaction recorded successfully" });
        },
        onError: (error) => {
            toast({
                title: "Failed to record transaction",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

