import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { useUpdateCarrierInfo } from "@/hooks/useTransit";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CarrierInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string | null;
    currentData?: {
        carrierName?: string;
        carrierContact?: string;
        trackingNumber?: string;
        estimatedDeliveryDate?: string;
    };
}

export function CarrierInfoDialog({
    open,
    onOpenChange,
    orderId,
    currentData,
}: CarrierInfoDialogProps) {
    const updateCarrierInfo = useUpdateCarrierInfo();
    const [carrierName, setCarrierName] = useState("");
    const [carrierContact, setCarrierContact] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [estimatedDate, setEstimatedDate] = useState<Date | undefined>();

    // Update form when currentData changes
    useEffect(() => {
        if (currentData) {
            setCarrierName(currentData.carrierName || "");
            setCarrierContact(currentData.carrierContact || "");
            setTrackingNumber(currentData.trackingNumber || "");
            if (currentData.estimatedDeliveryDate) {
                setEstimatedDate(new Date(currentData.estimatedDeliveryDate));
            }
        }
    }, [currentData]);

    const handleSubmit = () => {
        if (!orderId) return;

        updateCarrierInfo.mutate(
            {
                orderId,
                carrierName: carrierName || undefined,
                carrierContact: carrierContact || undefined,
                trackingNumber: trackingNumber || undefined,
                estimatedDeliveryDate: estimatedDate?.toISOString(),
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Carrier Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Carrier Name</Label>
                        <Input
                            placeholder="e.g., DHL, FedEx, Local Transport"
                            value={carrierName}
                            onChange={(e) => setCarrierName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Carrier Contact Number</Label>
                        <Input
                            placeholder="+234 XXX XXX XXXX"
                            value={carrierContact}
                            onChange={(e) => setCarrierContact(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tracking/Waybill Number</Label>
                        <Input
                            placeholder="Enter tracking number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Estimated Delivery Date & Time</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !estimatedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {estimatedDate ? (
                                        format(estimatedDate, "PPP HH:mm")
                                    ) : (
                                        <span>Pick a date and time</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={estimatedDate}
                                    onSelect={setEstimatedDate}
                                    initialFocus
                                />
                                {estimatedDate && (
                                    <div className="p-3 border-t">
                                        <Label className="text-xs">Time (24h format)</Label>
                                        <Input
                                            type="time"
                                            value={estimatedDate ? format(estimatedDate, "HH:mm") : ""}
                                            onChange={(e) => {
                                                if (estimatedDate && e.target.value) {
                                                    const [hours, minutes] = e.target.value.split(":");
                                                    const newDate = new Date(estimatedDate);
                                                    newDate.setHours(parseInt(hours), parseInt(minutes));
                                                    setEstimatedDate(newDate);
                                                }
                                            }}
                                            className="mt-2"
                                        />
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                            Cancel
                        </Button>
                        <LoadingButton
                            onClick={handleSubmit}
                            isLoading={updateCarrierInfo.isPending}
                            className="flex-1"
                        >
                            Save
                        </LoadingButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
