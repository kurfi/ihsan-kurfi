import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { Plus, Banknote } from "lucide-react";
import { useAddHaulagePayment } from "@/hooks/useTrips";
import { useSuppliers } from "@/hooks/usePurchases";
import { useToast } from "@/hooks/use-toast";
import { calculateVAT } from "@/lib/vatConfig";

export function HaulagePaymentDialog() {
    const { toast } = useToast();
    const addPayment = useAddHaulagePayment();
    const { data: suppliers = [] } = useSuppliers();
    const [open, setOpen] = useState(false);
    const [vatPaid, setVatPaid] = useState(false);
    const [form, setForm] = useState({
        amount_received: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_reference: "",
        period_covered: "",
        notes: "",
    });

    const handleAddPayment = () => {
        if (!form.amount_received) {
            toast({ title: "Missing amount", variant: "destructive" });
            return;
        }

        addPayment.mutate(
            {
                amount_received: parseFloat(form.amount_received),
                payment_date: form.payment_date,
                payment_reference: form.payment_reference || undefined,
                period_covered: form.period_covered || undefined,
                notes: form.notes || undefined,
                vat_paid: vatPaid,
                vat_paid_amount: vatPaid ? calculateVAT(parseFloat(form.amount_received)) : 0,
            },
            {
                onSuccess: () => {
                    setForm({
                        amount_received: "",
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_reference: "",
                        period_covered: "",
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
                    <DialogDescription>Record a payment received for haulage services from the manufacturer.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Amount Received (₦) *</Label>
                        <Input
                            type="number"
                            value={form.amount_received}
                            onChange={(e) => setForm({ ...form, amount_received: e.target.value })}
                            placeholder="Enter payment amount"
                        />
                    </div>

                    {form.amount_received && (
                        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <p className="text-sm font-medium">VAT Summary</p>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>₦{parseFloat(form.amount_received || "0").toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>VAT (7.5%)</span>
                                    <span>₦{calculateVAT(parseFloat(form.amount_received || "0")).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Checkbox
                                    id="vat-paid"
                                    checked={vatPaid}
                                    onCheckedChange={(checked) => setVatPaid(checked as boolean)}
                                />
                                <Label htmlFor="vat-paid" className="text-sm">
                                    Customer paid VAT (₦{calculateVAT(parseFloat(form.amount_received || "0")).toLocaleString()})
                                </Label>
                            </div>
                            <div className="flex justify-between font-semibold text-sm border-t pt-2">
                                <span>Total Being Recorded</span>
                                <span>
                                    ₦{(parseFloat(form.amount_received || "0") + (vatPaid ? calculateVAT(parseFloat(form.amount_received || "0")) : 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

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
                            value={form.payment_reference}
                            onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                            placeholder="e.g. DANG-PYMT-001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Period Covered</Label>
                        <Input
                            value={form.period_covered}
                            onChange={(e) => setForm({ ...form, period_covered: e.target.value })}
                            placeholder="e.g. January 2024"
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
                        disabled={!form.amount_received}
                        isLoading={addPayment.isPending}
                    >
                        Save Payment record
                    </LoadingButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
