import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDriverTransactions, useAddDriverTransaction } from "@/hooks/useFleet";
import { format } from "date-fns";
import { Plus, History, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type TransactionType = Database["public"]["Enums"]["transaction_type"];

interface DriverWalletProps {
    driverId: string;
}

export function DriverWallet({ driverId }: DriverWalletProps) {
    const { data: transactions = [] } = useDriverTransactions(driverId);
    const addTransaction = useAddDriverTransaction();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [form, setForm] = useState<{
        type: TransactionType;
        amount: string;
        description: string;
    }>({
        type: "salary_payment",
        amount: "",
        description: "",
    });

    const transactionTypes = [
        { value: "salary_payment", label: "Salary Payment" },
        { value: "allowance", label: "Allowance" },
        { value: "bonus", label: "Bonus" },
        { value: "shortage_deduction", label: "Shortage Deduction" },
        { value: "shortage_deduction", label: "Shortage Deduction" },
        { value: "other", label: "Other" },
    ];

    const handleAddTransaction = () => {
        if (!driverId || !form.amount || !form.type) return;

        addTransaction.mutate({
            driver_id: driverId,
            type: form.type,
            amount: parseFloat(form.amount),
            description: form.description,
        }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setForm({ type: "salary_payment", amount: "", description: "" });
            }
        });
    };

    const balance = transactions.reduce((acc, t) => {
        if (t.type === 'deposit' || t.type === 'salary_payment' || t.type === 'bonus' || t.type === 'allowance' || t.type === 'other') {
            return acc + (t.amount || 0);
        } else {
            return acc - (t.amount || 0);
        }
    }, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-lg font-semibold flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Current Balance: <span className={balance >= 0 ? "text-success" : "text-destructive"}>₦{balance.toLocaleString()}</span>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary">
                            <Plus className="w-4 h-4 mr-2" /> Record Transaction
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Transaction</DialogTitle>
                            <DialogDescription>Record a new deposit or deduction for the driver's wallet.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Transaction Type</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transactionTypes.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (₦) *</Label>
                                <Input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Additional details..."
                                />
                            </div>
                            <Button onClick={handleAddTransaction} className="w-full" disabled={addTransaction.isPending}>
                                {addTransaction.isPending ? "Saving..." : "Save Transaction"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" /> Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No recent transactions for this driver
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{format(new Date(t.created_at || new Date()), 'MMM d, yyyy')}</TableCell>
                                            <TableCell className="capitalize">
                                                <Badge variant={['allowance', 'bonus', 'deposit', 'other'].includes(t.type || '') ? 'default' : 'secondary'} className={['allowance', 'bonus', 'deposit', 'other'].includes(t.type || '') ? 'bg-success text-success-foreground hover:bg-success/90' : ''}>
                                                    {t.type?.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{t.description || '-'}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                <div className={`flex items-center justify-end gap-1 ${['allowance', 'bonus', 'deposit', 'other'].includes(t.type || '') ? 'text-success' : 'text-destructive'}`}>
                                                    {['allowance', 'bonus', 'deposit', 'other'].includes(t.type || '') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                    ₦{t.amount?.toLocaleString()}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
