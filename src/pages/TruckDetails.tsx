import { useParams, useNavigate } from "react-router-dom";
import { useTrucks } from "@/hooks/useFleet";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Wrench, Gauge, Calendar, AlertTriangle, FileText } from "lucide-react";
import { TruckExpenses } from "@/components/fleet/TruckExpenses";
import { format, differenceInDays } from "date-fns";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useDocuments } from "@/hooks/useDocuments";

export default function TruckDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: trucks = [], isLoading } = useTrucks();
    const { data: documents = [] } = useDocuments();

    const truck = trucks.find(t => t.id === id);

    if (isLoading) {
        return (
            <MainLayout title="Truck Details">
                <LoadingSkeleton variant="card" rows={3} />
            </MainLayout>
        );
    }

    if (!truck) {
        return (
            <MainLayout title="Truck Details">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <Truck className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold">Truck Not Found</h2>
                    <p className="text-muted-foreground mb-6">The truck you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => navigate("/fleet")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fleet
                    </Button>
                </div>
            </MainLayout>
        );
    }

    const getMaintenanceStatus = (truck: any) => {
        if (!truck.next_service_date) return null;
        const days = differenceInDays(new Date(truck.next_service_date), new Date());
        if (days <= 0) return { status: "overdue", label: "Overdue", color: "destructive" };
        if (days <= 7) return { status: "due_soon", label: "Due Soon", color: "warning" };
        return { status: "ok", label: "OK", color: "success" };
    };

    const maintenance = getMaintenanceStatus(truck);

    const truckDocs = documents.filter(d => d.entity_id === truck.id && d.entity_type === 'truck');
    const expiredDocs = truckDocs.filter(d => differenceInDays(new Date(d.expiry_date), new Date()) <= 0);

    return (
        <MainLayout title={`${truck.plate_number} details`}>
            <div className="mb-6">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => navigate("/fleet")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fleet
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Header Card */}
                <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Truck className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{truck.plate_number}</h1>
                                    <p className="text-muted-foreground">{truck.model} • {truck.truck_type}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={truck.is_active ? "default" : "secondary"} className="h-8 px-3">
                                    {truck.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {maintenance && (
                                    <Badge variant={maintenance.color === 'destructive' ? 'destructive' : 'secondary'} className={`h-8 px-3 ${maintenance.color === 'success' ? 'bg-success text-success-foreground' : ''}`}>
                                        Service: {maintenance.label}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto justify-start">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Capacity</CardTitle>
                                    <Truck className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{truck.capacity_tons} <span className="text-sm font-normal text-muted-foreground">Tons</span></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Mileage</CardTitle>
                                    <Gauge className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{truck.current_mileage?.toLocaleString() ?? 0} <span className="text-sm font-normal text-muted-foreground">km</span></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Next Service</CardTitle>
                                    <Wrench className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {truck.next_service_date ? format(new Date(truck.next_service_date), "MMM d") : "N/A"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Interval: {truck.service_interval_km?.toLocaleString()} km
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Detailed Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Vehicle Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Chassis Number</span>
                                            <p className="font-medium">{truck.chassis_number || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Default Fuel Cost</span>
                                            <p className="font-medium">₦{truck.default_fuel_cost?.toLocaleString() || "0"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Last Service</span>
                                            <p className="font-medium">{truck.last_service_date ? format(new Date(truck.last_service_date), "MMM d, yyyy") : "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Registration Date</span>
                                            <p className="font-medium">{format(new Date(truck.created_at), "MMM d, yyyy")}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Compliance Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" /> Compliance Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {truckDocs.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">No documents tracked for this vehicle.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {truckDocs.map((doc) => {
                                                const days = differenceInDays(new Date(doc.expiry_date), new Date());
                                                const isExpired = days <= 0;
                                                const isExpiring = days <= 30 && days > 0;

                                                return (
                                                    <div key={doc.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${isExpired ? "bg-destructive" : isExpiring ? "bg-warning" : "bg-success"}`} />
                                                            <span className="capitalize">{doc.document_type.replace(/_/g, " ")}</span>
                                                        </div>
                                                        <span className={isExpired ? "text-destructive font-medium" : isExpiring ? "text-warning font-medium" : "text-muted-foreground"}>
                                                            {isExpired ? "Expired" : `${days} days left`}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="expenses">
                        <TruckExpenses truckId={truck.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
