import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

export interface Expense {
  id: string;
  order_id: string | null;
  truck_id: string | null;
  category: ExpenseCategory | null;
  expense_type: string;
  amount: number;
  description: string | null;
  created_at: string;
  order?: { order_number: string } | null;
}

export interface PaymentAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  payment_account_id: string | null;
  payment_date: string | null;
  status: "Pending" | "Confirmed" | "Rejected" | null;
  notes: string | null;
  created_at: string;
  customer?: { name: string } | null;
  order?: { order_number: string } | null;
  payment_account?: PaymentAccount | null;
}

export function useExpenses(options?: { orderId?: string; truckId?: string }) {
  return useQuery({
    queryKey: ["expenses", options],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select(`
          *,
          order:orders(order_number)
        `)
        .order("created_at", { ascending: false });

      if (options?.orderId) {
        query = query.eq("order_id", options.orderId);
      }

      if (options?.truckId) {
        query = query.eq("truck_id", options.truckId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function usePaymentAccounts() {
  return useQuery({
    queryKey: ["payment_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_accounts")
        .select("*")
        .order("is_active", { ascending: false })
        .order("bank_name", { ascending: true });

      if (error) throw error;
      return data as PaymentAccount[];
    },
  });
}

export function usePayments(customerId?: string) {
  return useQuery({
    queryKey: ["payments", customerId],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          customer:customers(name),
          order:orders(order_number),
          payment_account:payment_accounts(*)
        `)
        .order("created_at", { ascending: false });

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert(expense)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add expense", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddPaymentAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Omit<PaymentAccount, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("payment_accounts")
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_accounts"] });
      toast({ title: "Account added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add account", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePaymentAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("payment_accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_accounts"] });
      toast({ title: "Account updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update account", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePaymentAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_accounts"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete account", description: error.message, variant: "destructive" });
    },
  });
}

export function useOrderBalances(customerId?: string) {
  return useQuery({
    queryKey: ["order_balances", customerId],
    queryFn: async () => {
      let query = supabase
        .from("order_balances")
        .select("*")
        .eq("is_settled", false)
        .order("order_number", { ascending: false });

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, "id" | "created_at" | "customer" | "order" | "payment_date" | "payment_account" | "status" | "notes"> & { payment_date?: string, status?: "Pending" | "Confirmed" | "Rejected", notes?: string }) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Payment recorded successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to record payment", description: error.message, variant: "destructive" });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "Confirmed" | "Rejected" }) => {
      const { data, error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: `Payment ${variables.status.toLowerCase()}`,
        description: variables.status === "Confirmed"
          ? "Customer balance has been updated"
          : "Payment has been rejected"
      });
    },
    onError: (error) => {
      toast({ title: "Failed to update payment", description: error.message, variant: "destructive" });
    },
  });
}

export function useTripProfitability(orderId: string) {
  return useQuery({
    queryKey: ["trip-profit", orderId],
    queryFn: async () => {
      const [orderRes, expensesRes] = await Promise.all([
        supabase.from("orders").select("total_amount").eq("id", orderId).single(),
        supabase.from("expenses").select("amount").eq("order_id", orderId),
      ]);

      if (orderRes.error) throw orderRes.error;

      const revenue = orderRes.data?.total_amount || 0;
      const expenses = expensesRes.data?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const profit = revenue - expenses;

      return { revenue, expenses, profit };
    },
    enabled: !!orderId,
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update expense", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete expense", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Payment updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update payment", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Payment deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete payment", description: error.message, variant: "destructive" });
    },
  });
}
