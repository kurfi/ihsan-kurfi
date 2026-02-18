import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePayments, useAddPayment, useExpenses, useAddExpense, useUpdatePayment, useDeletePayment, useUpdateExpense, useDeleteExpense, usePaymentAccounts, useAddPaymentAccount, useUpdatePaymentAccount, useDeletePaymentAccount, useOrderBalances, useConfirmPayment } from "@/hooks/useFinance";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { Plus, Banknote, Receipt, TrendingUp, TrendingDown, Wallet, Pencil, Trash2, Landmark, CheckCircle, XCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { PaymentCard } from "@/components/finance/PaymentCard";
import { ExpenseCard } from "@/components/finance/ExpenseCard";
import { HaulagePaymentDialog } from "@/components/orders/HaulagePaymentDialog";

export default function Finance() {
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();
  const { data: customers = [] } = useCustomers();
  const { data: orders = [], isLoading: loadingOrders } = useOrders(expenseDialogOpen);
  const { data: paymentAccounts = [], isLoading: loadingAccounts } = usePaymentAccounts();

  const addPayment = useAddPayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const addAccount = useAddPaymentAccount();
  const updateAccount = useUpdatePaymentAccount();
  const deleteAccount = useDeletePaymentAccount();
  const confirmPayment = useConfirmPayment();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  // Orders are loaded lazily — only when the expense dialog is opened
  // This avoids fetching all orders (with 5 joins) on every Finance page load
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    customer_id: "",
    order_id: "",
    amount: "",
    payment_method: "transfer",
    reference_number: "",
    payment_account_id: "",
  });

  const { data: unsettledOrders = [] } = useOrderBalances(paymentForm.customer_id);

  const [expenseForm, setExpenseForm] = useState({
    order_id: "",
    expense_type: "fuel",
    amount: "",
    description: "",
  });

  const [accountForm, setAccountForm] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
    is_active: true
  });

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalPayments - totalExpenses;

  // Aging analysis
  const getAgingData = () => {
    const now = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };

    customers.forEach(c => {
      if (c.current_balance > 0) {
        // Use created_at as a proxy for when balance was incurred
        const daysSinceCreated = differenceInDays(now, new Date(c.created_at));
        if (daysSinceCreated <= 30) aging.current += c.current_balance;
        else if (daysSinceCreated <= 60) aging.days30 += c.current_balance;
        else if (daysSinceCreated <= 90) aging.days60 += c.current_balance;
        else aging.days90 += c.current_balance;
      }
    });
    return aging;
  };

  const aging = getAgingData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddPayment = () => {
    if ((paymentForm.payment_method === 'transfer' || paymentForm.payment_method === 'pos') && !paymentForm.payment_account_id) {
      alert("Please select a destination account for Transfer/POS payments.");
      return;
    }

    // Default status: Cash and POS are Confirmed immediately, others are Pending
    const status = (paymentForm.payment_method === 'cash' || paymentForm.payment_method === 'pos')
      ? 'Confirmed'
      : 'Pending';

    addPayment.mutate({
      customer_id: paymentForm.customer_id,
      order_id: paymentForm.order_id || null,
      amount: parseFloat(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      payment_account_id: paymentForm.payment_account_id || null,
      reference_number: paymentForm.reference_number || null,
      status: status,
    }, {
      onSuccess: () => {
        setPaymentDialogOpen(false);
        setPaymentForm({
          customer_id: "",
          order_id: "",
          amount: "",
          payment_method: "transfer",
          reference_number: "",
          payment_account_id: "",
        });
      }
    });
  };

  const handleAddExpense = () => {
    addExpense.mutate({
      order_id: expenseForm.order_id || null,
      expense_type: expenseForm.expense_type,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description || null,
    }, {
      onSuccess: () => {
        setExpenseDialogOpen(false);
        setExpenseForm({
          order_id: "",
          expense_type: "fuel",
          amount: "",
          description: "",
        });
      }
    });
  };

  const handleAddAccount = () => {
    addAccount.mutate({
      bank_name: accountForm.bank_name,
      account_number: accountForm.account_number,
      account_name: accountForm.account_name,
      is_active: accountForm.is_active,
    }, {
      onSuccess: () => {
        setAccountDialogOpen(false);
        setAccountForm({ bank_name: "", account_number: "", account_name: "", is_active: true });
      }
    });
  };

  const handleOpenEditPayment = (payment: typeof payments[0]) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({
      customer_id: payment.customer_id || "",
      order_id: payment.order_id || "",
      amount: payment.amount.toString(),
      payment_method: payment.payment_method,
      reference_number: payment.reference_number || "",
      payment_account_id: payment.payment_account_id || "",
    });
    setEditPaymentDialogOpen(true);
  };

  const handleEditPayment = () => {
    if (!editingPaymentId) return;
    updatePayment.mutate({
      id: editingPaymentId,
      customer_id: paymentForm.customer_id,
      order_id: paymentForm.order_id || null,
      amount: parseFloat(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      reference_number: paymentForm.reference_number || null,
      payment_account_id: paymentForm.payment_account_id || null,
    }, {
      onSuccess: () => {
        setEditPaymentDialogOpen(false);
        setEditingPaymentId(null);
        setPaymentForm({ customer_id: "", order_id: "", amount: "", payment_method: "transfer", reference_number: "", payment_account_id: "" });
      }
    });
  };

  const handleDeletePayment = (id: string) => {
    if (!confirm("Are you sure you want to delete this payment? This cannot be undone.")) return;
    deletePayment.mutate(id);
  };

  const handleOpenEditExpense = (expense: typeof expenses[0]) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      order_id: expense.order_id || "",
      expense_type: expense.expense_type,
      amount: expense.amount.toString(),
      description: expense.description || "",
    });
    setEditExpenseDialogOpen(true);
  };

  const handleEditExpense = () => {
    if (!editingExpenseId) return;
    updateExpense.mutate({
      id: editingExpenseId,
      order_id: expenseForm.order_id || null,
      expense_type: expenseForm.expense_type,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description || null,
    }, {
      onSuccess: () => {
        setEditExpenseDialogOpen(false);
        setEditingExpenseId(null);
        setExpenseForm({ order_id: "", expense_type: "fuel", amount: "", description: "" });
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm("Are you sure you want to delete this expense? This cannot be undone.")) return;
    deleteExpense.mutate(id);
  };

  const handleOpenEditAccount = (account: typeof paymentAccounts[0]) => {
    setEditingAccountId(account.id);
    setAccountForm({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_name: account.account_name,
      is_active: account.is_active
    });
    setEditAccountDialogOpen(true);
  };

  const handleEditAccount = () => {
    if (!editingAccountId) return;
    updateAccount.mutate({
      id: editingAccountId,
      bank_name: accountForm.bank_name,
      account_number: accountForm.account_number,
      account_name: accountForm.account_name,
      is_active: accountForm.is_active
    }, {
      onSuccess: () => {
        setEditAccountDialogOpen(false);
        setEditingAccountId(null);
        setAccountForm({ bank_name: "", account_number: "", account_name: "", is_active: true });
      }
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (!confirm("Are you sure you want to delete this account? This cannot be undone.")) return;
    deleteAccount.mutate(id);
  };

  const activeAccounts = paymentAccounts.filter(a => a.is_active);

  return (
    <MainLayout title="Finance & Payments">
      <div className="mobile-spacing animate-fade-in">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body-small">Total Payments</p>
                  <p className="text-responsive-xl font-bold text-success">{formatCurrency(totalPayments)}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body-small">Total Expenses</p>
                  <p className="text-responsive-xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body-small">Net Income</p>
                  <p className={`text-responsive-xl font-bold ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(netIncome)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body-small">Outstanding Debt</p>
                  <p className="text-responsive-xl font-bold text-amber-600">
                    {formatCurrency(customers.reduce((sum, c) => sum + c.current_balance, 0))}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <Banknote className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Analysis */}
        <Card className="shadow-card hover-lift">
          <CardHeader>
            <CardTitle className="heading-section">Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Current (0-30)</p>
                <p className="text-xl font-bold text-success">{formatCurrency(aging.current)}</p>
              </div>
              <div className="text-center p-4 bg-blue-100 rounded-lg">
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(aging.days30)}</p>
              </div>
              <div className="text-center p-4 bg-amber-100 rounded-lg">
                <p className="text-sm text-muted-foreground">61-90 Days</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(aging.days60)}</p>
              </div>
              <div className="text-center p-4 bg-orange-100 rounded-lg">
                <p className="text-sm text-muted-foreground">91-120 Days</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(aging.days90)}</p>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Over 120 Days</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(aging.over90)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="payments">
          <TabsList className="mb-4">
            <TabsTrigger value="payments">Payment Ledger</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="heading-section flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Payment Ledger
                </CardTitle>
                <div className="flex gap-2">
                  <HaulagePaymentDialog />
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" /> Record Order Payments
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Order Payments</DialogTitle>
                        <DialogDescription>Record a payment received from a customer for a specific order.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Customer *</Label>
                          <Select value={paymentForm.customer_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, customer_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Order *</Label>
                          <Select value={paymentForm.order_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, order_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select order" />
                            </SelectTrigger>
                            <SelectContent>
                              {unsettledOrders
                                .map((o) => (
                                  <SelectItem key={o.order_id} value={o.order_id || ""}>
                                    {o.order_number} (Bal: {formatCurrency(o.balance || 0)})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Amount (₦) *</Label>
                          <Input
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            placeholder="1000000"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Payment Method *</Label>
                          <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="pos">POS</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {(paymentForm.payment_method === 'transfer' || paymentForm.payment_method === 'pos') && (
                          <div className="space-y-2">
                            <Label>Destination Account *</Label>
                            <Select value={paymentForm.payment_account_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_account_id: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeAccounts.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.bank_name} - {acc.account_number} ({acc.account_name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Reference Number</Label>
                          <Input
                            value={paymentForm.reference_number}
                            onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                            placeholder="TRF-123456"
                          />
                        </div>

                        <LoadingButton
                          onClick={handleAddPayment}
                          className="w-full"
                          disabled={!paymentForm.customer_id || !paymentForm.amount || !paymentForm.order_id}
                          isLoading={addPayment.isPending}
                        >
                          Record Order Payments
                        </LoadingButton>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <LoadingSkeleton variant="table" rows={5} />
                ) : payments.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="No payments recorded"
                    description="Record a new payment to start tracking"
                    action={{ label: "Record Order Payments", onClick: () => setPaymentDialogOpen(true) }}
                  />
                ) : (
                  <>
                    <div className="md:hidden grid gap-4">
                      {payments.map((payment) => (
                        <PaymentCard
                          key={payment.id}
                          payment={payment}
                          onEdit={handleOpenEditPayment}
                          onDelete={handleDeletePayment}
                          onConfirm={(id, status) => confirmPayment.mutate({ id, status })}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <ResponsiveTable>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Order</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{format(new Date(payment.payment_date || payment.created_at), "MMM d, yyyy")}</TableCell>
                                <TableCell className="font-medium">{payment.customer?.name || "-"}</TableCell>
                                <TableCell>{payment.order?.order_number || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className="capitalize w-fit">{payment.payment_method}</Badge>
                                    {payment.payment_account && (
                                      <span className="text-xs text-muted-foreground">
                                        {payment.payment_account.bank_name} - {payment.payment_account.account_number.slice(-4)}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{payment.reference_number || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant={payment.status === 'Confirmed' ? 'success' : payment.status === 'Rejected' ? 'destructive' : 'secondary'}>
                                    {payment.status || 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-success">{formatCurrency(payment.amount)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {payment.status === 'Pending' && (payment.payment_method === 'transfer' || payment.payment_method === 'cheque') ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => confirmPayment.mutate({ id: payment.id, status: 'Confirmed' })}
                                          disabled={confirmPayment.isPending}
                                          className="text-success hover:bg-success/10"
                                          aria-label="Confirm Payment"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Confirm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => confirmPayment.mutate({ id: payment.id, status: 'Rejected' })}
                                          disabled={confirmPayment.isPending}
                                          className="text-destructive hover:bg-destructive/10"
                                          aria-label="Reject Payment"
                                        >
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Reject
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenEditPayment(payment)}
                                          aria-label="Edit Payment"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeletePayment(payment.id)}
                                          disabled={deletePayment.isPending}
                                          className="text-destructive hover:bg-destructive/10"
                                          aria-label="Delete Payment"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTable>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="heading-section flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  Expense Tracking
                </CardTitle>
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Plus className="w-4 h-4 mr-2" /> Log Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Expense</DialogTitle>
                      <DialogDescription>Record a new company expense.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Expense Type *</Label>
                        <Select value={expenseForm.expense_type} onValueChange={(v) => setExpenseForm({ ...expenseForm, expense_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="toll">Toll Gate</SelectItem>
                            <SelectItem value="driver_allowance">Driver Allowance</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="loading_fee">Loading Fee</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Related Order (Optional)</Label>
                        <Select value={expenseForm.order_id} onValueChange={(v) => setExpenseForm({ ...expenseForm, order_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                          <SelectContent>
                            {orders.map((o) => (
                              <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Amount (₦) *</Label>
                        <Input
                          type="number"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          placeholder="50000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          placeholder="Additional details"
                        />
                      </div>

                      <LoadingButton
                        onClick={handleAddExpense}
                        className="w-full"
                        disabled={!expenseForm.amount}
                        isLoading={addExpense.isPending}
                      >
                        Log Expense
                      </LoadingButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingExpenses ? (
                  <LoadingSkeleton variant="table" rows={5} />
                ) : expenses.length === 0 ? (
                  <EmptyState
                    icon={TrendingDown}
                    title="No expenses logged"
                    description="Log company expenses to track spending"
                    action={{ label: "Log Expense", onClick: () => setExpenseDialogOpen(true) }}
                  />
                ) : (
                  <>
                    <div className="md:hidden grid gap-4">
                      {expenses.map((expense) => (
                        <ExpenseCard
                          key={expense.id}
                          expense={expense}
                          onEdit={handleOpenEditExpense}
                          onDelete={handleDeleteExpense}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <ResponsiveTable>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Order</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expenses.map((expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>{format(new Date(expense.created_at), "MMM d, yyyy")}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {expense.expense_type.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell>{expense.order?.order_number || "-"}</TableCell>
                                <TableCell className="text-muted-foreground">{expense.description || "-"}</TableCell>
                                <TableCell className="text-right font-medium text-destructive">{formatCurrency(expense.amount)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEditExpense(expense)}
                                      aria-label="Edit Expense"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      disabled={deleteExpense.isPending}
                                      className="text-destructive hover:bg-destructive/10"
                                      aria-label="Delete Expense"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTable>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="heading-section flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-primary" />
                  Payment Accounts
                </CardTitle>
                <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Plus className="w-4 h-4 mr-2" /> Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment Account</DialogTitle>
                      <DialogDescription>Add a new bank account for receiving payments.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Bank Name *</Label>
                        <Input
                          value={accountForm.bank_name}
                          onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                          placeholder="e.g. Zenith Bank"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number *</Label>
                        <Input
                          value={accountForm.account_number}
                          onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                          placeholder="0123456789"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name *</Label>
                        <Input
                          value={accountForm.account_name}
                          onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                          placeholder="Account Holder Name"
                        />
                      </div>
                      <LoadingButton
                        onClick={handleAddAccount}
                        className="w-full"
                        disabled={!accountForm.bank_name || !accountForm.account_number || !accountForm.account_name}
                        isLoading={addAccount.isPending}
                      >
                        Add Account
                      </LoadingButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingAccounts ? (
                  <LoadingSkeleton variant="table" rows={3} />
                ) : paymentAccounts.length === 0 ? (
                  <EmptyState
                    icon={Landmark}
                    title="No accounts added"
                    description="Add payment accounts to track where funds are received"
                    action={{ label: "Add Account", onClick: () => setAccountDialogOpen(true) }}
                  />
                ) : (
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.bank_name}</TableCell>
                            <TableCell>{account.account_number}</TableCell>
                            <TableCell>{account.account_name}</TableCell>
                            <TableCell>
                              <Badge variant={account.is_active ? "default" : "secondary"}>
                                {account.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditAccount(account)}
                                  aria-label="Edit Account"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteAccount(account.id)}
                                  disabled={deleteAccount.isPending}
                                  className="text-destructive hover:bg-destructive/10"
                                  aria-label="Delete Account"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={editPaymentDialogOpen} onOpenChange={(open) => {
        setEditPaymentDialogOpen(open);
        if (!open) {
          setEditingPaymentId(null);
          setPaymentForm({ customer_id: "", order_id: "", amount: "", payment_method: "transfer", reference_number: "", payment_account_id: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update the details of an existing payment record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={paymentForm.customer_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, customer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order (Unsettled)</Label>
              <Select value={paymentForm.order_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, order_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {unsettledOrders.map((o) => (
                    <SelectItem key={o.order_id} value={o.order_id || ""}>
                      {o.order_number} (Bal: {formatCurrency(o.balance || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₦) *</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="1000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(paymentForm.payment_method === 'transfer' || paymentForm.payment_method === 'pos') && (
              <div className="space-y-2">
                <Label>Destination Account *</Label>
                <Select value={paymentForm.payment_account_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_account_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.bank_name} - {acc.account_number} ({acc.account_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={paymentForm.reference_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                placeholder="TRF-123456"
              />
            </div>
            <LoadingButton
              onClick={handleEditPayment}
              className="w-full"
              disabled={!paymentForm.customer_id || !paymentForm.amount}
              isLoading={updatePayment.isPending}
            >
              Save Changes
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editExpenseDialogOpen} onOpenChange={(open) => {
        setEditExpenseDialogOpen(open);
        if (!open) {
          setEditingExpenseId(null);
          setExpenseForm({ order_id: "", expense_type: "fuel", amount: "", description: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Modify an existing expense record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expense Type *</Label>
              <Select value={expenseForm.expense_type} onValueChange={(v) => setExpenseForm({ ...expenseForm, expense_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="toll">Toll Gate</SelectItem>
                  <SelectItem value="driver_allowance">Driver Allowance</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="loading_fee">Loading Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₦) *</Label>
              <Input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Additional details"
              />
            </div>
            <LoadingButton
              onClick={handleEditExpense}
              className="w-full"
              disabled={!expenseForm.amount}
              isLoading={updateExpense.isPending}
            >
              Save Changes
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={editAccountDialogOpen} onOpenChange={(open) => {
        setEditAccountDialogOpen(open);
        if (!open) {
          setEditingAccountId(null);
          setAccountForm({ bank_name: "", account_number: "", account_name: "", is_active: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Account</DialogTitle>
            <DialogDescription>Update bank account information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank Name *</Label>
              <Input
                value={accountForm.bank_name}
                onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                placeholder="e.g. Zenith Bank"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number *</Label>
              <Input
                value={accountForm.account_number}
                onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                placeholder="0123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Name *</Label>
              <Input
                value={accountForm.account_name}
                onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                placeholder="Account Holder Name"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={accountForm.is_active}
                onChange={(e) => setAccountForm({ ...accountForm, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <LoadingButton
              onClick={handleEditAccount}
              className="w-full"
              disabled={!accountForm.bank_name || !accountForm.account_number || !accountForm.account_name}
              isLoading={updateAccount.isPending}
            >
              Save Changes
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
