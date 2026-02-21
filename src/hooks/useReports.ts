import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ExpiringDocument = Tables<'expiring_documents'>;
export type TripProfitability = Tables<'trip_profitability'>;
export type DualStreamProfitability = {
    id: string;
    order_number: string;
    waybill_number: string | null;
    created_at: string;
    status: string;
    quantity: number;
    unit: string;
    customer_name: string;
    haulage_revenue: number;
    haulage_costs: number;
    haulage_profit: number;
    trading_revenue: number;
    trading_costs: number;
    trading_profit: number;
    total_revenue: number;
    total_costs: number;
    total_profit: number;
};
export type CustomerAging = Tables<'customer_aging'>;
export type FleetAvailability = Tables<'fleet_availability'>;

export type PendingOrder = Tables<'orders'> & {
    customers: { name: string } | null;
    trucks: { plate_number: string } | null;
    drivers: { name: string } | null;
};

// Expiring Documents Report
export function useExpiringDocuments(enabled = true) {
    return useQuery({
        queryKey: ['expiring-documents'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expiring_documents')
                .select('*')
                .order('expiry_date', { ascending: true });

            if (error) throw error;
            return (data || []) as ExpiringDocument[];
        },
    });
}

// Trip Profitability Report
export function useTripProfitability() {
    return useQuery({
        queryKey: ['trip-profitability'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('trip_profitability')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as TripProfitability[];
        },
    });
}

// Dual Stream Profitability Report
export function useDualStreamProfitability(enabled = true) {
    return useQuery({
        queryKey: ['dual-stream-profitability'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('dual_stream_profitability')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as DualStreamProfitability[];
        },
    });
}

// Customer Aging Analysis
export function useCustomerAging(enabled = true) {
    return useQuery({
        queryKey: ['customer-aging'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customer_aging')
                .select('*')
                .order('current_balance', { ascending: false });

            if (error) throw error;
            return (data || []) as CustomerAging[];
        },
    });
}

// Fleet Availability Report
export function useFleetAvailability(enabled = true) {
    return useQuery({
        queryKey: ['fleet-availability'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('fleet_availability')
                .select('*')
                .order('plate_number', { ascending: true });

            if (error) throw error;
            return (data || []) as FleetAvailability[];
        },
    });
}

// Sales Summary by Period
export function useSalesSummary(startDate?: Date, endDate?: Date, enabled = true) {
    return useQuery({
        queryKey: ['sales-summary', startDate, endDate],
        enabled,
        queryFn: async () => {
            let query = supabase
                .from('orders')
                .select(`
          *,
          customers(name),
          depots(name)
        `)
                .eq('status', 'delivered');

            if (startDate) {
                query = query.gte('created_at', startDate.toISOString());
            }
            if (endDate) {
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return {
                all: data || [],
                totalTons: (data || []).filter(o => o.unit === 'tons').reduce((sum, o) => sum + (o.quantity || 0), 0),
                totalBags: (data || []).filter(o => o.unit === 'bags').reduce((sum, o) => sum + (o.quantity || 0), 0),
                totalRevenue: (data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0),
            };
        },
    });
}

// Pending Deliveries
export function usePendingDeliveries(enabled = true) {
    return useQuery({
        queryKey: ['pending-deliveries'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          customers(name),
          trucks(plate_number),
          drivers(name)
        `)
                .neq('status', 'delivered')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as PendingOrder[];
        },
    });
}

// Daily Cash Position
export function useDailyCashPosition(date?: Date, enabled = true) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    return useQuery({
        queryKey: ['daily-cash-position', startOfDay.toISOString()],
        enabled,
        queryFn: async () => {
            // Get payments for the day
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('amount, payment_method')
                .gte('payment_date', startOfDay.toISOString())
                .lte('payment_date', endOfDay.toISOString());

            if (paymentsError) throw paymentsError;

            // Get expenses for the day
            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('amount')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());

            if (expensesError) throw expensesError;

            const totalIncome = (payments || []).reduce((sum, p) => sum + p.amount, 0);
            const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

            const byMethod = (payments || []).reduce((acc, p) => {
                const method = p.payment_method;
                acc[method] = (acc[method] || 0) + p.amount;
                return acc;
            }, {} as Record<string, number>);

            return {
                date: targetDate,
                totalIncome,
                totalExpenses,
                netPosition: totalIncome - totalExpenses,
                byPaymentMethod: byMethod,
                paymentsCount: payments?.length || 0,
                expensesCount: expenses?.length || 0,
            };
        },
    });
}

// Direct Deliveries Report
export function useDirectDeliveries(enabled = true) {
    return useQuery({
        queryKey: ['direct-deliveries'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customers(name),
                    purchases:purchases!sales_order_id(cost_per_unit, quantity)
                `)
                .eq('is_direct_drop', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
    });
}
