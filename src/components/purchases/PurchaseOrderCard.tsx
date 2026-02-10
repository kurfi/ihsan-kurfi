
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Purchase } from "@/hooks/usePurchases";
import { CheckCircle, Factory, Calendar, MapPin, Banknote } from "lucide-react";
import { format } from "date-fns";

interface PurchaseOrderCardProps {
    purchase: Purchase;
    onReceive: (purchase: Purchase) => void;
    formatCurrency: (amount: number) => string;
    isReceiving: boolean;
    getLinkedOrderNumber: (id: string | null) => string;
}

export function PurchaseOrderCard({ purchase, onReceive, formatCurrency, isReceiving, getLinkedOrderNumber }: PurchaseOrderCardProps) {
    const isDelivered = purchase.status === "received";
    // Safe access for potentially stale types
    const purchaseNumber = purchase.purchase_number || (purchase.sales_order_id ? purchase.sales_order_id : purchase.id.slice(0, 8));
    const purchaseDate = purchase.created_at || purchase.date;

    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{purchaseNumber}</span>
                            <Badge variant={isDelivered ? "default" : "secondary"} className={isDelivered ? "bg-success/20 text-success hover:bg-success/30" : ""}>
                                {purchase.status?.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Factory className="w-3.5 h-3.5 text-muted-foreground" />
                            {purchase.suppliers?.name || "Unknown Supplier"}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-foreground">
                            {purchase.quantity} <span className="text-muted-foreground text-sm font-normal">{purchase.unit}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {purchase.cement_type}
                        </div>
                        {(purchase.atc_number || purchase.cap_number) && (
                            <div className="flex flex-col gap-0.5 mt-2">
                                {purchase.atc_number && (
                                    <Badge variant="outline" className="text-[10px] w-fit border-blue-200 text-blue-600 bg-blue-50/50">
                                        ATC: {purchase.atc_number}
                                    </Badge>
                                )}
                                {purchase.cap_number && (
                                    <Badge variant="outline" className="text-[10px] w-fit border-indigo-200 text-indigo-600 bg-indigo-50/50">
                                        CAP: {purchase.cap_number}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Destination
                        </span>
                        <span className="font-medium block truncate">
                            {purchase.is_direct_delivery ? (
                                <span className="text-indigo-600 dark:text-indigo-400">
                                    Direct: Order #{getLinkedOrderNumber(purchase.linked_customer_order_id)}
                                </span>
                            ) : (
                                purchase.depots?.name || '-'
                            )}
                        </span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Banknote className="w-3 h-3" /> Total Cost
                        </span>
                        <span className="font-bold text-foreground">
                            {formatCurrency(purchase.total_cost || 0)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {purchaseDate ? format(new Date(purchaseDate), 'MMM d, yyyy') : '-'}
                    </div>

                    {purchase.status === 'ordered' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-success border-success/30 hover:bg-success/10 hover:text-success"
                            onClick={() => onReceive(purchase)}
                            disabled={isReceiving}
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Receive Stock
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
