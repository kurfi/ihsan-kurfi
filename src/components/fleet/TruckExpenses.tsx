import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExpenses, useAddExpense } from "@/hooks/useFinance";
import { format } from "date-fns";
import { Plus, History, TrendingUp } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

interface TruckExpensesProps {
    truckId: string;
}

export function TruckExpenses({ truckId }: TruckExpensesProps) {
    const { data: expenses = [] } = useExpenses({ truckId: truckId });
    const addExpense = useAddExpense();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [form, setForm] = useState<{
        category: ExpenseCategory;
        expense_type: string;
        amount: string;
        description: string;
    }>({
        category: "fuel",
        expense_type: "",
        amount: "",
        description: "",
    });

    const categories = [
        { value: "fuel", label: "Fuel" },
        { value: "maintenance", label: "Maintenance" },
        { value: "toll", label: "Toll" },
        { value: "salary", label: "Salary" },
        { value: "insurance", label: "Insurance" },
        { value: "license", label: "License" },
        { value: "office", label: "Office" },
        { value: "other", label: "Other" },
    ];

    const handleAddExpense = () => {
        if (!truckId || !form.amount || !form.expense_type) return;

        addExpense.mutate({
            truck_id: truckId,
            category: form.category,
            expense_type: form.expense_type,
            amount: parseFloat(form.amount),
            description: form.description,
            order_id: null,
        }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setForm({ category: "fuel", expense_type: "", amount: "", description: "" });
            }
        });
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Total Expenses: <span className="text-destructive">₦{totalExpenses.toLocaleString()}</span>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary">
                            <Plus className="w-4 h-4 mr-2" /> Record Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record Expense</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Expense Type (Short Title) *</Label>
                                <Input
                                    value={form.expense_type}
                                    onChange={(e) => setForm({ ...form, expense_type: e.target.value })}
                                    placeholder="e.g. Engine Oil Change, Fuel Refill"
                                />
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
                            <Button onClick={handleAddExpense} className="w-full" disabled={addExpense.isPending}>
                                {addExpense.isPending ? "Saving..." : "Save Expense"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" /> Expense History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No expense records found for this truck
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenses.map((e) => (
                                        <TableRow key={e.id}>
                                            <TableCell>{format(new Date(e.created_at), 'MMM d, yyyy')}</TableCell>
                                            <TableCell className="capitalize">
                                                <span className="px-2 py-1 rounded-full text-xs bg-muted">
                                                    {e.category?.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-medium">{e.expense_type}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{e.description || '-'}</TableCell>
                                            <TableCell className="text-right font-bold text-destructive">
                                                ₦{e.amount.toLocaleString()}
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
