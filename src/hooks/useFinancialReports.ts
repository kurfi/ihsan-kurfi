import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyPL {
    month: string;
    haulage_revenue: number;
    cement_sales: number;
    cement_purchases: number;
    trip_costs: number;
    other_expenses: number;
    haulage_profit: number;
    trading_profit: number;
    total_revenue: number;
    total_costs: number;
    net_profit: number;
    trip_count: number;
    total_quantity: number;
}

export interface ReceivableAging {
    customer_name: string;
    customer_id: string;
    total_owed: number;
    oldest_invoice_date: string;
    aging_bucket: string;
    days_outstanding: number;
}


export function useMonthlyProfitLoss(startDate?: string, endDate?: string, enabled = true) {
    return useQuery({
        queryKey: ["monthly-pl", startDate, endDate],
        enabled,
        queryFn: async () => {
            let query = supabase
                .from("monthly_profit_loss" as any)
                .select("*")
                .order("month", { ascending: false });

            if (startDate) {
                query = query.gte("month", startDate);
            }
            if (endDate) {
                query = query.lte("month", endDate);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data as any) as MonthlyPL[];
        },
    });
}

export function useReceivablesAging(enabled = true) {
    return useQuery({
        queryKey: ["receivables-aging"],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("receivables_aging" as any)
                .select("*")
                .order("days_outstanding", { ascending: false });

            if (error) throw error;
            return (data as any) as ReceivableAging[];
        },
    });
}


// Helper function to get current month P&L
export function useCurrentMonthPL() {
    const { data: monthlyPL = [] } = useMonthlyProfitLoss();
    return monthlyPL[0] || null;
}

// Helper function to calculate total receivables
export function useTotalReceivables() {
    const { data: customers = [] } = useQuery({
        queryKey: ["customers-receivables"], // Using a separate key to avoid sharing with useCustomers if not needed, but can use "customers" too
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customers")
                .select("current_balance")
                .gt("current_balance", 0);
            if (error) throw error;
            return data;
        },
    });
    const total = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
    return { total, count: customers.length };
}

// Helper function to calculate all-time totals
export function useAllTimeTotals() {
    const { data: monthlyPL = [] } = useMonthlyProfitLoss();
    const totalRevenue = monthlyPL.reduce((sum, m) => sum + (m.total_revenue || 0), 0);
    const totalProfit = monthlyPL.reduce((sum, m) => sum + (m.net_profit || 0), 0);
    return { totalRevenue, totalProfit };
}
