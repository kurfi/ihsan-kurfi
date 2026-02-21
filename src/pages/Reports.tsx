import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import {
    useExpiringDocuments,
    useDualStreamProfitability,
    useCustomerAging,
    useFleetAvailability,
    useSalesSummary,
    usePaginatedPendingDeliveries,
    useDailyCashPosition,
    usePaginatedDirectDeliveries,
} from '@/hooks/useReports';
import { useMonthlyProfitLoss, useReceivablesAging } from '@/hooks/useFinancialReports';

import { DualStreamCard } from '@/components/reports/DualStreamCard';
import { FileDown, TrendingUp, TrendingDown, AlertTriangle, Banknote, Package, Truck, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { generateDriverExpirySheet } from '@/lib/pdfGenerator';
import { useDrivers } from '@/hooks/useFleet';
import { useDocuments } from '@/hooks/useDocuments';
import * as XLSX from 'xlsx';
import { DocumentExpiryCard } from '@/components/reports/DocumentExpiryCard';
import { FleetStatusCard } from '@/components/reports/FleetStatusCard';
import { PendingDeliveryCard } from '@/components/reports/PendingDeliveryCard';
import { CustomerAgingCard } from '@/components/reports/CustomerAgingCard';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('compliance');
    // Financial sub-tab state
    const [financeSubTab, setFinanceSubTab] = useState('overview');

    // Pagination state for reports
    const [pendingPage, setPendingPage] = useState(1);
    const [directPage, setDirectPage] = useState(1);
    const PAGE_SIZE = 15;

    // Compliance tab queries — only run when compliance tab is active
    const isComplianceTab = activeTab === 'compliance';
    const { data: expiringDocs = [], isLoading: docsLoading } = useExpiringDocuments(isComplianceTab);
    const { data: fleetStatus = [], isLoading: fleetLoading } = useFleetAvailability(isComplianceTab);
    const { data: drivers = [] } = useDrivers();
    const { data: documents = [] } = useDocuments();

    // Sales tab queries — only run when sales tab is active
    const isSalesTab = activeTab === 'sales';
    const { data: salesSummary, isLoading: salesLoading } = useSalesSummary(undefined, undefined, isSalesTab);
    const { data: pendingDeliveriesData, isLoading: deliveriesLoading } = usePaginatedPendingDeliveries(pendingPage, PAGE_SIZE, isSalesTab);
    const pendingDeliveries = pendingDeliveriesData?.items || [];
    const pendingCount = pendingDeliveriesData?.count || 0;

    // Finance tab queries — only run when finance tab is active
    const isFinanceTab = activeTab === 'finance';
    const { data: customerAging = [], isLoading: agingLoading } = useCustomerAging(isFinanceTab);
    const { data: cashPosition, isLoading: cashLoading } = useDailyCashPosition(undefined, isFinanceTab);
    const { data: monthlyPL = [], isLoading: loadingPL } = useMonthlyProfitLoss(undefined, undefined, isFinanceTab);
    const { data: receivables = [], isLoading: loadingReceivables } = useReceivablesAging(isFinanceTab);
    const { data: directDropsData, isLoading: loadingDirectDrops } = usePaginatedDirectDeliveries(directPage, PAGE_SIZE, isFinanceTab);
    const directDrops = directDropsData?.items || [];
    const directCount = directDropsData?.count || 0;
    const { data: dualStreamData = [] } = useDualStreamProfitability(isFinanceTab);

    const currentMonth = monthlyPL[0];
    const totalReceivables = receivables.reduce((sum, r) => sum + r.total_owed, 0);

    // Dual-stream computed values
    const haulageRevenue = dualStreamData.reduce((sum, record) => sum + (record.haulage_revenue || 0), 0);
    const haulageProfit = dualStreamData.reduce((sum, record) => sum + (record.haulage_profit || 0), 0);
    const tradingRevenue = dualStreamData.reduce((sum, record) => sum + (record.trading_revenue || 0), 0);
    const tradingProfit = dualStreamData.reduce((sum, record) => sum + (record.trading_profit || 0), 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportToExcel = (data: Record<string, any>[], filename: string) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleExportDriverExpiry = () => {
        const driversWithDocs = drivers.map(driver => ({
            ...driver,
            documents: documents.filter(doc => doc.entity_id === driver.id && doc.entity_type === 'driver'),
        }));
        generateDriverExpirySheet(driversWithDocs);
    };

    return (
        <MainLayout title="Reports & Analytics">
            <div className="mobile-spacing">
                <Tabs defaultValue="compliance" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
                        <TabsTrigger value="compliance" className="text-xs sm:text-sm">Fleet & Compliance</TabsTrigger>
                        <TabsTrigger value="sales" className="text-xs sm:text-sm">Sales & Loading</TabsTrigger>
                        <TabsTrigger value="finance" className="text-xs sm:text-sm">Financial Analytics</TabsTrigger>
                    </TabsList>

                    {/* Fleet & Compliance Reports */}
                    <TabsContent value="compliance" className="space-y-4">
                        {/* Document Expiry Report */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="heading-section flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                                        Document Expiry Report
                                    </CardTitle>
                                    <CardDescription>Documents expiring in the next 30 days</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleExportDriverExpiry} variant="outline" size="sm">
                                        <FileDown className="h-4 w-4 mr-2" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        onClick={() => exportToExcel(expiringDocs, 'expiring_documents')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <FileDown className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {docsLoading ? (
                                    <LoadingSkeleton variant="table" rows={5} />
                                ) : (
                                    <>
                                        <div className="md:hidden grid gap-4">
                                            {expiringDocs.length === 0 ? (
                                                <EmptyState
                                                    icon={AlertTriangle}
                                                    title="No expiring documents"
                                                    description="All documents are up to date"
                                                />
                                            ) : (
                                                expiringDocs.map((doc) => (
                                                    <DocumentExpiryCard key={doc.id} doc={doc} />
                                                ))
                                            )}
                                        </div>
                                        <div className="hidden md:block">
                                            <ResponsiveTable>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Entity</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Document Type</TableHead>
                                                            <TableHead>Document No.</TableHead>
                                                            <TableHead>Expiry Date</TableHead>
                                                            <TableHead>Days Remaining</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {expiringDocs.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={7} className="text-center py-8">
                                                                    <EmptyState
                                                                        icon={AlertTriangle}
                                                                        title="No expiring documents"
                                                                        description="All documents are up to date"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            expiringDocs.map((doc) => (
                                                                <TableRow key={doc.id}>
                                                                    <TableCell className="font-medium">{doc.entity_name}</TableCell>
                                                                    <TableCell className="capitalize">{doc.entity_type}</TableCell>
                                                                    <TableCell className="capitalize">
                                                                        {doc.document_type.replace('_', ' ')}
                                                                    </TableCell>
                                                                    <TableCell>{doc.document_number || 'N/A'}</TableCell>
                                                                    <TableCell>{format(new Date(doc.expiry_date), 'dd/MM/yyyy')}</TableCell>
                                                                    <TableCell>{doc.days_until_expiry} days</TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant={
                                                                                doc.status === 'expired'
                                                                                    ? 'destructive'
                                                                                    : doc.status === 'critical'
                                                                                        ? 'destructive'
                                                                                        : doc.status === 'warning'
                                                                                            ? 'secondary'
                                                                                            : 'default'
                                                                            }
                                                                        >
                                                                            {doc.status.toUpperCase()}
                                                                        </Badge>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </ResponsiveTable>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Fleet Availability */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="heading-section flex items-center gap-2">
                                        <Truck className="h-5 w-5 text-blue-500" />
                                        Truck Availability Report
                                    </CardTitle>
                                    <CardDescription>Current status of all fleet vehicles</CardDescription>
                                </div>
                                <Button
                                    onClick={() => exportToExcel(fleetStatus, 'fleet_availability')}
                                    variant="outline"
                                    size="sm"
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-responsive-xl font-bold text-green-600">
                                                {fleetStatus.filter((t) => t.availability_status === 'available').length}
                                            </div>
                                            <p className="body-small">Available</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-responsive-xl font-bold text-blue-600">
                                                {fleetStatus.filter((t) => t.availability_status === 'in_use').length}
                                            </div>
                                            <p className="body-small">In Use</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-responsive-xl font-bold text-red-600">
                                                {fleetStatus.filter((t) => t.availability_status === 'expired_docs').length}
                                            </div>
                                            <p className="body-small">Expired Docs</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-responsive-xl font-bold text-gray-600">
                                                {fleetStatus.filter((t) => !t.is_active).length}
                                            </div>
                                            <p className="body-small">Inactive</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <>
                                    <div className="md:hidden grid gap-4">
                                        {fleetStatus.map((truck) => (
                                            <FleetStatusCard key={truck.id} truck={truck} />
                                        ))}
                                    </div>
                                    <div className="hidden md:block">
                                        <ResponsiveTable>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Plate Number</TableHead>
                                                        <TableHead>Model</TableHead>
                                                        <TableHead>Capacity</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Expired Docs</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fleetStatus.map((truck) => (
                                                        <TableRow key={truck.id}>
                                                            <TableCell className="font-medium">{truck.plate_number}</TableCell>
                                                            <TableCell>{truck.model || 'N/A'}</TableCell>
                                                            <TableCell>{truck.capacity_tons} Tons</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        truck.availability_status === 'available'
                                                                            ? 'default'
                                                                            : truck.availability_status === 'in_use'
                                                                                ? 'secondary'
                                                                                : 'destructive'
                                                                    }
                                                                >
                                                                    {truck.availability_status.replace('_', ' ').toUpperCase()}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {truck.expired_doc_count > 0 ? (
                                                                    <span className="text-red-600 font-semibold">{truck.expired_doc_count}</span>
                                                                ) : (
                                                                    <span className="text-green-600">0</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ResponsiveTable>
                                    </div>
                                </>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sales & Loading Reports */}
                    <TabsContent value="sales" className="space-y-4">
                        {/* Sales Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            <Card>
                                <CardHeader>
                                    <CardTitle className="heading-section flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-500" />
                                        Total Sales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-responsive-2xl font-bold">
                                        {salesSummary?.totalTons.toFixed(1) || 0} Tons
                                        {salesSummary?.totalBags ? <span className="text-sm ml-2"> + {salesSummary.totalBags} Bags</span> : ''}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        ₦{(salesSummary?.totalRevenue || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {salesSummary?.count || 0} orders
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Pending Deliveries */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="heading-section">Pending Deliveries</CardTitle>
                                    <CardDescription>Orders that have been dispatched but not yet delivered</CardDescription>
                                </div>
                                <Button
                                    onClick={() => exportToExcel(pendingDeliveries, 'pending_deliveries')}
                                    variant="outline"
                                    size="sm"
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {deliveriesLoading ? (
                                    <LoadingSkeleton variant="table" rows={5} />
                                ) : (
                                    <>
                                        <div className="md:hidden grid gap-4">
                                            {pendingDeliveries.length === 0 ? (
                                                <EmptyState
                                                    icon={Truck}
                                                    title="No pending deliveries"
                                                    description="All orders have been delivered"
                                                />
                                            ) : (
                                                pendingDeliveries.map((order) => (
                                                    <PendingDeliveryCard key={order.id} order={order} />
                                                ))
                                            )}
                                        </div>
                                        <div className="hidden md:block">
                                            <ResponsiveTable>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Order No.</TableHead>
                                                            <TableHead>Customer</TableHead>
                                                            <TableHead>Quantity</TableHead>
                                                            <TableHead>Truck</TableHead>
                                                            <TableHead>Driver</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {pendingDeliveries.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="text-center py-8">
                                                                    <EmptyState
                                                                        icon={Truck}
                                                                        title="No pending deliveries"
                                                                        description="All orders have been delivered"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            pendingDeliveries.map((order) => (
                                                                <TableRow key={order.id}>
                                                                    <TableCell className="font-medium">{order.order_number}</TableCell>
                                                                    <TableCell>{order.customers?.name || 'N/A'}</TableCell>
                                                                    <TableCell>{order.quantity} {order.unit === 'tons' ? 'Tons' : 'Bags'}</TableCell>
                                                                    <TableCell>{order.trucks?.plate_number || 'Not Assigned'}</TableCell>
                                                                    <TableCell>{order.drivers?.name || 'Not Assigned'}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="secondary">{order.status?.replace('_', ' ').toUpperCase()}</Badge>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </ResponsiveTable>
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {pendingDeliveries.length} of {pendingCount} deliveries
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pendingPage === 1}
                                            onClick={() => setPendingPage(p => p - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pendingPage * PAGE_SIZE >= pendingCount}
                                            onClick={() => setPendingPage(p => p + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Financial Analytics - Consolidated */}
                    <TabsContent value="finance" className="space-y-4">

                        {/* Summary Cards from FinancialReports */}
                        {currentMonth && (
                            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue (MTD)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ₦{currentMonth.total_revenue.toLocaleString()}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <TrendingUp className="h-3 w-3 mr-1 text-success" />
                                            This month
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Net Profit (MTD)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${currentMonth.net_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            ₦{currentMonth.net_profit.toLocaleString()}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            {currentMonth.net_profit > 0 ? (
                                                <TrendingUp className="h-3 w-3 mr-1 text-success" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
                                            )}
                                            {currentMonth.total_revenue > 0
                                                ? ((currentMonth.net_profit / currentMonth.total_revenue) * 100).toFixed(1)
                                                : 0}% margin
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Haulage Profit</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ₦{(currentMonth.haulage_revenue - currentMonth.trip_costs - currentMonth.other_expenses).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {currentMonth.haulage_revenue > 0
                                                ? (((currentMonth.haulage_revenue - currentMonth.trip_costs - currentMonth.other_expenses) / currentMonth.haulage_revenue) * 100).toFixed(1)
                                                : 0}% margin
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Cement Profit</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ₦{(currentMonth.cement_sales - currentMonth.cement_purchases).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {currentMonth.cement_sales > 0
                                                ? (((currentMonth.cement_sales - currentMonth.cement_purchases) / currentMonth.cement_sales) * 100).toFixed(1)
                                                : 0}% margin
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Finance Sub-Tabs */}
                        <Tabs value={financeSubTab} onValueChange={setFinanceSubTab}>
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto sm:h-10">
                                <TabsTrigger value="overview" className="text-xs">Cash Position</TabsTrigger>
                                <TabsTrigger value="pl" className="text-xs">Profit & Loss</TabsTrigger>
                                <TabsTrigger value="aging" className="text-xs">Debtors Aging</TabsTrigger>
                                <TabsTrigger value="dual-stream" className="text-xs">Dual-Stream</TabsTrigger>
                            </TabsList>

                            {/* Cash Position */}
                            <TabsContent value="overview" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="heading-section flex items-center gap-2">
                                            <Banknote className="h-5 w-5 text-green-500" />
                                            Daily Cash/Bank Position
                                        </CardTitle>
                                        <CardDescription>
                                            {cashPosition?.date ? format(cashPosition.date, 'EEEE, MMMM d, yyyy') : ''}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <p className="body-small">Total Income</p>
                                                <p className="text-responsive-xl font-bold text-green-600">
                                                    ₦{(cashPosition?.totalIncome || 0).toLocaleString()}
                                                </p>
                                                <p className="body-small">{cashPosition?.paymentsCount || 0} payments</p>
                                            </div>
                                            <div>
                                                <p className="body-small">Total Expenses</p>
                                                <p className="text-responsive-xl font-bold text-red-600">
                                                    ₦{(cashPosition?.totalExpenses || 0).toLocaleString()}
                                                </p>
                                                <p className="body-small">{cashPosition?.expensesCount || 0} expenses</p>
                                            </div>
                                            <div>
                                                <p className="body-small">Net Position</p>
                                                <p
                                                    className={`text-responsive-xl font-bold ${(cashPosition?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                >
                                                    ₦{(cashPosition?.netPosition || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Income by Payment Method</h4>
                                            <div className="space-y-2">
                                                {Object.entries(cashPosition?.byPaymentMethod || {}).map(([method, amount]) => (
                                                    <div key={method} className="flex justify-between items-center">
                                                        <span className="text-sm capitalize">{method}</span>
                                                        <span className="font-semibold">₦{(amount as number).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Monthly P&L */}
                            <TabsContent value="pl" className="space-y-4">
                                <Card className="shadow-card">
                                    <CardHeader>
                                        <CardTitle className="heading-section flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Monthly Profit & Loss
                                        </CardTitle>
                                        <CardDescription>Dual revenue stream analysis (Haulage + Cement Trading)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {loadingPL ? (
                                            <div className="p-4">
                                                <LoadingSkeleton variant="table" rows={6} />
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Month</TableHead>
                                                            <TableHead className="text-right">Haulage Revenue</TableHead>
                                                            <TableHead className="text-right">Cement Sales</TableHead>
                                                            <TableHead className="text-right">Total Revenue</TableHead>
                                                            <TableHead className="text-right">Total Costs</TableHead>
                                                            <TableHead className="text-right">Net Profit</TableHead>
                                                            <TableHead className="text-right">Margin %</TableHead>
                                                            <TableHead className="text-right">Trips</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {monthlyPL.map((pl) => (
                                                            <TableRow key={pl.month}>
                                                                <TableCell className="font-medium">
                                                                    {format(new Date(pl.month), "MMM yyyy")}
                                                                </TableCell>
                                                                <TableCell className="text-right">₦{pl.haulage_revenue.toLocaleString()}</TableCell>
                                                                <TableCell className="text-right">₦{pl.cement_sales.toLocaleString()}</TableCell>
                                                                <TableCell className="text-right font-semibold">₦{pl.total_revenue.toLocaleString()}</TableCell>
                                                                <TableCell className="text-right">₦{pl.total_costs.toLocaleString()}</TableCell>
                                                                <TableCell className={`text-right font-bold ${pl.net_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                                    ₦{pl.net_profit.toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {pl.total_revenue > 0 ? ((pl.net_profit / pl.total_revenue) * 100).toFixed(1) : 0}%
                                                                </TableCell>
                                                                <TableCell className="text-right">{pl.trip_count}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Debtors Aging (merged Customer Aging + Receivables) */}
                            <TabsContent value="aging" className="space-y-4">
                                {/* Receivables Aging from FinancialReports */}
                                <Card className="shadow-card">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="heading-section flex items-center gap-2">
                                                <Users className="h-5 w-5 text-orange-500" />
                                                Accounts Receivable Aging
                                            </CardTitle>
                                            <CardDescription>
                                                Total Outstanding: ₦{totalReceivables.toLocaleString()} from {receivables.length} customers
                                            </CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => exportToExcel(receivables as any, 'receivables_aging')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <FileDown className="h-4 w-4 mr-2" />
                                            Export Excel
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {loadingReceivables ? (
                                            <div className="p-4">
                                                <LoadingSkeleton variant="table" rows={5} />
                                            </div>
                                        ) : receivables.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p>No outstanding receivables</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Customer</TableHead>
                                                            <TableHead className="text-right">Amount Owed</TableHead>
                                                            <TableHead>Oldest Invoice</TableHead>
                                                            <TableHead>Days Outstanding</TableHead>
                                                            <TableHead>Aging</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {receivables.map((r) => (
                                                            <TableRow key={r.customer_id}>
                                                                <TableCell className="font-medium">{r.customer_name}</TableCell>
                                                                <TableCell className="text-right font-semibold">₦{r.total_owed.toLocaleString()}</TableCell>
                                                                <TableCell>{format(new Date(r.oldest_invoice_date), "MMM dd, yyyy")}</TableCell>
                                                                <TableCell>
                                                                    <span className={r.days_outstanding > 60 ? 'text-destructive font-semibold' : ''}>
                                                                        {r.days_outstanding} days
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={
                                                                        r.aging_bucket === 'Current' ? 'default' :
                                                                            r.aging_bucket === '31-60 days' ? 'secondary' :
                                                                                'destructive'
                                                                    }>
                                                                        {r.aging_bucket}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Customer Aging from original Reports */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="heading-section flex items-center gap-2">
                                                <Users className="h-5 w-5 text-orange-500" />
                                                Customer Debtors List (Detailed Aging)
                                            </CardTitle>
                                            <CardDescription>Breakdown of outstanding balances by age bracket</CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => exportToExcel(customerAging, 'customer_aging')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <FileDown className="h-4 w-4 mr-2" />
                                            Export Excel
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <>
                                            <div className="md:hidden grid gap-4">
                                                {customerAging.length === 0 ? (
                                                    <EmptyState
                                                        icon={Users}
                                                        title="No customer debt"
                                                        description="All customers are up to date"
                                                    />
                                                ) : (
                                                    customerAging
                                                        .filter((c) => (c.current_balance ?? 0) > 0)
                                                        .map((customer) => (
                                                            <CustomerAgingCard key={customer.id} customer={customer} />
                                                        ))
                                                )}
                                            </div>
                                            <div className="hidden md:block">
                                                <ResponsiveTable>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Customer</TableHead>
                                                                <TableHead>Credit Limit</TableHead>
                                                                <TableHead>Current Balance</TableHead>
                                                                <TableHead>0-30 Days</TableHead>
                                                                <TableHead>31-60 Days</TableHead>
                                                                <TableHead>61-90 Days</TableHead>
                                                                <TableHead>&gt;90 Days</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {customerAging.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-8">
                                                                        <EmptyState
                                                                            icon={Users}
                                                                            title="No customer debt"
                                                                            description="All customers are up to date"
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                customerAging
                                                                    .filter((c) => (c.current_balance ?? 0) > 0)
                                                                    .map((customer) => (
                                                                        <TableRow key={customer.id}>
                                                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                                                            <TableCell>₦{(customer.credit_limit || 0).toLocaleString()}</TableCell>
                                                                            <TableCell className="font-semibold">
                                                                                ₦{(customer.current_balance || 0).toLocaleString()}
                                                                            </TableCell>
                                                                            <TableCell>₦{(customer.current_0_30 || 0).toLocaleString()}</TableCell>
                                                                            <TableCell className="text-orange-600">
                                                                                ₦{(customer.days_31_60 || 0).toLocaleString()}
                                                                            </TableCell>
                                                                            <TableCell className="text-red-600">
                                                                                ₦{(customer.days_61_90 || 0).toLocaleString()}
                                                                            </TableCell>
                                                                            <TableCell className="text-red-700 font-semibold">
                                                                                ₦{(customer.over_90_days || 0).toLocaleString()}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </ResponsiveTable>
                                            </div>
                                        </>
                                    </CardContent>
                                </Card>
                            </TabsContent>


                            {/* Dual-Stream Analysis */}
                            <TabsContent value="dual-stream" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="heading-section flex items-center gap-2">
                                            <Banknote className="h-5 w-5 text-primary" />
                                            Dual-Stream Business Analysis
                                        </CardTitle>
                                        <CardDescription>Separation of Haulage vs Cement Trading profitability</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <DualStreamCard
                                            haulageRevenue={haulageRevenue}
                                            haulageProfit={haulageProfit}
                                            tradingRevenue={tradingRevenue}
                                            tradingProfit={tradingProfit}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
