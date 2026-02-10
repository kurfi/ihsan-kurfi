import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Banknote, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface DualStreamCardProps {
    haulageRevenue: number;
    haulageProfit: number;
    tradingRevenue: number;
    tradingProfit: number;
}

export function DualStreamCard({ haulageRevenue, haulageProfit, tradingRevenue, tradingProfit }: DualStreamCardProps) {
    const totalRevenue = haulageRevenue + tradingRevenue;
    const totalProfit = haulageProfit + tradingProfit;
    const haulageMargin = haulageRevenue > 0 ? (haulageProfit / haulageRevenue) * 100 : 0;
    const tradingMargin = tradingRevenue > 0 ? (tradingProfit / tradingRevenue) * 100 : 0;

    return (
        <Card className="shadow-md border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-primary" />
                    Dual-Stream Profitability
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Haulage Stream */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">Haulage Stream</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-lg font-bold text-blue-700">₦{haulageRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Profit</p>
                            <p className={cn("text-lg font-bold", haulageProfit >= 0 ? "text-green-600" : "text-red-600")}>
                                ₦{haulageProfit.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Margin</p>
                            <div className="flex items-center gap-1">
                                {haulageMargin >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                                <p className={cn("text-lg font-bold", haulageMargin >= 0 ? "text-green-600" : "text-red-600")}>
                                    {haulageMargin.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trading Stream */}
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-3">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Cement Trading Stream</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-lg font-bold text-emerald-700">₦{tradingRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Profit</p>
                            <p className={cn("text-lg font-bold", tradingProfit >= 0 ? "text-green-600" : "text-red-600")}>
                                ₦{tradingProfit.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Margin</p>
                            <div className="flex items-center gap-1">
                                {tradingMargin >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                                <p className={cn("text-lg font-bold", tradingMargin >= 0 ? "text-green-600" : "text-red-600")}>
                                    {tradingMargin.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Summary */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300 dark:border-purple-700">
                    <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2">Combined Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Total Revenue</p>
                            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">₦{totalRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Profit</p>
                            <p className={cn("text-2xl font-black", totalProfit >= 0 ? "text-green-600" : "text-red-600")}>
                                ₦{totalProfit.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
