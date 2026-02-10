import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Scale, FileWarning } from "lucide-react";

interface FleetStatusCardProps {
    truck: {
        id: string;
        plate_number: string;
        model: string | null;
        capacity_tons: number;
        availability_status: string;
        expired_doc_count: number;
        is_active: boolean;
    };
}

export function FleetStatusCard({ truck }: FleetStatusCardProps) {
    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-lg">{truck.plate_number}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {truck.model || 'Unknown Model'}
                        </div>
                    </div>
                    <Badge
                        variant={
                            truck.availability_status === 'available'
                                ? 'default'
                                : truck.availability_status === 'in_use'
                                    ? 'secondary'
                                    : 'destructive'
                        }
                    >
                        {truck.availability_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Scale className="w-3 h-3" /> Capacity
                        </span>
                        <span className="font-medium">
                            {truck.capacity_tons} Tons
                        </span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <FileWarning className="w-3 h-3" /> Expired Docs
                        </span>
                        <span className={`font-bold ${truck.expired_doc_count > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {truck.expired_doc_count}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
