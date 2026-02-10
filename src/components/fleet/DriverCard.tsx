import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Briefcase } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Driver = Database["public"]["Tables"]["drivers"]["Row"];

interface DriverCardProps {
    driver: Driver;
    docStatus: "valid" | "warning" | "expired";
    successRate: number | null;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function DriverCard({ driver, docStatus, successRate, onEdit, onDelete }: DriverCardProps) {
    return (
        <Card className="hover-lift border-l-4 border-l-blue-500/50">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <User className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{driver.name}</CardTitle>
                            <p className="body-small">{driver.license_number || "No License"}</p>
                        </div>
                    </div>
                    <Badge variant={driver.is_active ? "default" : "secondary"}>
                        {driver.is_active ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                {driver.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {driver.phone}
                    </div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <span className="body-small">Deliveries:</span>
                    {driver.total_deliveries ? (
                        <span className="font-medium">
                            {driver.successful_deliveries || 0}/{driver.total_deliveries}
                            {successRate !== null && (
                                <span className={`ml-1 ${successRate >= 90 ? "text-success" : successRate >= 70 ? "text-warning" : "text-destructive"}`}>
                                    ({successRate}%)
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </div>

                {driver.license_class && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="body-small">License Class:</span>
                        <Badge variant="outline">{driver.license_class}</Badge>
                    </div>
                )}

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
                        {onEdit && (
                            <Button size="sm" variant="outline" onClick={onEdit}>
                                Edit
                            </Button>
                        )}
                        {onDelete && (
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
