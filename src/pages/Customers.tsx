import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { useCustomers, useAddCustomer, useToggleCustomerBlock, useUpdateCustomer, Customer } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { usePayments } from "@/hooks/useFinance";
import { Plus, Users, AlertCircle, TrendingUp, Banknote, Ban, Check, FileText, Pencil } from "lucide-react";
import { format } from "date-fns";
import { generateStatementOfAccount, printDocument, StatementData } from "@/lib/documentGenerator";

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers();
  const { data: orders = [] } = useOrders();
  const { data: payments = [] } = usePayments();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const toggleBlock = useToggleCustomerBlock();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    credit_limit: "",
    current_balance: "0",
    category: "retailer",
  });

  const handleAddCustomer = () => {
    addCustomer.mutate({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      credit_limit: parseFloat(form.credit_limit) || 0,
      current_balance: parseFloat(form.current_balance) || 0,
      category: form.category,
      is_blocked: false,
      price_tier: null,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ name: "", email: "", phone: "", address: "", credit_limit: "", current_balance: "0", category: "retailer" });
      }
    });
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer.id);
    setForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      credit_limit: customer.credit_limit.toString(),
      current_balance: customer.current_balance.toString(),
      category: customer.category || "retailer",
    });
    setEditDialogOpen(true);
  };

  const handleEditCustomer = () => {
    if (!editingCustomer) return;
    updateCustomer.mutate({
      id: editingCustomer,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      credit_limit: parseFloat(form.credit_limit) || 0,
      current_balance: parseFloat(form.current_balance) || 0,
      category: form.category,
      price_tier: null,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setEditingCustomer(null);
        setForm({ name: "", email: "", phone: "", address: "", credit_limit: "", current_balance: "0", category: "retailer" });
      }
    });
  };

  const totalCreditLimit = customers.reduce((sum, c) => sum + c.credit_limit, 0);
  const totalBalance = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const customersNearLimit = customers.filter(c => c.current_balance >= c.credit_limit * 0.8).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleGenerateStatement = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const customerOrders = orders.filter(o => o.customer_id === customerId);
    const customerPayments = payments.filter(p => p.customer_id === customerId);

    const transactions: StatementData['transactions'] = [];
    let runningBalance = 0;

    const allTransactions = [
      ...customerOrders.map(o => ({
        date: new Date(o.created_at),
        type: 'debit' as const,
        description: `Order ${o.order_number || o.id.slice(0, 8)} - ${o.quantity}T ${o.cement_type}`,
        amount: o.total_amount || 0,
      })),
      ...customerPayments.map(p => ({
        date: new Date(p.payment_date),
        type: 'credit' as const,
        description: `Payment - ${p.payment_method}${p.reference_number ? ` (Ref: ${p.reference_number})` : ''}`,
        amount: p.amount,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const t of allTransactions) {
      if (t.type === 'debit') {
        runningBalance += t.amount;
        transactions.push({
          date: format(t.date, 'MMM d, yyyy'),
          description: t.description,
          debit: t.amount,
          credit: 0,
          balance: runningBalance,
        });
      } else {
        runningBalance -= t.amount;
        transactions.push({
          date: format(t.date, 'MMM d, yyyy'),
          description: t.description,
          debit: 0,
          credit: t.amount,
          balance: runningBalance,
        });
      }
    }

    const statementData: StatementData = {
      customerName: customer.name,
      customerAddress: customer.address || "",
      customerPhone: customer.phone || "",
      creditLimit: customer.credit_limit,
      currentBalance: customer.current_balance,
      transactions,
      generatedDate: format(new Date(), 'PPP'),
    };

    printDocument(generateStatementOfAccount(statementData));
  };

  return (
    <MainLayout title="Customer Management">
      <div className="mobile-spacing animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-card hover-lift">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-responsive-2xl font-bold">{customers.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credit Limit</p>
                  <p className="text-responsive-xl font-bold">{formatCurrency(totalCreditLimit)}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-responsive-xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-card ${customersNearLimit > 0 ? "border-destructive/30" : ""}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Near Credit Limit</p>
                  <p className="text-responsive-2xl font-bold">{customersNearLimit}</p>
                </div>
                <div className={`p-3 rounded-xl ${customersNearLimit > 0 ? "bg-destructive/10" : "bg-success/10"}`}>
                  <AlertCircle className={`w-6 h-6 ${customersNearLimit > 0 ? "text-destructive" : "text-success"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="heading-section">All Customers</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" /> Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>Create a new customer profile to track orders and balances.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Company Ltd"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="info@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+234..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Business address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wholesaler">Wholesaler</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="block_industry">Block Industry</SelectItem>
                          <SelectItem value="walk_in">Walk-in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Credit Limit (₦)</Label>
                      <Input
                        type="number"
                        value={form.credit_limit}
                        onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                        placeholder="5000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Balance (₦)</Label>
                      <Input
                        type="number"
                        value={form.current_balance}
                        onChange={(e) => setForm({ ...form, current_balance: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <LoadingButton
                    onClick={handleAddCustomer}
                    className="w-full"
                    disabled={!form.name || !form.credit_limit}
                    isLoading={addCustomer.isPending}
                  >
                    Add Customer
                  </LoadingButton>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSkeleton variant="table" rows={5} />
            ) : (
              <>
                <div className="md:hidden grid gap-4 p-4">
                  {customers.map((customer) => {
                    const usagePercent = customer.credit_limit > 0
                      ? (customer.current_balance / customer.credit_limit) * 100
                      : 0;
                    const isNearLimit = usagePercent >= 80;
                    const isAtLimit = usagePercent >= 100;

                    return (
                      <Card key={customer.id} className={`shadow-sm ${customer.is_blocked ? "opacity-60" : ""}`}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{customer.name}</p>
                              <Badge variant="outline" className="mt-1 capitalize text-xs">
                                {customer.category?.replace('_', ' ') || 'retailer'}
                              </Badge>
                            </div>
                            {customer.is_blocked ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : (
                              <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"}
                                className={!isAtLimit && !isNearLimit ? "bg-success text-success-foreground" : ""}>
                                {isAtLimit ? "Limit Reached" : isNearLimit ? "Near Limit" : "Active"}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Balance</p>
                              <p className={`font-medium ${isAtLimit ? "text-destructive" : ""}`}>
                                {formatCurrency(customer.current_balance)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Credit Limit</p>
                              <p className="font-medium">{formatCurrency(customer.credit_limit)}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Credit Usage</span>
                              <span>{usagePercent.toFixed(0)}%</span>
                            </div>
                            <Progress
                              value={Math.min(usagePercent, 100)}
                              className={`h-1.5 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-warning" : ""}`}
                            />
                          </div>

                          <div className="pt-2 border-t flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(customer)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateStatement(customer.id)}
                            >
                              Stmt
                            </Button>
                            <Button
                              size="sm"
                              variant={customer.is_blocked ? "outline" : "destructive"}
                              className={!customer.is_blocked ? "hover:bg-destructive/10 text-destructive border-destructive/20" : ""}
                              onClick={() => toggleBlock.mutate({ id: customer.id, is_blocked: !customer.is_blocked })}
                            >
                              {customer.is_blocked ? "Unblock" : "Block"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="hidden md:block">
                  <ResponsiveTable>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Credit Limit</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Credit Usage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => {
                          const usagePercent = customer.credit_limit > 0
                            ? (customer.current_balance / customer.credit_limit) * 100
                            : 0;
                          const isNearLimit = usagePercent >= 80;
                          const isAtLimit = usagePercent >= 100;

                          return (
                            <TableRow key={customer.id} className={customer.is_blocked ? "opacity-60" : ""}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  {customer.address && (
                                    <p className="text-xs text-muted-foreground">{customer.address}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {customer.category?.replace('_', ' ') || 'retailer'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(customer.credit_limit)}
                              </TableCell>
                              <TableCell className={isAtLimit ? "text-destructive font-medium" : ""}>
                                {formatCurrency(customer.current_balance)}
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <div className="space-y-1">
                                  <Progress
                                    value={Math.min(usagePercent, 100)}
                                    className={`h-2 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-warning" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground">{usagePercent.toFixed(0)}% used</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {customer.is_blocked ? (
                                  <Badge variant="destructive">Blocked</Badge>
                                ) : (
                                  <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"}
                                    className={!isAtLimit && !isNearLimit ? "bg-success text-success-foreground" : ""}>
                                    {isAtLimit ? "Limit Reached" : isNearLimit ? "Near Limit" : "Active"}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenEdit(customer)}
                                    title="Edit Customer"
                                    aria-label="Edit Customer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateStatement(customer.id)}
                                    title="Generate Statement"
                                    aria-label="Generate Statement"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={customer.is_blocked ? "outline" : "destructive"}
                                    onClick={() => toggleBlock.mutate({ id: customer.id, is_blocked: !customer.is_blocked })}
                                  >
                                    {customer.is_blocked ? (
                                      <><Check className="w-3 h-3 mr-1" /> Unblock</>
                                    ) : (
                                      <><Ban className="w-3 h-3 mr-1" /> Block</>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ResponsiveTable>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingCustomer(null);
          setForm({ name: "", email: "", phone: "", address: "", credit_limit: "", current_balance: "0", category: "retailer" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer contact details and credit settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Company Ltd"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Business address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="block_industry">Block Industry</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credit Limit (₦)</Label>
                <Input
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                  placeholder="5000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Balance (₦)</Label>
                <Input
                  type="number"
                  value={form.current_balance}
                  onChange={(e) => setForm({ ...form, current_balance: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <LoadingButton
              onClick={handleEditCustomer}
              className="w-full"
              disabled={!form.name || !form.credit_limit}
              isLoading={updateCustomer.isPending}
            >
              Save Changes
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
