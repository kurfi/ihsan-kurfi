import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLocation } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePaginatedOrders, useOrdersMetrics, useUpdateOrderStatus, useUpdateOrder, useConfirmDispatch, useConfirmPayment, useDeleteOrder, useReassignFleet, type Order, type ProductUnit, type OrderStatus } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useDepots, useProducts } from "@/hooks/useProductCatalog";
import { useTrucks, useDrivers } from "@/hooks/useFleet";
import { useSuppliers } from "@/hooks/usePurchases";
import { useDocuments } from "@/hooks/useDocuments";
import { useTripProfitability } from "@/hooks/useFinance";
import { useReconciliation } from "@/hooks/useReconciliation";
import { Plus, Package, ArrowRight, AlertCircle, FileText, Upload, MoreVertical, Printer, Edit, Trash2, UserPlus, Copy, Check } from "lucide-react";
import { format, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderCard } from "@/components/orders/OrderCard";
import { statusColors, formatStatus } from "@/components/orders/OrderPipeline";
import { OrderForm } from "@/components/orders/OrderForm";

import {
  generateLoadingManifest,
  generateWaybill,
  generateInvoice,
  generateGatePass
} from "@/lib/pdfGenerator";
import { ReconciliationDialog, ReconciliationData } from "@/components/orders/ReconciliationDialog";
import { supabase } from "@/integrations/supabase/client";

const statusPipeline: OrderStatus[] = ["requested", "dispatched", "delivered"];

function TripProfit({ orderId }: { orderId: string }) {
  const { data } = useTripProfitability(orderId);
  if (!data) return null;

  const profitColor = data.profit >= 0 ? "text-success" : "text-destructive";

  return (
    <div className="text-xs space-y-1">
      <div>Revenue: ₦{data.revenue.toLocaleString()}</div>
      <div>Expenses: ₦{data.expenses.toLocaleString()}</div>
      <div className={`font-semibold ${profitColor}`}>
        Profit: ₦{data.profit.toLocaleString()}
      </div>
    </div>
  );
}

export default function Orders() {
  const location = useLocation();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: paginatedData, isLoading: ordersLoading } = usePaginatedOrders(currentPage, pageSize);
  const orders = paginatedData?.orders || [];
  const totalOrders = paginatedData?.count || 0;

  const { data: metrics, isLoading: metricsLoading } = useOrdersMetrics();

  const isLoading = ordersLoading || metricsLoading;
  const { data: customers = [] } = useCustomers();
  const { data: depots = [] } = useDepots();
  const { data: products = [] } = useProducts();
  const { data: trucks = [] } = useTrucks();
  const { data: drivers = [] } = useDrivers();
  const { data: documents = [] } = useDocuments();
  const { data: suppliers = [] } = useSuppliers();

  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const confirmDispatch = useConfirmDispatch();
  const confirmPayment = useConfirmPayment();
  const reconciliation = useReconciliation();
  const deleteOrder = useDeleteOrder();
  const reassignFleet = useReassignFleet();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<"dispatcher" | "accountant" | "manager">("dispatcher");

  useEffect(() => {
    if (location.state?.openNewOrder) {
      setDialogOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSuccessOpen, setOtpSuccessOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ truck_id: "", driver_id: "" });
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToReassign, setOrderToReassign] = useState<Order | null>(null);
  const [reassignForm, setReassignForm] = useState({ truck_id: "", driver_id: "" });

  const [editForm, setEditForm] = useState({
    quantity: "",
    unit: "tons" as ProductUnit,
    delivery_address: "",
    notes: "",
    cement_type: "",
    waybill_number: "",
  });

  const [uploadingWaybill, setUploadingWaybill] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderToEdit) {
      setEditForm({
        quantity: orderToEdit.quantity.toString(),
        unit: orderToEdit.unit,
        delivery_address: orderToEdit.delivery_address || "",
        notes: orderToEdit.notes || "",
        cement_type: orderToEdit.cement_type,
        waybill_number: orderToEdit.waybill_number || "",
      });
    }
  }, [orderToEdit]);

  const hasExpiredDocs = (entityId: string, entityType: string) => {
    return documents.some(
      (d) => d.entity_id === entityId && d.entity_type === entityType && isPast(new Date(d.expiry_date))
    );
  };

  const getAvailableFleetUnits = () => {
    const busyTruckIds = metrics?.busyTruckIds || [];

    return trucks.filter((t) => {
      const hasDriver = !!t.driver_id && !!t.driver;
      if (!hasDriver) return false;

      const isTruckActive = t.is_active && !hasExpiredDocs(t.id, "truck");
      const isDriverActive = t.driver!.is_active && !hasExpiredDocs(t.driver!.id, "driver");
      const isAvailable = !busyTruckIds.includes(t.id);

      return isTruckActive && isDriverActive && isAvailable;
    });
  };

  const isFinancialCleared = (order: Order) => {
    if (order.payment_status === 'Confirmed') return true;
    const customer = customers.find((c) => c.id === order.customer_id);
    if (!customer) return true;
    const isWithinCredit = (customer.current_balance + (order.total_amount || 0)) <= customer.credit_limit;
    return isWithinCredit;
  };

  const handleNextStatus = (orderId: string, currentStatus: OrderStatus) => {
    const currentIndex = statusPipeline.indexOf(currentStatus);
    if (currentIndex < statusPipeline.length - 1) {
      const nextStatus = statusPipeline[currentIndex + 1];

      if (nextStatus === "dispatched") {
        const order = orders.find(o => o.id === orderId);
        if (order && !isFinancialCleared(order)) {
          toast({
            title: "Financial Clearance Required",
            description: "Order cannot be dispatched: Payment is pending or credit limit exceeded.",
            variant: "destructive"
          });
          return;
        }
        if (!order?.truck_id || !order?.driver_id) {
          setSelectedOrder(orderId);
          setAssignDialogOpen(true);
          return;
        }
      }

      if (nextStatus === "delivered") {
        setSelectedOrder(orderId);
        setReconciliationOpen(true);
        return;
      }

      updateStatus.mutate({ id: orderId, status: nextStatus });
    }
  };

  const handleReconciliation = async (data: ReconciliationData) => {
    if (!selectedOrder) return;
    reconciliation.mutate({
      orderId: selectedOrder,
      otp: data.otp,
      qtyGood: data.qtyGood,
      qtyMissing: data.qtyMissing,
      qtyDamaged: data.qtyDamaged,
      reason: data.reason,
    });
  };

  const handleAssignAndDispatch = () => {
    if (!selectedOrder || !assignForm.truck_id || !assignForm.driver_id) {
      toast({ title: "Please select both truck and driver", variant: "destructive" });
      return;
    }

    const order = orders.find(o => o.id === selectedOrder);
    if (order && !isFinancialCleared(order)) {
      toast({ title: "Financial Block", variant: "destructive" });
      return;
    }

    const selectedTruck = trucks.find(t => t.id === assignForm.truck_id);
    const selectedDriver = drivers.find(d => d.id === assignForm.driver_id);
    const fuelCost = selectedTruck?.default_fuel_cost || 0;
    const allowance = selectedDriver?.standard_allowance || 0;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    updateStatus.mutate({
      id: selectedOrder,
      status: "dispatched",
      truck_id: assignForm.truck_id,
      driver_id: assignForm.driver_id,
      delivery_otp: otp,
      fuel_cost: fuelCost,
      driver_allowance: allowance,
    }, {
      onSuccess: () => {
        setAssignDialogOpen(false);
        setGeneratedOtp(otp);
        setOtpSuccessOpen(true);
        setAssignForm({ truck_id: "", driver_id: "" });
      }
    });
  };

  const handlePrintLoadingManifest = (order: Order) => {
    if (!order.truck || !order.driver) {
      toast({ title: "Truck and driver must be assigned first", variant: "destructive" });
      return;
    }
    const manifestNumber = order.loading_manifest_number || `LM-${Date.now().toString().slice(-6)}`;
    if (!order.loading_manifest_number) {
      updateOrder.mutate({ id: order.id, loading_manifest_number: manifestNumber });
    }
    generateLoadingManifest(
      { ...order, loading_manifest_number: manifestNumber },
      order.customer!,
      order.driver!,
      order.truck!
    );
  };

  const handleWaybillUpload = async (orderId: string, file: File) => {
    setUploadingWaybill(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('waybills').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('waybills').getPublicUrl(fileName);
      updateOrder.mutate({ id: orderId, waybill_url: publicUrl });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingWaybill(false);
    }
  };

  const handleOrderAction = (action: string, orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    switch (action) {
      case 'view': setSelectedOrder(orderId); setDetailDialogOpen(true); break;
      case 'next': handleNextStatus(orderId, order.status); break;
      case 'manifest': handlePrintLoadingManifest(order); break;
      case 'confirm_payment': confirmPayment.mutate(orderId); break;
      case 'edit': setOrderToEdit(order); setEditDialogOpen(true); break;
      case 'delete': setOrderToDelete(order); setDeleteDialogOpen(true); break;
      case 'reassign': setOrderToReassign(order); setReassignDialogOpen(true); break;
    }
  };

  const handleEditOrder = () => {
    if (!orderToEdit) return;
    updateOrder.mutate({
      id: orderToEdit.id,
      quantity: parseFloat(editForm.quantity),
      unit: editForm.unit,
      delivery_address: editForm.delivery_address,
      notes: editForm.notes,
      cement_type: editForm.cement_type,
      waybill_number: editForm.waybill_number,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setOrderToEdit(null);
      }
    });
  };

  const selectedOrderData = orders.find(o => o.id === selectedOrder);

  return (
    <MainLayout title="Order Management">
      <div className="mobile-spacing animate-fade-in space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Order Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between overflow-x-auto pb-4 scrollbar-thin">
              {statusPipeline.map((status, index) => {
                const count = metrics?.counts?.[status] || 0;
                return (
                  <div key={status} className="flex items-center">
                    <div className="text-center min-w-[100px]">
                      <div className={`px-4 py-2 rounded-lg ${statusColors[status]} font-medium`}>
                        {formatStatus(status)}
                      </div>
                      <p className="text-2xl font-bold mt-2">{count}</p>
                    </div>
                    {index < statusPipeline.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground mx-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="heading-section">All Orders</h2>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-md text-xs">
              <Button size="sm" variant={userRole === 'dispatcher' ? 'secondary' : 'ghost'} onClick={() => setUserRole('dispatcher')}>Dispatcher</Button>
              <Button size="sm" variant={userRole === 'accountant' ? 'secondary' : 'ghost'} onClick={() => setUserRole('accountant')}>Accountant</Button>
            </div>
          </div>
          <div className="flex gap-2">

            <Button className="gradient-primary" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          </div>
        </div>

        {/* Create Order Dialog */}
        <OrderForm open={dialogOpen} onOpenChange={setDialogOpen} />

        {isLoading ? (
          <LoadingSkeleton variant="table" rows={5} />
        ) : orders.length === 0 ? (
          <EmptyState icon={Package} title="No orders yet" description="Create your first order to get started" />
        ) : (
          <Card className="shadow-card hidden md:block">
            <CardContent className="p-0">
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order # / Waybill</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Unit / Driver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-[10px] text-muted-foreground">{order.waybill_number || "No Waybill"}</div>
                        </TableCell>
                        <TableCell>{order.customer?.name}</TableCell>
                        <TableCell>{order.quantity} {order.unit === 'tons' ? 'T' : 'B'}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {formatStatus(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {order.truck?.plate_number} / {order.driver?.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleNextStatus(order.id, order.status)} disabled={(order.status === "delivered")}>Next</Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOrderAction('view', order.id)}>Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOrderAction('edit', order.id)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOrderAction('delete', order.id)} className="text-destructive">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
              <div className="flex items-center justify-between border-t p-4 pb-2">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + (orders.length > 0 ? 1 : 0)} to {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * pageSize >= totalOrders}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Overview and profit analysis for this order.</DialogDescription>
            </DialogHeader>
            {selectedOrderData && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Waybill #</p><p className="font-bold">{selectedOrderData.waybill_number || "-"}</p></div>
                  <div><p className="text-muted-foreground">OTP</p><code className="text-primary font-bold">{selectedOrderData.delivery_otp || "-"}</code></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div><p className="text-muted-foreground">Cement Purchase Price</p><p className="font-bold">₦{(selectedOrderData.cement_purchase_price || 0).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Cement Sale Price</p><p className="font-bold">₦{(selectedOrderData.cement_sale_price || 0).toLocaleString()}</p></div>
                </div>
                {selectedOrderData.cement_profit !== null && (
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div><p className="text-muted-foreground">Cement Profit</p><p className={`font-bold ${selectedOrderData.cement_profit >= 0 ? 'text-success' : 'text-destructive'}`}>₦{selectedOrderData.cement_profit.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Margin</p><p className="font-bold">{selectedOrderData.cement_margin_percent}%</p></div>
                  </div>
                )}
                <div className="border-t pt-2 mt-4"><TripProfit orderId={selectedOrderData.id} /></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Edit Trip / Order</DialogTitle>
              <DialogDescription>Update order information and notes.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Waybill Number</Label><Input value={editForm.waybill_number} onChange={(e) => setEditForm({ ...editForm, waybill_number: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
              <LoadingButton className="w-full" onClick={handleEditOrder} isLoading={updateOrder.isPending}>Update Trip</LoadingButton>
            </div>
          </DialogContent>
        </Dialog>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedOrder) handleWaybillUpload(selectedOrder, file);
        }} />

        {/* Assign Fleet Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Fleet Unit</DialogTitle>
              <DialogDescription>Select a truck and driver to dispatch this order.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={assignForm.truck_id} onValueChange={(tId) => setAssignForm({ truck_id: tId, driver_id: trucks.find(t => t.id === tId)?.driver_id || "" })}>
                <SelectTrigger><SelectValue placeholder="Select available truck" /></SelectTrigger>
                <SelectContent>
                  {getAvailableFleetUnits().map(u => <SelectItem key={u.id} value={u.id}>{u.plate_number} ({u.driver?.name})</SelectItem>)}
                </SelectContent>
              </Select>
              <LoadingButton className="w-full" onClick={handleAssignAndDispatch} isLoading={updateStatus.isPending}>Assign & Dispatch</LoadingButton>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reconciliation Dialog */}
        <ReconciliationDialog open={reconciliationOpen} onOpenChange={setReconciliationOpen} order={orders.find(o => o.id === selectedOrder) || null} onConfirm={handleReconciliation} />
      </div>
    </MainLayout>
  );
}
