// Document generation utilities for cement distribution

export interface LoadingManifestData {
  orderNumber: string;
  atcNumber: string | null;
  capNumber: string | null;
  customerName: string;
  deliveryAddress: string | null;
  cementType: string;
  quantityTons: number;
  driverName: string;
  driverPhone: string | null;
  truckPlate: string;
  truckCapacity: number | null;
  date: string;
}

export interface GatePassData {
  gatePassNumber: string;
  orderNumber: string;
  customerName: string;
  cementType: string;
  quantityTons: number;
  driverName: string;
  truckPlate: string;
  date: string;
  depotName: string;
}

export function generateLoadingManifest(data: LoadingManifestData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Loading Manifest - ${data.orderNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
    .title { font-size: 22px; margin-top: 10px; text-transform: uppercase; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .row { display: flex; margin-bottom: 8px; }
    .label { width: 180px; font-weight: 600; color: #333; }
    .value { flex: 1; }
    .highlight { background: #f3f4f6; padding: 15px; border-radius: 8px; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-box { width: 200px; text-align: center; }
    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 8px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">IHSAN CONCRETE BLOCKS INDUSTRY AND GENERAL ENTERPRISES</div>
    <div class="title">Loading Manifest</div>
  </div>

  <div class="section highlight">
    <div class="row"><div class="label">Order Number:</div><div class="value"><strong>${data.orderNumber}</strong></div></div>
    <div class="row"><div class="label">ATC Number:</div><div class="value"><strong>${data.atcNumber || 'N/A'}</strong></div></div>
    ${data.capNumber ? `<div class="row"><div class="label">CAP Number:</div><div class="value"><strong>${data.capNumber}</strong></div></div>` : ''}
    <div class="row"><div class="label">Date:</div><div class="value">${data.date}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="row"><div class="label">Customer Name:</div><div class="value">${data.customerName}</div></div>
    <div class="row"><div class="label">Delivery Address:</div><div class="value">${data.deliveryAddress || 'N/A'}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Product Details</div>
    <div class="row"><div class="label">Cement Type:</div><div class="value">${data.cementType}</div></div>
    <div class="row"><div class="label">Quantity:</div><div class="value"><strong>${data.quantityTons} Tons</strong></div></div>
  </div>

  <div class="section">
    <div class="section-title">Transport Details</div>
    <div class="row"><div class="label">Driver Name:</div><div class="value">${data.driverName}</div></div>
    <div class="row"><div class="label">Driver Phone:</div><div class="value">${data.driverPhone || 'N/A'}</div></div>
    <div class="row"><div class="label">Truck Plate Number:</div><div class="value"><strong>${data.truckPlate}</strong></div></div>
    <div class="row"><div class="label">Truck Capacity:</div><div class="value">${data.truckCapacity || 'N/A'} Tons</div></div>
  </div>

  <div class="signature">
    <div class="signature-box">
      <div class="signature-line">Dispatcher Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Driver Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Security Stamp</div>
    </div>
  </div>

  <div class="footer">
    <p>This document serves as authorization for loading at the plant.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
}

export function generateGatePass(data: GatePassData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Gate Pass - ${data.gatePassNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
    .title { font-size: 22px; margin-top: 10px; text-transform: uppercase; background: #16a34a; color: white; padding: 10px; }
    .pass-number { font-size: 24px; font-weight: bold; color: #16a34a; margin: 20px 0; text-align: center; border: 2px dashed #16a34a; padding: 15px; }
    .section { margin-bottom: 20px; }
    .row { display: flex; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px dotted #ddd; }
    .label { width: 150px; font-weight: 600; color: #333; }
    .value { flex: 1; }
    .authorization { margin-top: 40px; text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #16a34a; }
    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-box { width: 180px; text-align: center; }
    .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 8px; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">IHSAN CONCRETE BLOCKS INDUSTRY AND GENERAL ENTERPRISES</div>
    <div class="title">Gate Pass</div>
  </div>

  <div class="pass-number">
    PASS NO: ${data.gatePassNumber}
  </div>

  <div class="section">
    <div class="row"><div class="label">Date:</div><div class="value">${data.date}</div></div>
    <div class="row"><div class="label">Order Number:</div><div class="value">${data.orderNumber}</div></div>
    <div class="row"><div class="label">Depot:</div><div class="value">${data.depotName}</div></div>
  </div>

  <div class="section">
    <div class="row"><div class="label">Customer:</div><div class="value"><strong>${data.customerName}</strong></div></div>
    <div class="row"><div class="label">Product:</div><div class="value">${data.cementType}</div></div>
    <div class="row"><div class="label">Quantity:</div><div class="value"><strong>${data.quantityTons} Tons</strong></div></div>
  </div>

  <div class="section">
    <div class="row"><div class="label">Driver:</div><div class="value">${data.driverName}</div></div>
    <div class="row"><div class="label">Vehicle:</div><div class="value"><strong>${data.truckPlate}</strong></div></div>
  </div>

  <div class="authorization">
    <p><strong>AUTHORIZED TO EXIT DEPOT</strong></p>
    <p>This gate pass authorizes the above vehicle to exit the depot premises with the stated goods.</p>
  </div>

  <div class="signature">
    <div class="signature-box">
      <div class="signature-line">Security Officer</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Driver</div>
    </div>
  </div>

  <div class="footer">
    <p>Valid for date of issue only • Keep this pass for record purposes</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
}

export function printDocument(htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export function generateGatePassNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GP-${dateStr}-${random}`;
}

export function generateLoadingManifestNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LM-${dateStr}-${random}`;
}

export interface StatementData {
  customerName: string;
  customerAddress: string | null;
  customerPhone: string | null;
  creditLimit: number;
  currentBalance: number;
  transactions: {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  generatedDate: string;
}

export function generateStatementOfAccount(data: StatementData): string {
  const transactionsHtml = data.transactions.map(t => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${t.date}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${t.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${t.debit > 0 ? `₦${t.debit.toLocaleString()}` : '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${t.credit > 0 ? `₦${t.credit.toLocaleString()}` : '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₦${t.balance.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Statement of Account - ${data.customerName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
    .title { font-size: 20px; margin-top: 10px; text-transform: uppercase; }
    .customer-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { width: 150px; font-weight: 600; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary-box { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-box.limit { background: #dbeafe; color: #1e40af; }
    .summary-box.balance { background: ${data.currentBalance > 0 ? '#fef2f2' : '#dcfce7'}; color: ${data.currentBalance > 0 ? '#dc2626' : '#16a34a'}; }
    .summary-label { font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
    .summary-value { font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">IHSAN CONCRETE BLOCKS INDUSTRY AND GENERAL ENTERPRISES</div>
    <div class="title">Statement of Account</div>
  </div>

  <div class="customer-info">
    <div class="info-row"><div class="info-label">Customer:</div><div>${data.customerName}</div></div>
    <div class="info-row"><div class="info-label">Address:</div><div>${data.customerAddress || 'N/A'}</div></div>
    <div class="info-row"><div class="info-label">Phone:</div><div>${data.customerPhone || 'N/A'}</div></div>
    <div class="info-row"><div class="info-label">Statement Date:</div><div>${data.generatedDate}</div></div>
  </div>

  <div class="summary">
    <div class="summary-box limit">
      <div class="summary-label">Credit Limit</div>
      <div class="summary-value">₦${data.creditLimit.toLocaleString()}</div>
    </div>
    <div class="summary-box balance">
      <div class="summary-label">Current Balance</div>
      <div class="summary-value">₦${data.currentBalance.toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Debit</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${transactionsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No transactions found</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p>This is a computer-generated statement. For queries, please contact our accounts department.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
}
