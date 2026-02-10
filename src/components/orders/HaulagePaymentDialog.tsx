import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { Plus, Banknote } from "lucide-react";
import { useAddHaulagePayment } from "@/hooks/useTrips";
import { useSuppliers } from "@/hooks/usePurchases";
import { useToast } from "@/hooks/use-toast";

export function HaulagePaymentDialog() {
    const { toast } = useToast();
    const addPayment = useAddHaulagePayment();
    const { data: suppliers = [] } = useSuppliers();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        supplier_id: "",
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: "",
        notes: "",
    });

    const handleAddPayment = () => {
        if (!form.supplier_id || !form.amount) {
            toast({ title: "Missing required fields", variant: "destructive" });
            return;
        }

        addPayment.mutate(
            {
                // Note: haulage_payments table expects supplier_id (UUID)
                supplier_id: form.supplier_id,
                amount: parseFloat(form.amount),
                payment_date: form.payment_date,
                reference_number: form.reference_number || undefined,
                notes: form.notes || undefined,
            },
            {
                onSuccess: () => {
                    setForm({
                        supplier_id: "",
                        amount: "",
                        payment_date: new Date().toISOString().split('T')[0],
                        reference_number: "",
                        notes: "",
                    });
                    setOpen(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    <Banknote className="w-4 h-4 mr-2" /> Record Haulage Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Haulage Payment (from Dangote/Supplier)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Manufacturer (Supplier) *</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={form.supplier_id}
                            onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                        >
                            <option value="">Select manufacturer</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (₦) *</Label>
                        <Input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            placeholder="Enter payment amount"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <Input
                            type="date"
                            value={form.payment_date}
                            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input
                            value={form.reference_number}
                            onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                            placeholder="e.g. DANG-PYMT-001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Additional details"
                        />
                    </div>

                    <LoadingButton
                        onClick={handleAddPayment}
                        className="w-full"
                        disabled={!form.supplier_id || !form.amount}
                        isLoading={addPayment.isPending}
                    >
                        Save Payment record
                    </LoadingButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
