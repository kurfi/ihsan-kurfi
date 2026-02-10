import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReconciliationInput {
    orderId: string;
    otp: string;
    qtyGood: number;
    qtyMissing: number;
    qtyDamaged: number;
    reason?: string;
}

/**
 * Hook for processing delivery reconciliation via atomic database RPC.
 * This ensures all steps (shortage, driver deduction, credit note) succeed or fail together.
 */
export function useReconciliation() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (input: ReconciliationInput) => {
            console.log("Processing delivery reconciliation with input:", input);

            const { data, error } = await supabase.rpc("process_delivery_reconciliation", {
                p_order_id: input.orderId,
                p_otp: input.otp,
                p_qty_good: Number(input.qtyGood),
                p_qty_missing: Number(input.qtyMissing),
                p_qty_damaged: Number(input.qtyDamaged),
                p_reason: input.reason || null,
            });

            if (error) throw error;

            const result = data as { success: boolean; message: string };
            if (!result.success) {
                throw new Error(result.message);
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["shortages"] });
            queryClient.invalidateQueries({ queryKey: ["driver_transactions"] });
            toast({ title: "Order delivered and reconciled successfully" });
        },
        onError: (error) => {
            toast({
                title: "Reconciliation failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}
