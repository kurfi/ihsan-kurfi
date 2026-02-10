import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TripProfitabilityCardProps {
    trip: {
        id: string;
        order_number: string | null;
        created_at: string;
        revenue: number | null;
        total_expenses: number | null;
        net_profit: number;
        profit_margin_percent: number;
    };
}

export function TripProfitabilityCard({ trip }: TripProfitabilityCardProps) {
    const isProfitable = trip.net_profit >= 0;

    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <span className="font-bold text-lg block">{trip.order_number}</span>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(trip.created_at), 'MMM d, yyyy')}
                        </div>
                    </div>
                    <Badge
                        variant={
                            trip.profit_margin_percent >= 20
                                ? 'default'
                                : trip.profit_margin_percent >= 10
                                    ? 'secondary'
                                    : 'destructive'
                        }
                    >
                        {(trip.profit_margin_percent || 0).toFixed(1)}% Margin
                    </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground block">Revenue</span>
                        <span className="font-medium block text-green-700 dark:text-green-500">
                            ₦{(trip.revenue || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="space-y-1 text-center">
                        <span className="text-xs text-muted-foreground block">Expenses</span>
                        <span className="font-medium block text-red-600">
                            ₦{(trip.total_expenses || 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-xs text-muted-foreground block">Net Profit</span>
                        <span className={`font-bold block ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                            ₦{(trip.net_profit || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
