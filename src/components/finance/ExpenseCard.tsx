
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Calendar, FileText, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

interface Expense {
    id: string;
    expense_type: "fuel" | "toll" | "driver_allowance" | "maintenance" | "loading_fee" | "other";
    amount: number;
    description?: string | null;
    created_at: string;
    order?: { order_number: string } | null;
}

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    formatCurrency: (amount: number) => string;
}

export function ExpenseCard({ expense, onEdit, onDelete, formatCurrency }: ExpenseCardProps) {
    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-foreground capitalize flex items-center gap-2">
                            {expense.expense_type.replace('_', ' ')}
                        </h4>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(expense.created_at), "MMM d, yyyy")}
                        </div>
                    </div>
                    <div className="font-bold text-destructive text-lg">
                        {formatCurrency(expense.amount)}
                    </div>
                </div>

                {(expense.description || expense.order) && (
                    <div className="pt-2 border-t border-border/50 space-y-2 text-sm">
                        {expense.order && (
                            <div className="flex items-center gap-2 text-muted-foreground bg-secondary/30 p-1.5 rounded-md w-fit">
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span className="text-xs">Order #{expense.order.order_number}</span>
                            </div>
                        )}
                        {expense.description && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span className="italic">{expense.description}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-border/50 mt-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(expense)}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(expense.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
