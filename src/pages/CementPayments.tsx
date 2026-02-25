import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCementPaymentsToDangote, useAddCementPaymentToDangote, useDeleteCementPayment } from "@/hooks/useCementPayments";
import { useSuppliers, useWallets } from "@/hooks/usePurchases";
import { Plus, Banknote, Trash2, Wallet, Search } from "lucide-react";
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
    const [dialogOpen, setDialogOpen] = useState(false);
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
        if (confirm(`Delete payment ${reference}? This action cannot be undone.`)) {
            deletePayment.mutate(id);
        }
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
    const paymentsThisMonth = payments.filter(p =>
        new Date(p.payment_date).getMonth() === new Date().getMonth()
    );

    const filteredWallets = wallets.filter((wallet: any) =>
        (wallet.suppliers?.name && wallet.suppliers.name.toLowerCase().includes(walletSearch.toLowerCase())) ||
        (wallet.cement_type && wallet.cement_type.toLowerCase().includes(walletSearch.toLowerCase()))
    );

    const filteredPayments = payments.filter(payment =>
        (payment.payment_reference && payment.payment_reference.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        (payment.cement_type && payment.cement_type.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        ((payment as any).supplier?.name && (payment as any).supplier.name.toLowerCase().includes(paymentSearch.toLowerCase())) ||
        (payment.period_covered && payment.period_covered.toLowerCase().includes(paymentSearch.toLowerCase()))
    );

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

                                {form.payment_type === 'prepayment' && (
                                    <div>
                                        <Label>Cement Type</Label>
                                        <Select value={form.cement_type} onValueChange={(value) => setForm({ ...form, cement_type: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select cement type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Dangote 42.5R">Dangote 42.5R</SelectItem>
                                                <SelectItem value="Dangote 32.5N">Dangote 32.5N</SelectItem>
                                                <SelectItem value="BUA 42.5R">BUA 42.5R</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

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
        </MainLayout>
    );
}
