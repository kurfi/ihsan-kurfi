import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { format } from 'date-fns';

interface jsPDFWithPlugin extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

interface Order {
    id: string;
    order_number?: string | null;
    atc_number?: string | null;
    customer_id?: string | null;
    cement_type: string;
    quantity?: number;
    quantity_tons?: number;
    unit?: 'tons' | 'bags' | string | null;
    total_amount?: number | null;
    delivery_address?: string | null;
    created_at: string;
    status?: string;
    cap_number?: string | null;
    gate_pass_number?: string | null;
    loading_manifest_number?: string | null;
    delivery_otp?: string | null;
}

interface Customer {
    id?: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

interface Driver {
    id?: string;
    name: string;
    phone?: string | null;
    license_number?: string | null;
}

interface Truck {
    id?: string;
    plate_number: string;
    model?: string | null;
    capacity_tons?: number | null;
}

interface Payment {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
}

interface Document {
    id: string;
    document_type: string;
    expiry_date: string;
    entity_type: string;
    entity_id: string;
    document_number?: string;
}

// Helper function to add header
function addHeader(doc: jsPDF, title: string) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('IHSAN BLOCKS INDUSTRY', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Cement Distribution Company', 105, 27, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 40, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
}

// Helper function to add footer
function addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Page ${i} of ${pageCount}`,
            105,
            287,
            { align: 'center' }
        );
        doc.text(
            `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
            105,
            292,
            { align: 'center' }
        );
    }
}

/**
 * Generate Loading Manifest (for plant security)
 */
export function generateLoadingManifest(
    order: Order,
    customer: Customer,
    driver: Driver,
    truck: Truck
) {
    const doc = new jsPDF();

    addHeader(doc, 'LOADING MANIFEST');

    let yPos = 55;

    // Document Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Manifest Details', 20, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Number: ${order.order_number || 'N/A'}`, 20, yPos);
    doc.text(`Date: ${format(new Date(order.created_at), 'dd/MM/yyyy')}`, 130, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`ATC Number: ${order.atc_number || 'PENDING'}`, 20, yPos);
    doc.text(`CAP Number: ${order.cap_number || 'N/A'}`, 130, yPos);

    if (order.delivery_otp) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 185);
        doc.text(`DELIVERY OTP: ${order.delivery_otp}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
    }

    yPos += 15;

    // Customer Information
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${customer.name}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Delivery Address: ${order.delivery_address || customer.address || 'N/A'}`, 20, yPos);

    yPos += 15;

    // Transport Information
    doc.setFont('helvetica', 'bold');
    doc.text('Transport Details', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Driver Name: ${driver.name}`, 20, yPos);
    doc.text(`License: ${driver.license_number || 'N/A'}`, 130, yPos);
    yPos += 6;
    doc.text(`Driver Phone: ${driver.phone || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Truck Plate: ${truck.plate_number}`, 20, yPos);
    doc.text(`Model: ${truck.model || 'N/A'}`, 130, yPos);
    yPos += 6;
    doc.text(`Capacity: ${truck.capacity_tons || 'N/A'} Tons`, 20, yPos);

    yPos += 15;

    // Product Information Table
    autoTable(doc, {
        startY: yPos,
        head: [['Product Type', 'Quantity', 'Unit Price', 'Total Amount']],
        body: [[
            order.cement_type,
            `${order.quantity_tons || order.quantity || 0} ${order.unit === 'bags' ? 'Bags' : 'Tons'}`,
            '-',
            `₦${(order.total_amount || 0).toLocaleString()}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    yPos = (doc as jsPDFWithPlugin).lastAutoTable.finalY + 20;

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.text('Plant Security Sign:', 20, yPos);
    doc.text('Driver Sign:', 130, yPos);

    yPos += 15;
    doc.line(20, yPos, 80, yPos);
    doc.line(130, yPos, 190, yPos);

    addFooter(doc);

    doc.save(`Loading_Manifest_${order.order_number || order.id}.pdf`);
}

/**
 * Generate Waybill / Delivery Note
 */
export function generateWaybill(
    order: Order,
    customer: Customer,
    driver: Driver,
    truck: Truck
) {
    const doc = new jsPDF();

    addHeader(doc, 'WAYBILL / DELIVERY NOTE');

    let yPos = 55;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Waybill No: ${order.order_number || order.id}`, 20, yPos);
    doc.text(`Date: ${format(new Date(order.created_at), 'dd/MM/yyyy')}`, 130, yPos);

    if (order.delivery_otp) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text(`DELIVERY OTP: ${order.delivery_otp}`, 20, yPos);
    }

    yPos += 15;

    // Shipper and Consignee in two columns
    doc.setFont('helvetica', 'bold');
    doc.text('FROM (SHIPPER)', 20, yPos);
    doc.text('TO (CONSIGNEE)', 110, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Ihsan Blocks Industry', 20, yPos);
    doc.text(customer.name, 110, yPos);
    yPos += 6;
    doc.text('Cement Distribution Depot', 20, yPos);
    doc.text(customer.phone || '', 110, yPos);
    yPos += 6;
    doc.text(order.delivery_address || customer.address || '', 110, yPos);

    yPos += 15;

    // Transport Details
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSPORT DETAILS', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Driver: ${driver.name}`, 20, yPos);
    doc.text(`Truck: ${truck.plate_number}`, 110, yPos);

    yPos += 15;

    // Items Table
    autoTable(doc, {
        startY: yPos,
        head: [['Item Description', 'Quantity', 'Unit', 'Amount (₦)']],
        body: [[
            order.cement_type,
            (order.quantity_tons || order.quantity || 0).toString(),
            order.unit === 'bags' ? 'Bags' : 'Tons',
            (order.total_amount || 0).toLocaleString()
        ]],
        foot: [['', '', 'TOTAL', `₦${(order.total_amount || 0).toLocaleString()}`]],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        footStyles: { fillColor: [236, 240, 241], textColor: 0, fontStyle: 'bold' },
    });

    yPos = (doc as jsPDFWithPlugin).lastAutoTable.finalY + 20;

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.text('Delivered By:', 20, yPos);
    doc.text('Received By:', 110, yPos);

    yPos += 15;
    doc.line(20, yPos, 70, yPos);
    doc.line(110, yPos, 160, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(Driver Signature & Date)', 20, yPos);
    doc.text('(Customer Signature & Date)', 110, yPos);

    addFooter(doc);

    doc.save(`Waybill_${order.order_number || order.id}.pdf`);
}

/**
 * Generate Invoice
 */
export function generateInvoice(
    order: Order,
    customer: Customer,
    payment?: Payment
) {
    const doc = new jsPDF();

    addHeader(doc, 'COMMERCIAL INVOICE');

    let yPos = 55;

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${order.order_number || order.id}`, 20, yPos);
    doc.text(`Date: ${format(new Date(order.created_at), 'dd/MM/yyyy')}`, 130, yPos);

    yPos += 15;

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 20, yPos);
    yPos += 6;
    doc.text(customer.address || '', 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${customer.email || 'N/A'}`, 20, yPos);

    yPos += 15;

    // Invoice Items
    const subtotal = order.total_amount || 0;
    const vat = 0; // Add VAT calculation if needed
    const total = subtotal + vat;

    autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Quantity', 'Unit Price', 'Amount (₦)']],
        body: [[
            order.cement_type,
            `${order.quantity_tons || order.quantity || 0} ${order.unit === 'bags' ? 'Bags' : 'Tons'}`,
            `₦${((order.total_amount || 0) / (order.quantity_tons || order.quantity || 1)).toLocaleString()}`,
            `₦${(order.total_amount || 0).toLocaleString()}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96], textColor: 255 },
    });

    yPos = (doc as jsPDFWithPlugin).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 130, yPos);
    doc.text(`₦${subtotal.toLocaleString()}`, 170, yPos, { align: 'right' });

    yPos += 7;
    doc.text('VAT (0%):', 130, yPos);
    doc.text(`₦${vat.toLocaleString()}`, 170, yPos, { align: 'right' });

    yPos += 10;
    doc.setFontSize(12);
    doc.text('TOTAL:', 130, yPos);
    doc.text(`₦${total.toLocaleString()}`, 170, yPos, { align: 'right' });

    yPos += 15;

    // Payment Status
    doc.setFontSize(10);
    if (payment) {
        doc.setTextColor(39, 174, 96);
        doc.text('PAID', 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Payment Method: ${payment.payment_method}`, 20, yPos + 6);
        doc.text(`Reference: ${payment.reference_number || 'N/A'}`, 20, yPos + 12);
    } else {
        doc.setTextColor(231, 76, 60);
        doc.text('UNPAID', 20, yPos);
        doc.setTextColor(0, 0, 0);
    }

    addFooter(doc);

    doc.save(`Invoice_${order.order_number || order.id}.pdf`);
}

/**
 * Generate Payment Receipt
 */
export function generateReceipt(
    payment: Payment,
    customer: Customer,
    order?: Order
) {
    const doc = new jsPDF();

    addHeader(doc, 'PAYMENT RECEIPT');

    let yPos = 55;

    // Receipt Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Receipt No: ${payment.reference_number || payment.id}`, 20, yPos);
    doc.text(`Date: ${format(new Date(payment.payment_date), 'dd/MM/yyyy HH:mm')}`, 130, yPos);

    yPos += 15;

    // Received From
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED FROM:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 20, yPos);

    yPos += 15;

    // Amount Box
    doc.setFillColor(236, 240, 241);
    doc.rect(20, yPos, 170, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('AMOUNT PAID:', 25, yPos + 10);
    doc.setFontSize(16);
    doc.setTextColor(39, 174, 96);
    doc.text(`₦${payment.amount.toLocaleString()}`, 25, yPos + 22);
    doc.setTextColor(0, 0, 0);

    yPos += 40;

    // Payment Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Method: ${payment.payment_method}`, 20, yPos);
    yPos += 6;
    doc.text(`Reference: ${payment.reference_number || 'N/A'}`, 20, yPos);
    yPos += 6;
    if (order) {
        doc.text(`Order Number: ${order.order_number || 'N/A'}`, 20, yPos);
    }

    yPos += 20;

    // Footer note
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

    yPos += 15;

    // Signature
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signature:', 20, yPos);
    yPos += 10;
    doc.line(20, yPos, 80, yPos);

    addFooter(doc);

    doc.save(`Receipt_${payment.reference_number || payment.id}.pdf`);
}

/**
 * Generate Driver Expiry Sheet
 */
export function generateDriverExpirySheet(
    drivers: (Driver & { documents?: Document[] })[]
) {
    const doc = new jsPDF();

    addHeader(doc, 'DRIVER DOCUMENTS EXPIRY REPORT');

    let yPos = 55;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, yPos);

    yPos += 10;

    const tableData = drivers.flatMap(driver => {
        if (!driver.documents || driver.documents.length === 0) {
            return [[driver.name, 'No documents', '-', '-', 'N/A']];
        }
        return driver.documents.map(doc => {
            const expiryDate = new Date(doc.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const status = daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'WARNING' : 'OK';

            return [
                driver.name,
                doc.document_type.replace('_', ' ').toUpperCase(),
                doc.document_number || 'N/A',
                format(expiryDate, 'dd/MM/yyyy'),
                status
            ];
        });
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Driver Name', 'Document Type', 'Document No.', 'Expiry Date', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 4) {
                const status = data.cell.raw as string;
                if (status === 'EXPIRED') {
                    data.cell.styles.textColor = [231, 76, 60];
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'WARNING') {
                    data.cell.styles.textColor = [243, 156, 18];
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'OK') {
                    data.cell.styles.textColor = [39, 174, 96];
                }
            }
        }
    });

    addFooter(doc);

    doc.save(`Driver_Expiry_Sheet_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Generate Statement of Account
 */
export function generateStatementOfAccount(
    customer: Customer,
    orders: Order[],
    payments: Payment[],
    startDate?: Date,
    endDate?: Date
) {
    const doc = new jsPDF();

    addHeader(doc, 'STATEMENT OF ACCOUNT');

    let yPos = 55;

    // Customer Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${customer.name}`, 20, yPos);
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 130, yPos);
    yPos += 6;
    doc.text(`Email: ${customer.email || 'N/A'}`, 20, yPos);

    yPos += 10;

    // Period
    const periodText = startDate && endDate
        ? `Period: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
        : `Period: All Time`;
    doc.text(periodText, 20, yPos);

    yPos += 15;

    // Transactions Table
    const transactions = [
        ...orders.map(order => ({
            date: new Date(order.created_at),
            description: `Invoice ${order.order_number || order.id}`,
            debit: order.total_amount || 0,
            credit: 0,
            balance: 0
        })),
        ...payments.map(payment => ({
            date: new Date(payment.payment_date),
            description: `Payment - ${payment.payment_method}`,
            debit: 0,
            credit: payment.amount,
            balance: 0
        }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running balance
    let runningBalance = 0;
    const tableData = transactions.map(tx => {
        runningBalance += tx.debit - tx.credit;
        return [
            format(tx.date, 'dd/MM/yyyy'),
            tx.description,
            tx.debit > 0 ? `₦${tx.debit.toLocaleString()}` : '-',
            tx.credit > 0 ? `₦${tx.credit.toLocaleString()}` : '-',
            `₦${runningBalance.toLocaleString()}`
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Description', 'Debit', 'Credit', 'Balance']],
        body: tableData,
        foot: [[
            '',
            'TOTAL',
            `₦${transactions.reduce((sum, tx) => sum + tx.debit, 0).toLocaleString()}`,
            `₦${transactions.reduce((sum, tx) => sum + tx.credit, 0).toLocaleString()}`,
            `₦${runningBalance.toLocaleString()}`
        ]],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        footStyles: { fillColor: [236, 240, 241], textColor: 0, fontStyle: 'bold' },
    });

    yPos = (doc as jsPDFWithPlugin).lastAutoTable.finalY + 15;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const balanceColor = runningBalance > 0 ? [231, 76, 60] : [39, 174, 96];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(`Current Balance: ₦${Math.abs(runningBalance).toLocaleString()} ${runningBalance > 0 ? '(OWING)' : '(CR)'}`, 105, yPos, { align: 'center' });

    addFooter(doc);

    doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Generate Gate Pass (for depot security)
 */
export function generateGatePass(
    order: Order,
    customer: Customer,
    driver: Driver,
    truck: Truck,
    depotName: string
) {
    const doc = new jsPDF();

    addHeader(doc, 'GATE PASS');

    let yPos = 55;

    // Gate Pass Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Gate Pass No: ${order.cap_number || order.id.slice(0, 8).toUpperCase()}`, 20, yPos);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 130, yPos);

    yPos += 15;

    // Depot Info
    doc.setFont('helvetica', 'bold');
    doc.text(`Depot: ${depotName}`, 20, yPos);

    yPos += 15;

    // Transport Details
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Transport', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Driver Name: ${driver.name}`, 20, yPos);
    doc.text(`License: ${driver.license_number || 'N/A'}`, 130, yPos);
    yPos += 6;
    doc.text(`Truck Plate: ${truck.plate_number}`, 20, yPos);
    doc.text(`Model: ${truck.model || 'N/A'}`, 130, yPos);

    yPos += 15;

    // Order Details
    doc.setFont('helvetica', 'bold');
    doc.text('Order Information', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Order No: ${order.order_number || order.id}`, 20, yPos);
    yPos += 6;
    doc.text(`Customer: ${customer.name}`, 20, yPos);
    yPos += 6;
    doc.text(`Product: ${order.cement_type}`, 20, yPos);
    yPos += 6;
    doc.text(`Quantity: ${order.quantity_tons || order.quantity || 0} ${order.unit === 'bags' ? 'Bags' : 'Tons'}`, 20, yPos);

    yPos += 20;

    // Security Check
    doc.setFont('helvetica', 'bold');
    doc.text('Security Clearance', 20, yPos);
    yPos += 10;
    doc.rect(20, yPos, 50, 30);
    doc.text('Entry Check', 25, yPos + 15);

    doc.rect(120, yPos, 50, 30);
    doc.text('Exit Check', 125, yPos + 15);

    yPos += 45;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Authorized Signature', 20, yPos);
    doc.text('Driver Signature', 120, yPos);

    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 70, yPos);
    doc.line(120, yPos, 170, yPos);

    addFooter(doc);

    doc.save(`GatePass_${order.cap_number || order.id}.pdf`);
}
