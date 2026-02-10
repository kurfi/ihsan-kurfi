import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type HaulagePayment = Database["public"]["Tables"]["haulage_payments"]["Row"];

export function useTrips() {
    return useQuery({
        queryKey: ["trips"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          customers(name),
          trucks(number_plate),
          drivers(name)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });
}

export function useHaulagePayments() {
    return useQuery({
        queryKey: ["haulage_payments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("haulage_payments")
                .select("*")
                .order("payment_date", { ascending: false });

            if (error) throw error;
            return data as HaulagePayment[];
        },
    });
}

export function useAddHaulagePayment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (payment: Omit<HaulagePayment, "id" | "created_at">) => {
            const { data, error } = await supabase
                .from("haulage_payments")
                .insert(payment)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["haulage_payments"] });
            toast({ title: "Haulage payment recorded" });
        },
        onError: (error: any) => {
            toast({
                title: "Error Recording Payment",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}

export function useTripProfitability() {
    return useQuery({
        queryKey: ["trip_profitability"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("trip_profitability_v2")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });
}

// Hook to update trip details (fuel, allowance, etc)
export function useUpdateTrip() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Order> }) => {
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
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            queryClient.invalidateQueries({ queryKey: ["trip_profitability"] });
            toast({ title: "Trip updated successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        },
    });
}
