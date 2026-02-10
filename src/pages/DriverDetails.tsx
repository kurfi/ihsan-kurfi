import { useParams, useNavigate } from "react-router-dom";
import { useDrivers } from "@/hooks/useFleet";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, Award, AlertTriangle, FileText, Truck } from "lucide-react";
import { DriverWallet } from "@/components/fleet/DriverWallet";
import { format, differenceInDays } from "date-fns";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useDocuments } from "@/hooks/useDocuments";

export default function DriverDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: drivers = [], isLoading } = useDrivers();
    const { data: documents = [] } = useDocuments();

    const driver = drivers.find(d => d.id === id);

    if (isLoading) {
        return (
            <MainLayout title="Driver Details">
                <LoadingSkeleton variant="card" rows={3} />
            </MainLayout>
        );
    }

    if (!driver) {
        return (
            <MainLayout title="Driver Details">
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <User className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold">Driver Not Found</h2>
                    <p className="text-muted-foreground mb-6">The driver you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => navigate("/fleet")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fleet
                    </Button>
                </div>
            </MainLayout>
        );
    }

    const driverDocs = documents.filter(d => d.entity_id === driver.id && d.entity_type === 'driver');
    const successRate = driver.total_deliveries && driver.total_deliveries > 0
        ? Math.round((driver.successful_deliveries || 0) / driver.total_deliveries * 100)
        : null;

    return (
        <MainLayout title={`${driver.name} details`}>
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
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{driver.name}</h1>
                                    <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
                                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {driver.phone || "No Phone"}</span>
                                        {driver.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {driver.email}</span>}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={driver.is_active ? "default" : "secondary"} className="h-8 px-3">
                                {driver.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto justify-start">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="wallet">Wallet</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                                    <Truck className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{driver.total_deliveries || 0}</div>
                                    <p className="text-xs text-muted-foreground">Total trips assigned</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                                    <Award className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${successRate && successRate >= 90 ? "text-success" :
                                            successRate && successRate >= 70 ? "text-warning" : "text-muted-foreground"
                                        }`}>
                                        {successRate !== null ? `${successRate}%` : "N/A"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Successful deliveries</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{driverDocs.length}</div>
                                    <p className="text-xs text-muted-foreground">Documents on file</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Detailed Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" /> Driver Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">License Number</span>
                                            <p className="font-medium">{driver.license_number || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">License Class</span>
                                            <p className="font-medium">{driver.license_class || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Address</span>
                                            <p className="font-medium">{driver.address || "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Joined</span>
                                            <p className="font-medium">{format(new Date(driver.created_at), "MMM d, yyyy")}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Next of Kin</span>
                                            <p className="font-medium">{driver.next_of_kin || "-"} ({driver.next_of_kin_phone || "-"})</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Guarantor</span>
                                            <p className="font-medium">{driver.guarantor_name || "-"} ({driver.guarantor_phone || "-"})</p>
                                            <p className="text-xs text-muted-foreground truncate">{driver.guarantor_address}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Compliance Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" /> Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {driverDocs.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">No documents tracked for this driver.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {driverDocs.map((doc) => {
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

                    <TabsContent value="wallet">
                        <DriverWallet driverId={driver.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
