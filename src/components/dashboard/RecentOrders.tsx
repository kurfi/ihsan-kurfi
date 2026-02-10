import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, Clock } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const statusColors: Record<string, string> = {
  requested: "bg-muted text-muted-foreground",
  dispatched: "bg-orange-100 text-orange-700",
  delivered: "bg-success/20 text-success",
};

export const RecentOrders = () => {
  const { data: orders = [], isLoading } = useOrders();
  const recentOrders = orders.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="w-24 h-4 bg-muted animate-pulse rounded" />
                <div className="w-16 h-3 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="w-20 h-6 bg-muted animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (recentOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No recent orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentOrders.map((order) => (
        <div
          key={order.id}
          className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">{order.customer?.name || "Cash Customer"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(order.created_at), "MMM d, HH:mm")}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-medium text-primary/80">#{order.order_number}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">₦{(order.total_amount || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{order.quantity} {order.unit === 'tons' ? 'T' : 'Bags'}</p>
            </div>
            <Badge
              className={`${statusColors[order.status]} border-none font-medium px-3 py-1`}
              variant="outline"
            >
              {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
