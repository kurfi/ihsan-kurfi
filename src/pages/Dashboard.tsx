import { MainLayout } from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useOrders } from "@/hooks/useOrders";
import { useDocuments } from "@/hooks/useDocuments";
import { useTrucks } from "@/hooks/useFleet";
import { useCustomers } from "@/hooks/useCustomers";
import { Banknote, Truck, AlertTriangle, ClipboardList, Users, Package, Wallet, TrendingUp } from "lucide-react";
import { differenceInDays, isPast } from "date-fns";
import { motion } from "framer-motion";
import { VibrantCard } from "@/components/ui/vibrant-card";
import { useDualStreamProfitability } from "@/hooks/useReports";
import { DualStreamCard } from "@/components/reports/DualStreamCard";
import { useCurrentMonthPL, useTotalReceivables } from "@/hooks/useFinancialReports";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: documents = [], isLoading: docsLoading } = useDocuments();
  const { data: trucks = [], isLoading: trucksLoading } = useTrucks();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: dualStreamData = [] } = useDualStreamProfitability();
  const currentMonthPL = useCurrentMonthPL();
  const { total: totalReceivables } = useTotalReceivables();

  const isLoading = ordersLoading || docsLoading || trucksLoading || customersLoading;

  const activeTrucks = trucks.filter((t) => t.is_active).length;
  const activeOrders = orders.filter((o) => o.status !== "delivered").length;

  const expiringDocs = documents.filter((doc) => {
    const days = differenceInDays(new Date(doc.expiry_date), new Date());
    return days <= 30 || isPast(new Date(doc.expiry_date));
  });

  const totalSales = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Calculate dual-stream aggregates
  // Calculate dual-stream aggregates from current month P&L
  const haulageRevenue = currentMonthPL?.haulage_revenue || 0;
  const haulageProfit = currentMonthPL?.haulage_profit || 0;
  const tradingRevenue = currentMonthPL?.cement_sales || 0;
  const tradingProfit = currentMonthPL?.trading_profit || 0;
  const netProfit = currentMonthPL?.net_profit || 0;

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in-up pb-10">

        {/* Header / Hero Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="heading-page mb-2">
              Dashboard <span className="text-primary">Overview</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-accent transition-colors">
              Last 24h
            </button>
            <button
              onClick={() => navigate("/orders", { state: { openNewOrder: true } })}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:bg-primary/90 transition-colors"
            >
              New Order
            </button>
          </div>
        </div>

        {/* Primary Metrics Grid - Staking Asset Style */}
        {isLoading ? (
          <LoadingSkeleton variant="metric" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricCard
              title="Haulage Revenue (MTD)"
              value={`₦${(haulageRevenue / 1000).toFixed(1)}k`}
              subtitle="Month to date"
              icon={Truck}
              variant="default"
              delay={0.1}
            />
            <MetricCard
              title="Cement Sales (MTD)"
              value={`₦${(tradingRevenue / 1000).toFixed(1)}k`}
              subtitle="Month to date"
              icon={Package}
              variant="success"
              delay={0.2}
            />
            <MetricCard
              title="Combined Profit (MTD)"
              value={`₦${(netProfit / 1000).toFixed(1)}k`}
              subtitle="Net earnings"
              icon={TrendingUp}
              variant="warning"
              trend={{ value: 10, positive: true }}
              delay={0.3}
            />
            <MetricCard
              title="Receivables"
              value={`₦${(totalReceivables / 1000).toFixed(1)}k`}
              subtitle="Outstanding payments"
              icon={Wallet}
              variant="destructive"
              delay={0.4}
            />
          </div>
        )}

        {/* Business Overview - Dual Stream */}
        <VibrantCard delay={0.5} className="border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-section flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Banknote className="w-5 h-5" />
              </div>
              Business <span className="text-primary/60">Overview</span>
            </h3>
          </div>
          <DualStreamCard
            haulageRevenue={haulageRevenue}
            haulageProfit={haulageProfit}
            tradingRevenue={tradingRevenue}
            tradingProfit={tradingProfit}
          />
        </VibrantCard>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-card p-6 rounded-3xl flex items-center gap-5 hover:bg-accent/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-vibrant-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 rounded-2xl bg-vibrant-blue/10 text-vibrant-blue group-hover:bg-vibrant-blue/20 group-hover:rotate-12 transition-all shadow-lg">
              <Users className="w-7 h-7" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Total Customers</p>
              <p className="text-3xl font-black text-foreground text-glow">{customers.length}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-card p-6 rounded-3xl flex items-center gap-5 hover:bg-accent/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-vibrant-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 rounded-2xl bg-vibrant-purple/10 text-vibrant-purple group-hover:bg-vibrant-purple/20 group-hover:rotate-12 transition-all shadow-lg">
              <Package className="w-7 h-7" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Orders Today</p>
              <p className="text-3xl font-black text-foreground text-glow">
                {orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-card p-6 rounded-3xl flex items-center gap-5 hover:bg-accent/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-vibrant-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 rounded-2xl bg-vibrant-emerald/10 text-vibrant-emerald group-hover:bg-vibrant-emerald/20 group-hover:rotate-12 transition-all shadow-lg">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Delivered Today</p>
              <p className="text-3xl font-black text-foreground text-glow">
                {orders.filter((o) =>
                  o.status === "delivered" &&
                  new Date(o.updated_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Main Content Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Recent Orders (Likely larger) */}
          <div className="lg:col-span-8">
            <VibrantCard delay={0.5} className="h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="heading-section flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  Recent <span className="text-primary/60">Orders</span>
                </h3>
                <button className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  View All
                </button>
              </div>
              <RecentOrders />
            </VibrantCard>
          </div>

          {/* Right Column: Alerts & Quick Actions */}
          <div className="lg:col-span-4">
            <VibrantCard variant="rose" delay={0.6} className="h-full border-vibrant-rose/20">
              <div className="flex items-center justify-between mb-8">
                <h3 className="heading-section flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-vibrant-rose/10 text-vibrant-rose">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  System <span className="text-vibrant-rose/60">Alerts</span>
                </h3>
              </div>
              <AlertsList documents={documents} />
            </VibrantCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
