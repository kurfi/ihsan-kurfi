
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Calendar, User, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Payment {
    id: string;
    amount: number;
    payment_date: string | null;
    created_at: string;
    status: "Pending" | "Confirmed" | "Rejected" | null;
    payment_method: string;
    reference_number?: string | null;
    customer?: { name: string } | null;
    order?: { order_number: string } | null;
    payment_account?: { bank_name: string; account_number: string } | null;
}

interface PaymentCardProps {
    payment: Payment;
    onEdit: (payment: Payment) => void;
    onDelete: (id: string) => void;
    onConfirm?: (id: string, status: "Confirmed" | "Rejected") => void;
    formatCurrency: (amount: number) => string;
}

export function PaymentCard({ payment, onEdit, onDelete, onConfirm, formatCurrency }: PaymentCardProps) {
    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {payment.customer?.name || "Unknown Customer"}
                        </h4>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(payment.payment_date || payment.created_at), "MMM d, yyyy")}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-success text-lg">
                            {formatCurrency(payment.amount)}
                        </div>
                        <div className="flex flex-col items-end gap-1 mt-1">
                            <Badge variant="outline" className="capitalize text-xs">
                                {payment.payment_method}
                            </Badge>
                            <Badge variant={payment.status === 'Confirmed' ? 'success' : payment.status === 'Rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                                {payment.status || 'Pending'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-4 text-sm">
                    {payment.order && (
                        <div>
                            <span className="text-muted-foreground text-xs block">Order</span>
                            <span className="font-medium">{payment.order.order_number}</span>
                        </div>
                    )}
                    {payment.reference_number && (
                        <div className="col-span-2">
                            <span className="text-muted-foreground text-xs block">Reference</span>
                            <span className="font-medium truncate block">{payment.reference_number}</span>
                        </div>
                    )}
                    {payment.payment_account && (
                        <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="text-xs">
                                {payment.payment_account.bank_name} • {payment.payment_account.account_number.slice(-4)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                    {payment.status === 'Pending' && (payment.payment_method === 'transfer' || payment.payment_method === 'cheque') && onConfirm ? (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onConfirm(payment.id, 'Confirmed')}
                                className="h-8 px-2 text-success hover:text-success/80 hover:bg-success/10"
                            >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Confirm
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onConfirm(payment.id, 'Rejected')}
                                className="h-8 px-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            >
                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(payment)}
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            >
                                <Pencil className="w-4 h-4 mr-1.5" /> Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(payment.id)}
                                className="h-8 px-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
