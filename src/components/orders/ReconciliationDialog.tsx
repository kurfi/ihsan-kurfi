
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface ReconciliationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: {
        id: string;
        quantity: number;
        driver_id: string | null;
        truck_id: string | null;
    } | null;
    onConfirm: (data: ReconciliationData) => Promise<void>;
}

export interface ReconciliationData {
    receivedQuantity: number;
    shortageQuantity: number;
    qtyGood: number;
    qtyMissing: number;
    qtyDamaged: number;
    otp: string;
    reason?: string;
    liability?: "driver" | "company";
    deductionAmount?: number;
}

export function ReconciliationDialog({
    open,
    onOpenChange,
    order,
    onConfirm,
}: ReconciliationDialogProps) {
    const [otp, setOtp] = useState("");
    const [qtyGood, setQtyGood] = useState<string>("");
    const [qtyMissing, setQtyMissing] = useState<string>("0");
    const [qtyDamaged, setQtyDamaged] = useState<string>("0");
    const [reason, setReason] = useState("");
    const [liability, setLiability] = useState<"driver" | "company">("company");
    const [deductionAmount, setDeductionAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (order) {
            setQtyGood(order.quantity.toString());
            setQtyMissing("0");
            setQtyDamaged("0");
            setOtp("");
            setReason("");
            setLiability("company");
            setDeductionAmount("0");
        }
    }, [order, open]);

    const dispatched = order?.quantity || 0;
    const missing = parseFloat(qtyMissing) || 0;
    const damaged = parseFloat(qtyDamaged) || 0;
    const good = dispatched - missing - damaged;

    // Sync good quantity
    useEffect(() => {
        setQtyGood(good.toString());
    }, [missing, damaged, dispatched, good]);

    const isSumValid = Math.abs((good + missing + damaged) - dispatched) < 0.01;

    const handleSubmit = async () => {
        if (!order) return;

        if (!isSumValid) {
            toast({
                title: "Validation Error",
                description: "Good + Missing + Damaged must equal Total Quantity",
                variant: "destructive"
            });
            return;
        }

        if (!otp) {
            toast({
                title: "OTP Required",
                description: "Please enter the delivery OTP",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm({
                receivedQuantity: good,
                shortageQuantity: missing + damaged,
                qtyGood: good,
                qtyMissing: missing,
                qtyDamaged: damaged,
                otp: otp,
                reason: (missing + damaged) > 0 ? reason : undefined,
                liability: (missing > 0 || damaged > 0) ? "driver" : undefined,
                deductionAmount: (missing > 0 || damaged > 0) ? parseFloat(deductionAmount) : 0
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Reconciliation error:", error);
            toast({
                title: "Error",
                description: "Failed to submit reconciliation",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C] border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Order Reconciliation</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-4 py-2 bg-[#2A2F3C]/50 rounded-lg border border-gray-800">
                        <Label htmlFor="otp" className="text-primary font-bold uppercase tracking-wider text-xs">
                            Delivery OTP
                        </Label>
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className="bg-[#1A1F2C] border-gray-700" />
                                <InputOTPSlot index={1} className="bg-[#1A1F2C] border-gray-700" />
                                <InputOTPSlot index={2} className="bg-[#1A1F2C] border-gray-700" />
                                <InputOTPSlot index={3} className="bg-[#1A1F2C] border-gray-700" />
                                <InputOTPSlot index={4} className="bg-[#1A1F2C] border-gray-700" />
                                <InputOTPSlot index={5} className="bg-[#1A1F2C] border-gray-700" />
                            </InputOTPGroup>
                        </InputOTP>
                        <p className="text-[10px] text-gray-500 italic">Enter the 6-digit code provided by the driver</p>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-gray-400">Total Qty</Label>
                        <div className="col-span-3 font-semibold text-lg">
                            {dispatched} Tons
                        </div>
                    </div>

                    <hr className="border-gray-800" />

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="good" className="text-right text-success">
                            Qty Good
                        </Label>
                        <Input
                            id="good"
                            value={qtyGood}
                            disabled
                            className="col-span-3 bg-[#2A2F3C] border-gray-700 text-success font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="missing" className="text-right text-destructive">
                            Qty Missing
                        </Label>
                        <Input
                            id="missing"
                            type="number"
                            value={qtyMissing}
                            onChange={(e) => setQtyMissing(e.target.value)}
                            className="col-span-3 bg-[#2A2F3C] border-destructive text-white"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="damaged" className="text-right text-orange-400">
                            Qty Damaged
                        </Label>
                        <Input
                            id="damaged"
                            type="number"
                            value={qtyDamaged}
                            onChange={(e) => setQtyDamaged(e.target.value)}
                            className="col-span-3 bg-[#2A2F3C] border-orange-400 text-white"
                        />
                    </div>

                    {(missing > 0 || damaged > 0) && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reason" className="text-right text-gray-400">
                                Reason
                            </Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="col-span-3 bg-[#2A2F3C] border-gray-700 text-white"
                                placeholder="Explain shortages/damages..."
                            />
                        </div>
                    )}
                </div>

                {!isSumValid && (
                    <div className="text-destructive text-xs text-center mb-2">
                        Error: Good + Missing + Damaged must equal {dispatched}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-700 text-gray-300 hover:bg-[#2A2F3C] hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isSumValid || !otp}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        {isSubmitting ? "Confirming..." : "Process Reconciliation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
