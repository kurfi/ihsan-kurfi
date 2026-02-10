import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, User, Package, MapPin } from "lucide-react";

interface PendingDeliveryCardProps {
    order: {
        id: string;
        order_number: string | null;
        quantity: number;
        unit: string;
        status: string | null;
        customers: { name: string } | null;
        trucks: { plate_number: string } | null;
        drivers: { name: string } | null;
    };
}

export function PendingDeliveryCard({ order }: PendingDeliveryCardProps) {
    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <span className="font-bold text-lg block">{order.order_number}</span>
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {order.customers?.name || 'Unknown Customer'}
                        </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                        {order.status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="w-3 h-3" /> Quantity
                        </span>
                        <span className="font-medium">
                            {order.quantity} {order.unit === 'tons' ? 'Tons' : 'Bags'}
                        </span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Truck className="w-3 h-3" /> Fleet
                        </span>
                        <span className="font-medium block truncate">
                            {order.trucks?.plate_number || 'No Truck'}
                        </span>
                        <span className="text-xs text-muted-foreground block truncate">
                            {order.drivers?.name || 'No Driver'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
