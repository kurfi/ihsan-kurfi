import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { LoadingButton } from "@/components/ui/loading-button";
import { Plus } from "lucide-react";
import { useCreateOrder, type OrderType } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useDepots, useProducts } from "@/hooks/useProductCatalog";
import { useSuppliers } from "@/hooks/usePurchases";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface OrderFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrderForm({ open, onOpenChange }: OrderFormProps) {
    const { toast } = useToast();
    const createOrder = useCreateOrder();
    const { data: customers = [] } = useCustomers();
    const { data: depots = [] } = useDepots();
    const { data: products = [] } = useProducts();
    const { data: suppliers = [] } = useSuppliers();

    const [form, setForm] = useState({
        customer_id: "",
        order_type: "depot_dispatch" as OrderType,
        depot_id: "",
        supplier_id: "",
        cement_type: "Portland Cement",
        quantity: "",
        unit: "bags" as "tons" | "bags",
        payment_terms: "COD",
        delivery_address: "",
        is_direct_drop: true,
        notes: "",
        waybill_number: "",
        atc_number: "",
        cap_number: "",
    });

    const [automatedPricing, setAutomatedPricing] = useState({
        purchase_price: 0,
        sale_price: 0,
    });

    // Automatically update pricing when relevant fields change
    useEffect(() => {
        const selectedDepotId = form.order_type === "depot_dispatch" ? form.depot_id : undefined;
        // In this system, even for plant direct, we might have a 'Depot' record representing the Plant in the inventory table
        // Or we match by supplier if applicable. Let's assume for now prices are linked to Depots/Sources.

        const matchingProduct = products.find(p =>
            p.cement_type === form.cement_type &&
            (selectedDepotId ? p.depot_id === selectedDepotId : true)
        );

        const customer = customers.find(c => c.id === form.customer_id);
        const priceTier = customer?.price_tier || "End-User";

        if (matchingProduct) {
            let salePrice = 0;
            let costPrice = 0;

            // Always use bag price as the base
            const baseCostPrice = matchingProduct.cost_price_bag || 0;
            const baseSalePrice = matchingProduct.selling_price_bag || baseCostPrice;

            if (form.unit === "tons") {
                // 1 Ton = 20 Bags
                costPrice = baseCostPrice * 20;
                salePrice = baseSalePrice * 20;
            } else {
                costPrice = baseCostPrice;
                salePrice = baseSalePrice;
            }

            setAutomatedPricing({
                purchase_price: costPrice,
                sale_price: salePrice
            });
        } else {
            setAutomatedPricing({ purchase_price: 0, sale_price: 0 });
        }
    }, [form.customer_id, form.depot_id, form.cement_type, form.order_type, products, customers]);

    const resetForm = () => {
        setForm({
            customer_id: "",
            order_type: "depot_dispatch",
            depot_id: "",
            supplier_id: "",
            cement_type: "Portland Cement",
            quantity: "",
            unit: "bags",
            payment_terms: "COD",
            delivery_address: "",
            is_direct_drop: true,
            notes: "",
            waybill_number: "",
            atc_number: "",
            cap_number: "",
        });
        setAutomatedPricing({ purchase_price: 0, sale_price: 0 });
    };

    const handleCreateOrder = () => {
        if (!form.customer_id || !form.quantity) {
            toast({ title: "Missing required fields", variant: "destructive" });
            return;
        }

        const qty = parseFloat(form.quantity);
        const purchasePrice = automatedPricing.purchase_price;
        const salePrice = automatedPricing.sale_price;
        const totalAmount = qty * salePrice;

        createOrder.mutate(
            {
                customer_id: form.customer_id,
                order_type: form.order_type,
                depot_id: form.order_type === "depot_dispatch" ? form.depot_id : undefined,
                supplier_id: form.order_type === "plant_direct" ? form.supplier_id : undefined,
                cement_type: form.cement_type,
                quantity: qty,
                unit: form.unit,
                total_amount: totalAmount,
                delivery_address: form.delivery_address || undefined,
                notes: form.notes || undefined,
                is_direct_drop: form.is_direct_drop,
                waybill_number: form.waybill_number || undefined,
                atc_number: form.atc_number || undefined,
                cap_number: form.cap_number || undefined,
                cement_purchase_price: purchasePrice,
                cement_sale_price: salePrice,
                payment_terms: form.payment_terms,
            },
            {
                onSuccess: () => {
                    resetForm();
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" /> New Order
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>Enter the details for the new customer order.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                        <Label>Customer *</Label>
                        <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={c.id} disabled={c.is_blocked}>
                                        {c.name}
                                        {c.is_blocked && <span className="text-destructive ml-2">(Blocked)</span>}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Order Type *</Label>
                        <Select value={form.order_type} onValueChange={(v: OrderType) => setForm({ ...form, order_type: v, depot_id: "", supplier_id: "" })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="plant_direct">Plant Direct</SelectItem>
                                <SelectItem value="depot_dispatch">Depot Dispatch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {form.order_type === "plant_direct" && (
                        <div className="space-y-2">
                            <Label>Manufacturer (Supplier)</Label>
                            <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select manufacturer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {form.order_type === "depot_dispatch" && (
                        <div className="space-y-2">
                            <Label>Depot *</Label>
                            <Select value={form.depot_id} onValueChange={(v) => setForm({ ...form, depot_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select depot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {depots.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cement Type *</Label>
                            <Select value={form.cement_type} onValueChange={(v) => setForm({ ...form, cement_type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Portland Cement">Portland Cement</SelectItem>
                                    <SelectItem value="White Cement">White Cement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Waybill Number</Label>
                            <Input
                                value={form.waybill_number}
                                onChange={(e) => setForm({ ...form, waybill_number: e.target.value })}
                                placeholder="e.g. WB12345"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>ATC Number</Label>
                            <Input
                                value={form.atc_number}
                                onChange={(e) => setForm({ ...form, atc_number: e.target.value })}
                                placeholder="e.g. ATC12345"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>CAP Number</Label>
                            <Input
                                value={form.cap_number}
                                onChange={(e) => setForm({ ...form, cap_number: e.target.value })}
                                placeholder="e.g. CAP12345"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                className="flex-1"
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                placeholder="30"
                            />
                            <Select value={form.unit} onValueChange={(v: "tons" | "bags") => setForm({ ...form, unit: v })}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tons">Tons</SelectItem>
                                    <SelectItem value="bags">Bags</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-primary/10">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cost Price</Label>
                            <p className="font-mono text-sm font-semibold">₦{automatedPricing.purchase_price.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Selling Price</Label>
                            <p className="font-mono text-sm font-semibold text-primary">₦{automatedPricing.sale_price.toLocaleString()}</p>
                        </div>
                    </div>



                    <div className="space-y-2">
                        <Label>Delivery Address</Label>
                        <Textarea
                            value={form.delivery_address}
                            onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                            placeholder="Delivery location"
                        />
                    </div>


                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Additional notes"
                        />
                    </div>

                    <LoadingButton
                        onClick={handleCreateOrder}
                        className="w-full"
                        disabled={!form.customer_id || !form.quantity}
                        isLoading={createOrder.isPending}
                    >
                        Create Order
                    </LoadingButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
