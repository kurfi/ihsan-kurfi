import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { LoadingButton } from "@/components/ui/loading-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTrucks, useDrivers, useAddTruck, useAddDriver, useUpdateTruck, useUpdateDriver, useDeleteTruck, useDeleteDriver } from "@/hooks/useFleet";
import { useDocuments, useAddDocument, useUpdateDocument } from "@/hooks/useDocuments";
import { Truck, User, Plus, AlertTriangle, FileCheck, Calendar, FilePlus, Wrench, Gauge, Wallet, Pencil, Trash2, TrendingUp, Search } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { Database } from "@/integrations/supabase/types";
import { TruckCard } from "@/components/fleet/TruckCard";
import { DriverCard } from "@/components/fleet/DriverCard";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "react-router-dom";

type DocumentType = Database["public"]["Enums"]["document_type"];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "license", label: "License" },
  { value: "insurance", label: "Insurance" },
  { value: "road_worthiness", label: "Road Worthiness" },
  { value: "hackney_permit", label: "Hackney Permit" },
  { value: "heavy_duty_permit", label: "Heavy Duty Permit" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
];

const TRUCK_TYPES = ["Tipper", "Flatbed", "Tanker", "Trailer", "Other"];
const LICENSE_CLASSES = ["A", "B", "C", "D", "E", "F", "G"];

export default function Fleet() {
  const { data: trucks = [], isLoading: trucksLoading } = useTrucks();
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const { data: documents = [] } = useDocuments();
  const addTruck = useAddTruck();
  const addDriver = useAddDriver();
  const updateTruck = useUpdateTruck();
  const updateDriver = useUpdateDriver();
  const deleteTruck = useDeleteTruck();
  const deleteDriver = useDeleteDriver();
  const addDocument = useAddDocument();
  const updateDocument = useUpdateDocument();
  const navigate = useNavigate();

  const [truckForm, setTruckForm] = useState({
    plate_number: "",
    model: "",
    capacity_tons: "",
    is_active: true,
    chassis_number: "",
    truck_type: "",
    current_mileage: "",
    service_interval_km: "10000",
    driver_id: "null", // String "null" for Select placeholder
    default_fuel_cost: "",
  });

  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    email: "",
    is_active: true,
    address: "",
    next_of_kin: "",
    next_of_kin_phone: "",
    guarantor_name: "",
    guarantor_phone: "",
    guarantor_address: "",
    license_number: "",
    license_class: "",
    standard_allowance: "",
  });

  const [driverSortBy, setDriverSortBy] = useState("name_asc");
  const [truckSortBy, setTruckSortBy] = useState("plate_asc");
  const [truckSearch, setTruckSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");


  const [docForm, setDocForm] = useState({
    document_type: "" as DocumentType | "",
    entity_type: "",
    entity_id: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
  });

  const [truckDialogOpen, setTruckDialogOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [editTruckDialogOpen, setEditTruckDialogOpen] = useState(false);
  const [editDriverDialogOpen, setEditDriverDialogOpen] = useState(false);
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    actionLabel?: string;
    onConfirm: () => void;
  }>({ title: "", description: "", onConfirm: () => { } });


  const formatDocType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getDocumentStatus = (entityId: string, entityType: string) => {
    const entityDocs = documents.filter(
      (d) => d.entity_id === entityId && d.entity_type === entityType
    );
    const hasExpired = entityDocs.some((d) => isPast(new Date(d.expiry_date)));
    const hasExpiring = entityDocs.some((d) => {
      const days = differenceInDays(new Date(d.expiry_date), new Date());
      return days <= 30 && days > 0;
    });

    if (hasExpired) return "expired";
    if (hasExpiring) return "warning";
    return "valid";
  };

  const handleAddTruck = () => {
    addTruck.mutate({
      plate_number: truckForm.plate_number,
      model: truckForm.model || null,
      capacity_tons: truckForm.capacity_tons ? parseFloat(truckForm.capacity_tons) : null,
      is_active: truckForm.is_active,
      chassis_number: truckForm.chassis_number || null,
      truck_type: truckForm.truck_type || null,
      driver_id: truckForm.driver_id === "null" || !truckForm.driver_id ? null : truckForm.driver_id,
    }, {
      onSuccess: () => {
        setTruckDialogOpen(false);
        setTruckForm({
          plate_number: "", model: "", capacity_tons: "", is_active: true,
          chassis_number: "", truck_type: "",
          driver_id: "null"
        });
      }
    });
  };

  const handleAddDriver = () => {
    addDriver.mutate({
      name: driverForm.name,
      phone: driverForm.phone || null,
      email: driverForm.email || null,
      is_active: driverForm.is_active,
      address: driverForm.address || null,
      next_of_kin: driverForm.next_of_kin || null,
      next_of_kin_phone: driverForm.next_of_kin_phone || null,
      guarantor_name: driverForm.guarantor_name || null,
      guarantor_phone: driverForm.guarantor_phone || null,
      guarantor_address: driverForm.guarantor_address || null,
      license_number: driverForm.license_number || null,
      license_class: driverForm.license_class || null,
    }, {
      onSuccess: () => {
        setDriverDialogOpen(false);
        setDriverForm({
          name: "", phone: "", email: "", is_active: true, address: "",
          next_of_kin: "", next_of_kin_phone: "", guarantor_name: "",
          guarantor_phone: "", guarantor_address: "", license_number: "", license_class: "",
        });
      }
    });
  };

  const handleSaveDocument = () => {
    if (!docForm.document_type || !docForm.entity_type || !docForm.entity_id || !docForm.expiry_date) return;

    // Check if document of this type already exists for this entity (when adding new)
    if (!editingDocId) {
      const existingDoc = documents.find(d =>
        d.entity_id === docForm.entity_id &&
        d.document_type === docForm.document_type
      );

      if (existingDoc) {
        if (confirm(`A document of type "${formatDocType(docForm.document_type)}" already exists for this entity. Would you like to renew it instead?`)) {
          setEditingDocId(existingDoc.id);
          // Keep the form values but now it will update instead of insert
        } else {
          return;
        }
      }
    }

    if (editingDocId) {
      updateDocument.mutate({
        id: editingDocId,
        document_number: docForm.document_number,
        issue_date: docForm.issue_date || null,
        expiry_date: docForm.expiry_date,
      }, {
        onSuccess: () => {
          setDocDialogOpen(false);
          setEditingDocId(null);
          setDocForm({
            document_type: "", entity_type: "", entity_id: "",
            document_number: "", issue_date: "", expiry_date: "",
          });
        }
      });
    } else {
      addDocument.mutate({
        document_type: docForm.document_type as DocumentType,
        entity_type: docForm.entity_type,
        entity_id: docForm.entity_id,
        document_number: docForm.document_number || undefined,
        issue_date: docForm.issue_date || undefined,
        expiry_date: docForm.expiry_date,
      }, {
        onSuccess: () => {
          setDocDialogOpen(false);
          setDocForm({
            document_type: "", entity_type: "", entity_id: "",
            document_number: "", issue_date: "", expiry_date: "",
          });
        }
      });
    }
  };

  const handleRenewDocument = (doc: any) => {
    setEditingDocId(doc.id);
    setDocForm({
      document_type: doc.document_type,
      entity_type: doc.entity_type,
      entity_id: doc.entity_id,
      document_number: doc.document_number || "",
      issue_date: doc.issue_date || "",
      expiry_date: "", // User must provide new expiry
    });
    setDocDialogOpen(true);
  };

  const handleOpenEditTruck = (truck: typeof trucks[0]) => {
    setEditingTruckId(truck.id);
    setTruckForm({
      plate_number: truck.plate_number,
      model: truck.model || "",
      capacity_tons: truck.capacity_tons?.toString() || "",
      is_active: truck.is_active,
      chassis_number: truck.chassis_number || "",
      truck_type: truck.truck_type || "",
      driver_id: truck.driver_id || "null",
    });
    setEditTruckDialogOpen(true);
  };

  const handleEditTruck = () => {
    if (!editingTruckId) return;
    updateTruck.mutate({
      id: editingTruckId,
      plate_number: truckForm.plate_number,
      model: truckForm.model || null,
      capacity_tons: truckForm.capacity_tons ? parseFloat(truckForm.capacity_tons) : null,
      is_active: truckForm.is_active,
      chassis_number: truckForm.chassis_number || null,
      truck_type: truckForm.truck_type || null,
      driver_id: truckForm.driver_id === "null" || !truckForm.driver_id ? null : truckForm.driver_id,
    }, {
      onSuccess: () => {
        setEditTruckDialogOpen(false);
        setEditingTruckId(null);
        setTruckForm({
          plate_number: "", model: "", capacity_tons: "", is_active: true,
          chassis_number: "", truck_type: "",
          driver_id: "null"
        });
      }
    });
  };

  const handleDeleteTruck = (id: string, plate: string) => {
    setConfirmConfig({
      title: "Deactivate Truck",
      description: `Are you sure you want to deactivate truck ${plate}?`,
      actionLabel: "Deactivate",
      onConfirm: () => deleteTruck.mutate(id),
    });
    setConfirmDialogOpen(true);
  };


  const handleOpenEditDriver = (driver: typeof drivers[0]) => {
    setEditingDriverId(driver.id);
    setDriverForm({
      name: driver.name,
      phone: driver.phone || "",
      email: driver.email || "",
      is_active: driver.is_active,
      address: driver.address || "",
      next_of_kin: driver.next_of_kin || "",
      next_of_kin_phone: driver.next_of_kin_phone || "",
      guarantor_name: driver.guarantor_name || "",
      guarantor_phone: driver.guarantor_phone || "",
      guarantor_address: driver.guarantor_address || "",
      license_number: driver.license_number || "",
      license_class: driver.license_class || "",
      standard_allowance: driver.standard_allowance?.toString() || "",
    });
    setEditDriverDialogOpen(true);
  };

  const handleEditDriver = () => {
    if (!editingDriverId) return;
    updateDriver.mutate({
      id: editingDriverId,
      name: driverForm.name,
      phone: driverForm.phone || null,
      email: driverForm.email || null,
      is_active: driverForm.is_active,
      address: driverForm.address || null,
      next_of_kin: driverForm.next_of_kin || null,
      next_of_kin_phone: driverForm.next_of_kin_phone || null,
      guarantor_name: driverForm.guarantor_name || null,
      guarantor_phone: driverForm.guarantor_phone || null,
      guarantor_address: driverForm.guarantor_address || null,
      license_number: driverForm.license_number || null,
      license_class: driverForm.license_class || null,
    }, {
      onSuccess: () => {
        setEditDriverDialogOpen(false);
        setEditingDriverId(null);
        setDriverForm({
          name: "", phone: "", email: "", is_active: true, address: "",
          next_of_kin: "", next_of_kin_phone: "", guarantor_name: "",
          guarantor_phone: "", guarantor_address: "", license_number: "", license_class: "",
        });
      }
    });
  };

  const handleDeleteDriver = (id: string, name: string) => {
    setConfirmConfig({
      title: "Deactivate Driver",
      description: `Are you sure you want to deactivate driver ${name}?`,
      actionLabel: "Deactivate",
      onConfirm: () => deleteDriver.mutate(id),
    });
    setConfirmDialogOpen(true);
  };


  const expiringDocs = documents.filter((doc) => {
    const days = differenceInDays(new Date(doc.expiry_date), new Date());
    return days <= 30 || isPast(new Date(doc.expiry_date));
  });

  const getEntityOptions = () => {
    if (docForm.entity_type === "truck") {
      return trucks.map(t => ({ id: t.id, label: t.plate_number }));
    } else if (docForm.entity_type === "driver") {
      return drivers.map(d => ({ id: d.id, label: d.name }));
    }
    return [];
  };


  const filteredTrucks = trucks.filter(truck =>
    truck.plate_number.toLowerCase().includes(truckSearch.toLowerCase()) ||
    (truck.truck_type && truck.truck_type.toLowerCase().includes(truckSearch.toLowerCase())) ||
    (truck.model && truck.model.toLowerCase().includes(truckSearch.toLowerCase()))
  );

  const sortedTrucks = [...filteredTrucks].sort((a, b) => {
    if (truckSortBy === "plate_asc") {
      return a.plate_number.localeCompare(b.plate_number);
    } else if (truckSortBy === "plate_desc") {
      return b.plate_number.localeCompare(a.plate_number);
    } else if (truckSortBy === "status") {
      // Active first, then inactive
      if (a.is_active === b.is_active) return 0;
      return a.is_active ? -1 : 1;
    }
    return 0;
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
    (driver.phone && driver.phone.includes(driverSearch))
  );

  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (driverSortBy === "name_asc") {
      return a.name.localeCompare(b.name);
    } else if (driverSortBy === "name_desc") {
      return b.name.localeCompare(a.name);
    } else if (driverSortBy === "status") {
      // Active first, then inactive
      if (a.is_active === b.is_active) return 0;
      return a.is_active ? -1 : 1;
    }
    return 0;
  });

  const filteredDocuments = documents.map(doc => ({
    ...doc,
    entity_name: doc.entity_type === "truck"
      ? trucks.find(t => t.id === doc.entity_id)?.plate_number
      : drivers.find(d => d.id === doc.entity_id)?.name
  })).filter(doc =>
    doc.document_type.toLowerCase().includes(docSearch.toLowerCase()) ||
    (doc.entity_name && doc.entity_name.toLowerCase().includes(docSearch.toLowerCase())) ||
    (doc.document_number && doc.document_number.toLowerCase().includes(docSearch.toLowerCase()))
  );

  return (
    <MainLayout title="Fleet & Compliance">
      <Tabs defaultValue="trucks" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="trucks" className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> Trucks
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Drivers
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> Documents
            {expiringDocs.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {expiringDocs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Trucks Tab */}
        <TabsContent value="trucks" className="animate-fade-in space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-4 sm:p-6">
              <CardTitle className="heading-section">Fleet Vehicles</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trucks..."
                    value={truckSearch}
                    onChange={(e) => setTruckSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={truckSortBy} onValueChange={setTruckSortBy}>

                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plate_asc">Plate Number (A-Z)</SelectItem>
                    <SelectItem value="plate_desc">Plate Number (Z-A)</SelectItem>
                    <SelectItem value="status">Status (Active First)</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={truckDialogOpen} onOpenChange={setTruckDialogOpen}>
                  <Button className="gradient-primary size-sm mobile-compact" onClick={() => setTruckDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Add Truck</span><span className="sm:hidden">Add</span>
                  </Button>
                  <DialogContent className="max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Add New Truck</DialogTitle>
                      <DialogDescription>Register a new vehicle in the fleet.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="space-y-4">
                          <h3 className="body-small font-semibold uppercase tracking-wide">Vehicle Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Plate Number *</Label>
                              <Input
                                value={truckForm.plate_number}
                                onChange={(e) => setTruckForm({ ...truckForm, plate_number: e.target.value })}
                                placeholder="LAG-123-XY"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Truck Type</Label>
                              <Select value={truckForm.truck_type} onValueChange={(v) => setTruckForm({ ...truckForm, truck_type: v })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TRUCK_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Model</Label>
                              <Input
                                value={truckForm.model}
                                onChange={(e) => setTruckForm({ ...truckForm, model: e.target.value })}
                                placeholder="Mercedes Actros"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Capacity (Tons)</Label>
                              <Input
                                type="number"
                                value={truckForm.capacity_tons}
                                onChange={(e) => setTruckForm({ ...truckForm, capacity_tons: e.target.value })}
                                placeholder="30"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Chassis Number</Label>
                              <Input
                                value={truckForm.chassis_number}
                                onChange={(e) => setTruckForm({ ...truckForm, chassis_number: e.target.value })}
                                placeholder="ABC123456789"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Assigned Driver</Label>
                              <Select
                                value={truckForm.driver_id}
                                onValueChange={(v) => setTruckForm({ ...truckForm, driver_id: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select driver" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="null">Unassigned</SelectItem>
                                  {drivers.filter(d => d.is_active).map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>


                        <LoadingButton
                          onClick={handleAddTruck}
                          className="w-full"
                          disabled={!truckForm.plate_number}
                          isLoading={addTruck.isPending}
                        >
                          Add Truck
                        </LoadingButton>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {trucksLoading ? (
                <div className="p-4 sm:p-0">
                  <LoadingSkeleton variant="table" rows={5} />
                </div>
              ) : trucks.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="No trucks found"
                  description="Add your first truck to the fleet"
                  action={{ label: "Add Truck", onClick: () => setTruckDialogOpen(true) }}
                />
              ) : (
                <>
                  {/* Mobile View: Cards */}
                  <div className="md:hidden grid gap-4 p-4">
                    {sortedTrucks.map((truck) => (
                      <TruckCard
                        key={truck.id}
                        truck={truck}
                        docStatus={getDocumentStatus(truck.id, "truck") as "valid" | "warning" | "expired"}
                        maintenanceStatus={null}
                        onEdit={() => handleOpenEditTruck(truck)}
                        onDelete={() => handleDeleteTruck(truck.id, truck.plate_number)}
                      />
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <ResponsiveTable>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plate Number</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Compliance</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedTrucks.map((truck) => {
                            const docStatus = getDocumentStatus(truck.id, "truck");
                            return (
                              <TableRow key={truck.id}>
                                <TableCell className="font-medium">{truck.plate_number}</TableCell>
                                <TableCell>{truck.truck_type || "-"}</TableCell>
                                <TableCell>{truck.model || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{truck.capacity_tons ? `${truck.capacity_tons}T` : "-"}</span>
                                    {truck.driver_id && (
                                      <span className="text-xs text-muted-foreground">
                                        {drivers.find(d => d.id === truck.driver_id)?.name || "Unknown Driver"}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {truck.current_mileage ? (
                                    <span className="flex items-center gap-1">
                                      <Gauge className="w-3 h-3" />
                                      {truck.current_mileage.toLocaleString()} km
                                    </span>
                                  ) : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={truck.is_active ? "default" : "secondary"}>
                                    {truck.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    docStatus === "expired" ? "destructive" :
                                      docStatus === "warning" ? "secondary" : "default"
                                  } className={docStatus === "valid" ? "bg-success text-success-foreground" : ""}>
                                    {docStatus === "expired" ? "Expired Docs" :
                                      docStatus === "warning" ? "Expiring Soon" : "Valid"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/fleet/truck/${truck.id}`)}
                                      aria-label="View Truck"
                                    >
                                      <Gauge className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEditTruck(truck)}
                                      aria-label="Edit Truck"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTruck(truck.id, truck.plate_number)}
                                      disabled={deleteTruck.isPending}
                                      className="text-destructive hover:bg-destructive/10"
                                      aria-label="Deactivate Truck"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ResponsiveTable>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="animate-fade-in space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-4 sm:p-6">
              <CardTitle className="heading-section">Drivers</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drivers..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={driverSortBy} onValueChange={setDriverSortBy}>

                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                    <SelectItem value="status">Status (Active First)</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
                  <Button className="gradient-primary size-sm mobile-compact" onClick={() => setDriverDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Add Driver</span><span className="sm:hidden">Add</span>
                  </Button>
                  <DialogContent className="max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Add New Driver</DialogTitle>
                      <DialogDescription>Register a new driver for the fleet.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-6 py-4">
                        {/* Personal Info */}
                        <div className="space-y-4">
                          <h3 className="body-small font-semibold uppercase tracking-wide">Personal Information</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Full Name *</Label>
                              <Input
                                value={driverForm.name}
                                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone *</Label>
                              <Input
                                value={driverForm.phone}
                                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                                placeholder="+234..."
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Address *</Label>
                              <Textarea
                                value={driverForm.address}
                                onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                                placeholder="Driver's residential address"
                              />
                            </div>
                          </div>
                        </div>

                        {/* License Details */}
                        <div className="space-y-4">
                          <h3 className="body-small font-semibold uppercase tracking-wide">License Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>License Number</Label>
                              <Input
                                value={driverForm.license_number}
                                onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                                placeholder="DL123456789"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Next of Kin */}
                        <div className="space-y-4">
                          <h3 className="body-small font-semibold uppercase tracking-wide">Next of Kin</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Name *</Label>
                              <Input
                                value={driverForm.next_of_kin}
                                onChange={(e) => setDriverForm({ ...driverForm, next_of_kin: e.target.value })}
                                placeholder="Jane Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone *</Label>
                              <Input
                                value={driverForm.next_of_kin_phone}
                                onChange={(e) => setDriverForm({ ...driverForm, next_of_kin_phone: e.target.value })}
                                placeholder="+234..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Guarantor */}
                        <div className="space-y-4">
                          <h3 className="body-small font-semibold uppercase tracking-wide">Guarantor</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Name *</Label>
                              <Input
                                value={driverForm.guarantor_name}
                                onChange={(e) => setDriverForm({ ...driverForm, guarantor_name: e.target.value })}
                                placeholder="Guarantor name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Phone *</Label>
                              <Input
                                value={driverForm.guarantor_phone}
                                onChange={(e) => setDriverForm({ ...driverForm, guarantor_phone: e.target.value })}
                                placeholder="+234..."
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Address *</Label>
                              <Textarea
                                value={driverForm.guarantor_address}
                                onChange={(e) => setDriverForm({ ...driverForm, guarantor_address: e.target.value })}
                                placeholder="Guarantor's address"
                              />
                            </div>
                          </div>
                        </div>

                        <LoadingButton
                          onClick={handleAddDriver}
                          className="w-full"
                          disabled={
                            !driverForm.name ||
                            !driverForm.phone ||
                            !driverForm.address ||
                            !driverForm.next_of_kin ||
                            !driverForm.next_of_kin_phone ||
                            !driverForm.guarantor_name ||
                            !driverForm.guarantor_phone ||
                            !driverForm.guarantor_address
                          }
                          isLoading={addDriver.isPending}
                        >
                          Add Driver
                        </LoadingButton>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {driversLoading ? (
                <div className="p-4 sm:p-0">
                  <LoadingSkeleton variant="table" rows={5} />
                </div>
              ) : drivers.length === 0 ? (
                <EmptyState
                  icon={User}
                  title="No drivers found"
                  description="Add your first driver to the fleet"
                  action={{ label: "Add Driver", onClick: () => setDriverDialogOpen(true) }}
                />
              ) : (
                <>
                  {/* Mobile View: Cards */}
                  <div className="md:hidden grid gap-4 p-4">
                    {sortedDrivers.map((driver) => {
                      const docStatus = getDocumentStatus(driver.id, "driver");
                      const successRate = driver.total_deliveries && driver.total_deliveries > 0
                        ? Math.round((driver.successful_deliveries || 0) / driver.total_deliveries * 100)
                        : null;
                      return (
                        <DriverCard
                          key={driver.id}
                          driver={driver}
                          docStatus={docStatus as "valid" | "warning" | "expired"}
                          successRate={successRate}
                        />
                      );
                    })}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <ResponsiveTable>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Deliveries</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Compliance</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedDrivers.map((driver) => {
                            const docStatus = getDocumentStatus(driver.id, "driver");
                            const successRate = driver.total_deliveries && driver.total_deliveries > 0
                              ? Math.round((driver.successful_deliveries || 0) / driver.total_deliveries * 100)
                              : null;
                            return (
                              <TableRow key={driver.id}>
                                <TableCell className="font-medium">{driver.name}</TableCell>
                                <TableCell>{driver.phone || "-"}</TableCell>
                                <TableCell>
                                  {driver.license_number || "-"}
                                </TableCell>
                                <TableCell>
                                  {driver.total_deliveries ? (
                                    <span className="text-sm">
                                      {driver.successful_deliveries || 0}/{driver.total_deliveries}
                                      {successRate !== null && (
                                        <span className={`ml-1 ${successRate >= 90 ? "text-success" : successRate >= 70 ? "text-warning" : "text-destructive"}`}>
                                          ({successRate}%)
                                        </span>
                                      )}
                                    </span>
                                  ) : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={driver.is_active ? "default" : "secondary"}>
                                    {driver.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    docStatus === "expired" ? "destructive" :
                                      docStatus === "warning" ? "secondary" : "default"
                                  } className={docStatus === "valid" ? "bg-success text-success-foreground" : ""}>
                                    {docStatus === "expired" ? "Expired Docs" :
                                      docStatus === "warning" ? "Expiring Soon" : "Valid"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/fleet/driver/${driver.id}`)}
                                      aria-label="View Driver"
                                    >
                                      <User className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEditDriver(driver)}
                                      aria-label="Edit Driver"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteDriver(driver.id, driver.name)}
                                      disabled={deleteDriver.isPending}
                                      className="text-destructive hover:bg-destructive/10"
                                      aria-label="Deactivate Driver"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ResponsiveTable>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="animate-fade-in space-y-4">
          <Card className={`shadow-card ${expiringDocs.length > 0 ? "border-destructive/30" : ""}`}>
            <CardHeader className={`p-4 sm:p-6 ${expiringDocs.length > 0 ? "bg-destructive/5" : ""}`}>
              <CardTitle className="heading-section flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${expiringDocs.length > 0 ? "text-destructive" : "text-success"}`} />
                Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {expiringDocs.length === 0 ? (
                <div className="py-12 text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-lg font-medium">All documents are up to date!</p>
                  <p className="text-muted-foreground">No documents expiring within the next 30 days</p>
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="md:hidden grid gap-4 p-4">
                    {expiringDocs.map((doc) => {
                      const isExpired = isPast(new Date(doc.expiry_date));
                      const days = differenceInDays(new Date(doc.expiry_date), new Date());
                      return (
                        <Card key={doc.id} className={isExpired ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{formatDocType(doc.document_type)}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  {doc.entity_type === "truck" ? <Truck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {doc.entity_name || doc.entity_id.slice(0, 8)}
                                </div>
                              </div>
                              <Badge variant={isExpired ? "destructive" : "secondary"}>
                                {isExpired ? "EXPIRED" : `${days} days left`}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Expires: {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleRenewDocument(doc)}
                            >
                              Renew Document
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <ResponsiveTable>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Type</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expiringDocs.map((doc) => {
                            const isExpired = isPast(new Date(doc.expiry_date));
                            const days = differenceInDays(new Date(doc.expiry_date), new Date());
                            return (
                              <TableRow key={doc.id} className={isExpired ? "bg-destructive/5" : ""}>
                                <TableCell className="font-medium">{formatDocType(doc.document_type)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {doc.entity_type === "truck" ? (
                                      <Truck className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <User className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    {doc.entity_name || doc.entity_id.slice(0, 8)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={isExpired ? "destructive" : "secondary"}>
                                    {isExpired ? "EXPIRED" : `${days} days left`}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRenewDocument(doc)}
                                  >
                                    Renew
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ResponsiveTable>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 heading-section">
                <FileCheck className="w-5 h-5" />
                All Documents
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Dialog open={docDialogOpen} onOpenChange={(open) => {
                  setDocDialogOpen(open);
                  if (!open) {
                    setEditingDocId(null);
                    setDocForm({
                      document_type: "", entity_type: "", entity_id: "",
                      document_number: "", issue_date: "", expiry_date: "",
                    });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary size-sm mobile-compact">
                      <FilePlus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Add Document</span><span className="sm:hidden">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingDocId ? "Renew Document" : "Add New Document"}</DialogTitle>
                      <DialogDescription>
                        {editingDocId ? "Update registration and expiry for renewal." : "Upload or record a new compliance document."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Document Type *</Label>
                        <Select
                          disabled={!!editingDocId}
                          value={docForm.document_type}
                          onValueChange={(v: DocumentType) => setDocForm({ ...docForm, document_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(dt => (
                              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Entity Type *</Label>
                        <Select
                          value={docForm.entity_type}
                          onValueChange={(v) => setDocForm({ ...docForm, entity_type: v, entity_id: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="driver">Driver</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {docForm.entity_type && (
                        <div className="space-y-2">
                          <Label>{docForm.entity_type === "truck" ? "Truck" : "Driver"} *</Label>
                          <Select
                            disabled={!!editingDocId}
                            value={docForm.entity_id}
                            onValueChange={(v) => setDocForm({ ...docForm, entity_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${docForm.entity_type}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {getEntityOptions().map((opt) => (
                                <SelectItem key={opt.id} value={opt.id}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Document Number</Label>
                        <Input
                          value={docForm.document_number}
                          onChange={(e) => setDocForm({ ...docForm, document_number: e.target.value })}
                          placeholder="DOC-12345"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Issue Date</Label>
                          <Input
                            type="date"
                            value={docForm.issue_date}
                            onChange={(e) => setDocForm({ ...docForm, issue_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiry Date *</Label>
                          <Input
                            type="date"
                            value={docForm.expiry_date}
                            onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })}
                          />
                        </div>
                      </div>

                      <LoadingButton
                        onClick={handleSaveDocument}
                        className="w-full"
                        disabled={!docForm.document_type || !docForm.entity_type || !docForm.entity_id || !docForm.expiry_date}
                        isLoading={addDocument.isPending || updateDocument.isPending}
                      >
                        {editingDocId ? "Renew Document" : "Add Document"}
                      </LoadingButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {documents.length === 0 ? (
                <EmptyState
                  icon={FileCheck}
                  title="No documents records"
                  description="Add usage documents to track compliance"
                  action={{ label: "Add Document", onClick: () => setDocDialogOpen(true) }}
                />
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="md:hidden grid gap-4 p-4">
                    {filteredDocuments.map((doc) => {
                      const isExpired = isPast(new Date(doc.expiry_date));
                      const days = differenceInDays(new Date(doc.expiry_date), new Date());
                      const isExpiring = days <= 30 && days > 0;
                      return (
                        <Card key={doc.id} className="hover-lift">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{formatDocType(doc.document_type)}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  {doc.entity_type === "truck" ? <Truck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {doc.entity_name || doc.entity_id.slice(0, 8)}
                                </div>
                              </div>
                              <Badge variant={
                                isExpired ? "destructive" :
                                  isExpiring ? "secondary" : "default"
                              } className={!isExpired && !isExpiring ? "bg-success text-success-foreground" : ""}>
                                {isExpired ? "Expired" : isExpiring ? "Expiring" : "Valid"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                              <div>
                                <span className="text-muted-foreground block text-xs">Number</span>
                                {doc.document_number || "-"}
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground block text-xs">Expires</span>
                                {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleRenewDocument(doc)}
                            >
                              Renew Document
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <ResponsiveTable>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Type</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Document Number</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => {
                            const isExpired = isPast(new Date(doc.expiry_date));
                            const days = differenceInDays(new Date(doc.expiry_date), new Date());
                            const isExpiring = days <= 30 && days > 0;
                            return (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">{formatDocType(doc.document_type)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {doc.entity_type === "truck" ? (
                                      <Truck className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <User className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    {doc.entity_name || doc.entity_id.slice(0, 8)}
                                  </div>
                                </TableCell>
                                <TableCell>{doc.document_number || "-"}</TableCell>
                                <TableCell>{format(new Date(doc.expiry_date), "MMM d, yyyy")}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    isExpired ? "destructive" :
                                      isExpiring ? "secondary" : "default"
                                  } className={!isExpired && !isExpiring ? "bg-success text-success-foreground" : ""}>
                                    {isExpired ? "Expired" : isExpiring ? `${days} days` : "Valid"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRenewDocument(doc)}
                                  >
                                    Renew
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ResponsiveTable>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Edit Truck Dialog */}
      <Dialog open={editTruckDialogOpen} onOpenChange={(open) => {
        setEditTruckDialogOpen(open);
        if (!open) {
          setEditingTruckId(null);
          setTruckForm({
            plate_number: "", model: "", capacity_tons: "", is_active: true,
            chassis_number: "", truck_type: "", last_service_date: "",
            next_service_date: "", current_mileage: "", service_interval_km: "10000",
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Truck</DialogTitle>
            <DialogDescription>Update vehicle and maintenance information.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="body-small font-semibold uppercase tracking-wide">Vehicle Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plate Number *</Label>
                    <Input
                      value={truckForm.plate_number}
                      onChange={(e) => setTruckForm({ ...truckForm, plate_number: e.target.value })}
                      placeholder="LAG-123-XY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Truck Type</Label>
                    <Select value={truckForm.truck_type} onValueChange={(v) => setTruckForm({ ...truckForm, truck_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRUCK_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={truckForm.model}
                      onChange={(e) => setTruckForm({ ...truckForm, model: e.target.value })}
                      placeholder="Mercedes Actros"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity (Tons)</Label>
                    <Input
                      type="number"
                      value={truckForm.capacity_tons}
                      onChange={(e) => setTruckForm({ ...truckForm, capacity_tons: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Chassis Number</Label>
                    <Input
                      value={truckForm.chassis_number}
                      onChange={(e) => setTruckForm({ ...truckForm, chassis_number: e.target.value })}
                      placeholder="ABC123456789"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Assigned Driver</Label>
                    <Select
                      value={truckForm.driver_id}
                      onValueChange={(v) => setTruckForm({ ...truckForm, driver_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Unassigned</SelectItem>
                        {drivers.filter(d => d.is_active).map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <LoadingButton
                onClick={handleEditTruck}
                className="w-full"
                disabled={!truckForm.plate_number}
                isLoading={updateTruck.isPending}
              >
                Save Changes
              </LoadingButton>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={editDriverDialogOpen} onOpenChange={(open) => {
        setEditDriverDialogOpen(open);
        if (!open) {
          setEditingDriverId(null);
          setDriverForm({
            name: "", phone: "", email: "", is_active: true, address: "",
            next_of_kin: "", next_of_kin_phone: "", guarantor_name: "",
            guarantor_phone: "", guarantor_address: "", license_number: "", license_class: "",
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver personal and license information.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="body-small font-semibold uppercase tracking-wide">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      placeholder="+234..."
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address *</Label>
                    <Textarea
                      value={driverForm.address}
                      onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      placeholder="Driver's residential address"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="body-small font-semibold uppercase tracking-wide">License Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input
                      value={driverForm.license_number}
                      onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                      placeholder="DL123456789"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="body-small font-semibold uppercase tracking-wide">Next of Kin</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={driverForm.next_of_kin}
                      onChange={(e) => setDriverForm({ ...driverForm, next_of_kin: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={driverForm.next_of_kin_phone}
                      onChange={(e) => setDriverForm({ ...driverForm, next_of_kin_phone: e.target.value })}
                      placeholder="+234..."
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="body-small font-semibold uppercase tracking-wide">Guarantor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={driverForm.guarantor_name}
                      onChange={(e) => setDriverForm({ ...driverForm, guarantor_name: e.target.value })}
                      placeholder="Guarantor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={driverForm.guarantor_phone}
                      onChange={(e) => setDriverForm({ ...driverForm, guarantor_phone: e.target.value })}
                      placeholder="+234..."
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address *</Label>
                    <Textarea
                      value={driverForm.guarantor_address}
                      onChange={(e) => setDriverForm({ ...driverForm, guarantor_address: e.target.value })}
                      placeholder="Guarantor's address"
                    />
                  </div>
                </div>
              </div>
              <LoadingButton
                onClick={handleEditDriver}
                className="w-full"
                disabled={
                  !driverForm.name ||
                  !driverForm.phone ||
                  !driverForm.address ||
                  !driverForm.next_of_kin ||
                  !driverForm.next_of_kin_phone ||
                  !driverForm.guarantor_name ||
                  !driverForm.guarantor_phone ||
                  !driverForm.guarantor_address
                }
                isLoading={updateDriver.isPending}
              >
                Save Changes
              </LoadingButton>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
