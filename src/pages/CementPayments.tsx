import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCementPaymentsToDangote, useAddCementPaymentToDangote, useDeleteCementPayment } from "@/hooks/useCementPayments";
import { useSuppliers, useWallets, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/usePurchases";
import { Plus, Banknote, Trash2, Wallet, Search, Settings2, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CementPayments() {
    const { data: payments = [], isLoading } = useCementPaymentsToDangote();
    const { data: wallets = [], isLoading: isLoadingWallets } = useWallets();
    const { data: suppliers = [] } = useSuppliers();
    const addPayment = useAddCementPaymentToDangote();
    const deletePayment = useDeleteCementPayment();
    const createSupplier = useCreateSupplier();
    const updateSupplier = useUpdateSupplier();
    const deleteSupplier = useDeleteSupplier();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [manageSuppliersOpen, setManageSuppliersOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const [supplierForm, setSupplierForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });

    const [paymentSortBy, setPaymentSortBy] = useState("date_desc");
    const [form, setForm] = useState({
        supplier_id: "",
        payment_date: format(new Date(), "yyyy-MM-dd"),
        amount_paid: "",
        payment_reference: "",
        period_covered: "",
        payment_method: "bank_transfer",
        payment_type: "postpayment" as "prepayment" | "postpayment",
        cement_type: "",
        notes: "",
    });

    const [paymentSearch, setPaymentSearch] = useState("");
    const [walletSearch, setWalletSearch] = useState("");

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ title: "", description: "", onConfirm: () => { } });



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addPayment.mutateAsync({
            supplier_id: form.supplier_id || undefined,
            payment_date: form.payment_date,
            amount_paid: parseFloat(form.amount_paid),
            payment_reference: form.payment_reference || undefined,
            period_covered: form.period_covered || undefined,
            payment_method: form.payment_method || undefined,
            payment_type: form.payment_type,
            cement_type: form.payment_type === 'prepayment' ? form.cement_type : undefined,
            notes: form.notes || undefined,
        });
        setDialogOpen(false);
        setForm({
            supplier_id: "",
            payment_date: format(new Date(), "yyyy-MM-dd"),
            amount_paid: "",
            payment_reference: "",
            period_covered: "",
            payment_method: "bank_transfer",
            payment_type: "postpayment",
            cement_type: "",
            notes: "",
        });
    };

    const handleDelete = (id: string, reference: string) => {
        setConfirmConfig({
            title: "Delete Payment",
            description: `Delete payment ${reference}? This action cannot be undone.`,
            onConfirm: () => deletePayment.mutate(id),
        });
        setConfirmDialogOpen(true);
    };


    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            await updateSupplier.mutateAsync({ id: editingSupplier.id, ...supplierForm });
            setEditingSupplier(null);
        } else {
            await createSupplier.mutateAsync(supplierForm);
        }
        setSupplierForm({ name: "", contact_person: "", phone: "", email: "", address: "" });
    };

    const handleEditSupplier = (supplier: any) => {
        setEditingSupplier(supplier);
        setSupplierForm({
            name: supplier.name || "",
            contact_person: supplier.contact_person || "",
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
        });
    };

    const handleDeleteSupplier = (id: string, name: string) => {
        setConfirmConfig({
            title: "Delete Manufacturer",
            description: `Are you sure you want to delete manufacturer "${name}"? This may affect existing records.`,
            onConfirm: () => deleteSupplier.mutate(id),
        });
        setConfirmDialogOpen(true);
    };


    const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
    const paymentsThisMonth = payments.filter(p =>
        new Date(p.payment_date).getMonth() === new Date().getMonth()
    );

    const filteredWallets = wallets.filter((wallet: any) =>
        (wallet.suppliers?.name && wallet.suppliers.name.toLowerCase().includes(walletSearch.toLowerCase())) ||
        (wallet.cement_type && wallet.cement_type.toLowerCase().includes(walletSearch.toLowerCase()))
    );

    const filteredPayments = payments.filter(payment => {
        if (!paymentSearch) return true;

        const searchLower = paymentSearch.toLowerCase();
        const reference = payment.payment_reference?.toLowerCase() || "";
        const cementType = payment.cement_type?.toLowerCase() || "";
        const supplierName = (payment as any).supplier?.name?.toLowerCase() || "";
        const period = payment.period_covered?.toLowerCase() || "";
        const notes = payment.notes?.toLowerCase() || "";
        const type = payment.payment_type?.toLowerCase() || "";

        return reference.includes(searchLower) ||
            cementType.includes(searchLower) ||
            supplierName.includes(searchLower) ||
            period.includes(searchLower) ||
            notes.includes(searchLower) ||
            type.includes(searchLower);
    });

    const sortedPayments = [...filteredPayments].sort((a, b) => {

        if (paymentSortBy === "date_desc") {
            return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
        } else if (paymentSortBy === "date_asc") {
            return new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime();
        } else if (paymentSortBy === "amount_desc") {
            return b.amount_paid - a.amount_paid;
        } else if (paymentSortBy === "amount_asc") {
            return a.amount_paid - b.amount_paid;
        }
        return 0;
    });

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in mobile-spacing">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="heading-page">Cement Payments & Wallets</h1>
                        <p className="text-muted-foreground">
                            Manage manufacturer pre-payments and balance records
                        </p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Record Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Record Payment to Manufacturer</DialogTitle>
                                <DialogDescription>Record a new payment made to the cement manufacturer.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payment Type</Label>
                                        <Select
                                            value={form.payment_type}
                                            onValueChange={(value: "prepayment" | "postpayment") => setForm({ ...form, payment_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="postpayment">Regular (Post-pay)</SelectItem>
                                                <SelectItem value="prepayment">Lifting Credit (Pre-pay)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        <Select value={form.payment_method} onValueChange={(value) => setForm({ ...form, payment_method: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Supplier/Manufacturer</Label>
                                    <Select value={form.supplier_id} onValueChange={(value) => setForm({ ...form, supplier_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payment Date</Label>
                                        <Input
                                            type="date"
                                            value={form.payment_date}
                                            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount Paid (₦)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={form.amount_paid}
                                            onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                                            required
                                            placeholder="5000000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Payment Reference</Label>
                                    <Input
                                        value={form.payment_reference}
                                        onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                                        placeholder="TRF/2026/0209"
                                    />
                                </div>

                                <div>
                                    <Label>Period Covered (Optional)</Label>
                                    <Input
                                        value={form.period_covered}
                                        onChange={(e) => setForm({ ...form, period_covered: e.target.value })}
                                        placeholder="Jan 1-31, 2026"
                                    />
                                </div>

                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Additional details..."
                                        rows={2}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={addPayment.isPending}>
                                    {addPayment.isPending ? "Recording..." : "Record Payment"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={manageSuppliersOpen} onOpenChange={setManageSuppliersOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Settings2 className="h-4 w-4 mr-2" />
                                Manage Manufacturers
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Manage Manufacturers</DialogTitle>
                                <DialogDescription>Add, edit or remove cement manufacturers.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <form onSubmit={handleSupplierSubmit} className="space-y-4 border p-4 rounded-lg bg-muted/30">
                                    <h4 className="text-sm font-semibold">{editingSupplier ? "Edit Manufacturer" : "Add New Manufacturer"}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="name">Manufacturer Name</Label>
                                            <Input
                                                id="name"
                                                value={supplierForm.name}
                                                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                                placeholder="e.g. Dangote Cement"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="contact">Contact Person</Label>
                                            <Input
                                                id="contact"
                                                value={supplierForm.contact_person}
                                                onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                                                placeholder="Director of Sales"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={supplierForm.phone}
                                                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                                placeholder="080..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={supplierForm.email}
                                                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                                placeholder="info@manufacturer.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            value={supplierForm.address}
                                            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                            placeholder="Headquarters location"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        {editingSupplier && (
                                            <Button type="button" variant="ghost" onClick={() => {
                                                setEditingSupplier(null);
                                                setSupplierForm({ name: "", contact_person: "", phone: "", email: "", address: "" });
                                            }}>
                                                Cancel
                                            </Button>
                                        )}
                                        <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
                                            {editingSupplier ? "Update" : "Add Manufacturer"}
                                        </Button>
                                    </div>
                                </form>

                                <div className="max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Manufacturer</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {suppliers.map((s) => (
                                                <TableRow key={s.id}>
                                                    <TableCell className="font-medium">{s.name}</TableCell>
                                                    <TableCell>
                                                        <div className="text-xs">{s.contact_person || "-"}</div>
                                                        <div className="text-[10px] text-muted-foreground">{s.phone}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleEditSupplier(s)}
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteSupplier(s.id, s.name)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {suppliers.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                        No manufacturers found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Manufacturer Wallets Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            Manufacturer Wallets
                        </h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search wallets..."
                                value={walletSearch}
                                onChange={(e) => setWalletSearch(e.target.value)}
                                className="pl-9 h-8 text-xs"
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">

                        {isLoadingWallets ? (
                            Array(4).fill(0).map((_, i) => <LoadingSkeleton key={i} className="h-24 w-full" />)
                        ) : wallets.length === 0 ? (
                            <div className="col-span-full py-6 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <Wallet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">No Manufacturer Wallets</p>
                                <p className="text-xs text-muted-foreground">Wallets are created when you record a prepayment.</p>
                            </div>
                        ) : (
                            filteredWallets.map((wallet: any) => (

                                <Card key={wallet.id} className="bg-accent/5 overflow-hidden transition-all hover:shadow-md">
                                    <CardHeader className="p-3 pb-0">
                                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                            {wallet.suppliers?.name}
                                            <Badge variant="outline" className="text-[9px] h-4 px-1">{wallet.unit}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-1">
                                        <div className="text-lg font-bold">₦{wallet.balance.toLocaleString()}</div>
                                        <p className="text-xs text-primary truncate font-medium">{wallet.cement_type}</p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Paid (All Time)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalPaid.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Payments This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{paymentsThisMonth.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                ₦{paymentsThisMonth.reduce((sum, p) => sum + p.amount_paid, 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {payments[0] ? format(new Date(payments[0].payment_date), "MMM dd") : "N/A"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {payments[0] ? `₦${payments[0].amount_paid.toLocaleString()}` : "-"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment History */}
                <Card className="shadow-card">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-4 sm:p-6">
                        <CardTitle className="heading-section">Payment History</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search payments..."
                                    value={paymentSearch}
                                    onChange={(e) => setPaymentSearch(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                            <Select value={paymentSortBy} onValueChange={setPaymentSortBy}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date_desc">Newest First</SelectItem>
                                    <SelectItem value="date_asc">Oldest First</SelectItem>
                                    <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                                    <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-4">
                                <LoadingSkeleton variant="table" rows={5} />
                            </div>
                        ) : payments.length === 0 ? (
                            <EmptyState
                                icon={Banknote}
                                title="No payments recorded"
                                description="Record your first payment to a cement supplier"
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</TableCell>
                                                <TableCell className="font-medium">{(payment as any).supplier?.name || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={payment.payment_type === 'prepayment' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                                                        {payment.payment_type || 'postpayment'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    ₦{payment.amount_paid.toLocaleString()}
                                                </TableCell>
                                                <TableCell>{payment.payment_reference || "-"}</TableCell>
                                                <TableCell>{payment.cement_type || payment.period_covered || "-"}</TableCell>
                                                <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ') || "-"}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(payment.id, payment.payment_reference || payment.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                confirmConfig.onConfirm();
                                setConfirmDialogOpen(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
}

