import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TransitMetricCardProps {
    title: string;
    value: number | string;
    subtitle?: React.ReactNode;
    suffix?: string;
    icon: LucideIcon;
    color: "blue" | "purple" | "emerald" | "green";
    loading?: boolean;
}

const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
    green: "bg-green-500/10 text-green-400 group-hover:bg-green-500/20",
};

const glowColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    green: "bg-green-500",
};

export function TransitMetricCard({
    title,
    value,
    subtitle,
    suffix = "",
    icon: Icon,
    color,
    loading = false,
}: TransitMetricCardProps) {
    return (
        <Card className="glass-card relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 rounded-2xl">
            <CardContent className="p-5">
                {/* Glow effect */}
                <div
                    className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${glowColors[color]}`}
                />

                <div className="relative flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="body-small text-muted-foreground font-medium">{title}</p>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="flex flex-col">
                                <p className="text-responsive-2xl font-bold">
                                    {typeof value === 'number' ? value.toLocaleString() : value}
                                    {suffix && <span className="text-sm sm:text-lg ml-1">{suffix}</span>}
                                </p>
                                {subtitle && <div className="body-small text-muted-foreground mt-1">{subtitle}</div>}
                            </div>
                        )}
                    </div>
                    <div
                        className={`p-3 rounded-lg transition-all duration-300 group-hover:scale-110 ${colorClasses[color]}`}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
