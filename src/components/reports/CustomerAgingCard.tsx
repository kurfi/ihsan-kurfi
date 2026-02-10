import { Card, CardContent } from "@/components/ui/card";
import { User, CreditCard, AlertCircle } from "lucide-react";

interface CustomerAgingCardProps {
    customer: {
        id: string;
        name: string;
        credit_limit: number | null;
        current_balance: number | null;
        current_0_30: number | null;
        days_31_60: number | null;
        days_61_90: number | null;
        over_90_days: number | null;
    };
}

export function CustomerAgingCard({ customer }: CustomerAgingCardProps) {
    const totalOverdue = (customer.days_31_60 || 0) + (customer.days_61_90 || 0) + (customer.over_90_days || 0);

    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-lg">{customer.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            Limit: ₦{(customer.credit_limit || 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Balance</span>
                        <span className="font-bold text-lg">₦{(customer.current_balance || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-border/50 pt-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">0-30 Days:</span>
                        <span>₦{(customer.current_0_30 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-orange-600">
                        <span className="text-muted-foreground">31-60 Days:</span>
                        <span>₦{(customer.days_31_60 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-red-600">
                        <span className="text-muted-foreground">61-90 Days:</span>
                        <span>₦{(customer.days_61_90 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-700">
                        <span className="text-muted-foreground">&gt;90 Days:</span>
                        <span>₦{(customer.over_90_days || 0).toLocaleString()}</span>
                    </div>
                </div>

                {totalOverdue > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 p-2 rounded text-xs flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Total Overdue (Over 30d)
                        </span>
                        <span>₦{totalOverdue.toLocaleString()}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
