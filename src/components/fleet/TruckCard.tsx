import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge, Truck as TruckIcon, Wrench, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Truck } from "@/hooks/useFleet";

interface TruckCardProps {
    truck: Truck;
    docStatus: "valid" | "warning" | "expired";
    maintenanceStatus: "ok" | "due_soon" | "overdue" | null;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function TruckCard({ truck, docStatus, maintenanceStatus, onEdit, onDelete }: TruckCardProps) {
    const navigate = useNavigate();

    return (
        <Card className="hover-lift border-l-4 border-l-primary/50 group">
            <CardHeader className="p-4 pb-2 cursor-pointer" onClick={() => navigate(`/fleet/truck/${truck.id}`)}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <TruckIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">{truck.plate_number}</CardTitle>
                            <p className="body-small">{truck.model || "Unknown Model"}</p>
                        </div>
                    </div>
                    <Badge variant={truck.is_active ? "default" : "secondary"}>
                        {truck.is_active ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="body-small">Type:</span>
                    <span className="font-medium">{truck.truck_type || "-"}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="body-small">Capacity:</span>
                    <span className="font-medium">{truck.capacity_tons ? `${truck.capacity_tons} Tons` : "-"}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="body-small flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> Mileage:
                    </span>
                    <span className="font-medium">{truck.current_mileage?.toLocaleString() ?? "-"} km</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="body-small flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Service:
                    </span>
                    {maintenanceStatus ? (
                        <Badge variant={
                            maintenanceStatus === "overdue" ? "destructive" :
                                maintenanceStatus === "due_soon" ? "secondary" : "default"
                        } className={`h-5 px-1.5 ${maintenanceStatus === "ok" ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}>
                            {maintenanceStatus === "overdue" ? "Overdue" :
                                maintenanceStatus === "due_soon" ? "Due Soon" : "OK"}
                        </Badge>
                    ) : <span>-</span>}
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-sm">
                    <span className="body-small">Documents:</span>
                    <Badge variant={
                        docStatus === "expired" ? "destructive" :
                            docStatus === "warning" ? "secondary" : "outline"
                    } className={docStatus === "valid" ? "border-success text-success" : ""}>
                        {docStatus === "expired" ? "Expired" :
                            docStatus === "warning" ? "Expiring" : "Valid"}
                    </Badge>
                </div>

                {(onEdit || onDelete) && (
                    <div className="pt-2 flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate(`/fleet/truck/${truck.id}`)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        {onEdit && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                Edit
                            </Button>
                        )}
                        {onDelete && (
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
