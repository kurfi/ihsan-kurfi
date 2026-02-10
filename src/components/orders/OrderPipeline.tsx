import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";
import type { OrderStatus } from "@/hooks/useOrders";

const statusPipeline: OrderStatus[] = ["requested", "dispatched", "delivered"];

const statusColors: Record<string, string> = {
    requested: "bg-muted text-muted-foreground",
    dispatched: "bg-orange-100 text-orange-700",
    delivered: "bg-success/20 text-success",
    cancelled: "bg-destructive/10 text-destructive",
};

const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

interface OrderPipelineProps {
    orderCounts: Record<OrderStatus, number>;
}

export function OrderPipeline({ orderCounts }: OrderPipelineProps) {
    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Order Pipeline
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between overflow-x-auto pb-4 scrollbar-thin">
                    {statusPipeline.map((status, index) => {
                        const count = orderCounts[status] || 0;
                        return (
                            <div key={status} className="flex items-center">
                                <div className="text-center min-w-[100px]">
                                    <div className={`px-4 py-2 rounded-lg ${statusColors[status]} font-medium`}>
                                        {formatStatus(status)}
                                    </div>
                                    <p className="text-2xl font-bold mt-2">{count}</p>
                                </div>
                                {index < statusPipeline.length - 1 && (
                                    <ArrowRight className="w-5 h-5 text-muted-foreground mx-2 flex-shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export { statusColors, formatStatus };
