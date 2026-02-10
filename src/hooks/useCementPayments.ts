import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface CementPaymentToDangote {
    id: string;
    supplier_id?: string;
    payment_date: string;
    amount_paid: number;
    payment_reference?: string;
    period_covered?: string;
    payment_method?: string;
    payment_type?: 'prepayment' | 'postpayment';
    cement_type?: string;
    wallet_id?: string;
    notes?: string;
    created_at: string;
}

export function useCementPaymentsToDangote() {
    return useQuery({
        queryKey: ["cement-payments-to-dangote"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("cement_payments_to_dangote")
                .select(`
          *,
          supplier:suppliers(name)
        `)
                .order("payment_date", { ascending: false });

            if (error) throw error;
            return data as CementPaymentToDangote[];
        },
    });
}

export function useAddCementPaymentToDangote() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (payment: Omit<CementPaymentToDangote, "id" | "created_at">) => {
            // 1. Insert the payment record
            const { data: newPayment, error } = await supabase
                .from("cement_payments_to_dangote")
                .insert([payment])
                .select()
                .single();

            if (error) throw error;

            // 2. If it's a prepayment, update/create manufacturer wallet and record transaction
            if (payment.payment_type === 'prepayment' && payment.supplier_id && payment.cement_type) {
                // Find or create wallet
                let { data: wallet, error: walletError } = await supabase
                    .from("manufacturer_wallets")
                    .select("id, balance")
                    .eq("supplier_id", payment.supplier_id)
                    .eq("cement_type", payment.cement_type)
                    .single();

                if (walletError && walletError.code !== 'PGRST116') {
                    console.error("Error fetching wallet:", walletError);
                }

                if (!wallet) {
                    const { data: newWallet, error: createError } = await supabase
                        .from("manufacturer_wallets" as any)
                        .insert({
                            supplier_id: payment.supplier_id,
                            cement_type: payment.cement_type,
                            balance: payment.amount_paid,
                            unit: 'bags' // Default to bags, can be made dynamic later
                        } as any)
                        .select()
                        .single();

                    if (createError) throw createError;

                    wallet = newWallet as any;
                }

                // If wallet existed, the balance might need update if we don't rely only on the trigger
                // Note: There is a trigger trigger_update_wallet_balance in migration 20260107_functional_gaps.sql
                // that updates balance when a wallet_transaction is inserted.

                // Record the transaction
                const { error: txError } = await supabase
                    .from("wallet_transactions" as any)
                    .insert({
                        wallet_id: wallet!.id,
                        type: 'deposit',
                        amount: payment.amount_paid,
                        description: `Prepayment: ${payment.payment_reference || 'Ref N/A'}`,
                        reference_type: 'manual'
                    } as any);

                if (txError) throw txError;
            }

            return newPayment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cement-payments-to-dangote"] });
            toast({
                title: "Success",
                description: "Payment to supplier recorded successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: `Failed to record payment: ${error.message}`,
                variant: "destructive",
            });
        },
    });
}

export function useDeleteCementPayment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("cement_payments_to_dangote")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cement-payments-to-dangote"] });
            toast({
                title: "Payment deleted",
                description: "Cement payment record has been removed",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: `Failed to delete payment: ${error.message}`,
                variant: "destructive",
            });
        },
    });
}
