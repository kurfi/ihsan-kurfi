# HAULAGE & CEMENT TRADING MANAGEMENT SYSTEM
## System Design & Blueprint Document

**Version:** 1.0  
**Date:** February 8, 2026  
**Document Type:** Technical System Design

---

## EXECUTIVE SUMMARY

This document provides a comprehensive blueprint for a dual-purpose business management system designed for companies operating both haulage logistics and cement trading operations through a dropshipping model. The system tracks two distinct revenue streams (haulage fees and cement margins) while managing associated costs, cash flow, and profitability metrics.

### Key Features:
- ✓ Simplified bulk payment tracking without complex trip-to-payment allocation
- ✓ Integrated cement trading with purchase and sales tracking
- ✓ Comprehensive cost allocation across trip and operational expenses
- ✓ Real-time profitability analysis for both business streams
- ✓ Cash flow management with receivables and payables tracking

---

## TABLE OF CONTENTS

1. [Business Model Overview](#1-business-model-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Core Business Processes](#4-core-business-processes)
5. [User Interface Design](#5-user-interface-design)
6. [Reporting & Analytics](#6-reporting--analytics)
7. [Financial Calculations](#7-financial-calculations)
8. [Implementation Plan](#8-implementation-plan)
9. [Appendices](#9-appendices)

---

## 1. BUSINESS MODEL OVERVIEW

### 1.1 Core Business Streams

The business operates two interconnected revenue streams:

#### Stream 1: Haulage Logistics

| Aspect | Description |
|--------|-------------|
| **Revenue Source** | Haulage fees from Dangote Cement for transporting cement from depots/plants to customers |
| **Payment Model** | Bulk payments received periodically (every ~10 days) without trip-by-trip breakdown |
| **Cost Structure** | Fuel, driver allowances, vehicle maintenance, salaries, insurance, licenses |
| **Typical Margin** | 40-50% (higher margin, lower volume) |

#### Stream 2: Cement Trading (Dropshipping)

| Aspect | Description |
|--------|-------------|
| **Revenue Source** | Sales to final consumers at 1-2% markup above Dangote purchase price |
| **Operating Model** | Dropshipping - no inventory held; cement goes directly from Dangote to customer |
| **Payment Terms** | Flexible - prepayment, post-payment, or credit terms with customers |
| **Typical Margin** | 1-2% (lower margin, higher volume) |

### 1.2 Key Business Principles

1. **Simple Tracking** - The system avoids complex allocation algorithms by tracking money in (haulage payments + cement sales) versus money out (all costs)

2. **Dual Revenue Recognition** - Haulage fees and cement margins are tracked separately to understand profitability by business stream

3. **Cash Flow Focus** - Given bulk payments and credit terms, cash flow management is critical

4. **Real-time Visibility** - Daily cost tracking enables immediate understanding of profitability

### 1.3 Business Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DANGOTE CEMENT                           │
│  (Manufacturer/Supplier)                                    │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
        Cement  │              Haulage │ Fees
        Supply  │              (Bulk   │ Payment
                │              Every   │ ~10 days)
                ↓              10 days)↓
┌───────────────────────────────────────────────────────────┐
│              YOUR BUSINESS (Distributor)                  │
│                                                           │
│  ┌─────────────────┐         ┌──────────────────┐       │
│  │ CEMENT TRADING  │         │ HAULAGE BUSINESS │       │
│  │ (1-2% margin)   │         │ (40-50% margin)  │       │
│  └─────────────────┘         └──────────────────┘       │
└────────────────┬───────────────────────────────────────────┘
                 │
         Cement  │ Delivery
         + Sale  │ (Dropship)
                 ↓
┌─────────────────────────────────────────────────────────┐
│                    FINAL CUSTOMERS                       │
│  (Construction companies, retailers, individuals)        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Technology Stack Recommendation

| Component | Recommended Technology | Rationale |
|-----------|----------------------|-----------|
| **Backend** | Python (Django/Flask) or Node.js (Express) | Robust frameworks with good ORM support |
| **Database** | PostgreSQL | Handles complex financial calculations and transactions well |
| **Frontend** | React.js or Vue.js | Responsive, component-based architecture |
| **Mobile** | React Native | Cross-platform driver app for trip logging |
| **Reporting** | Power BI, Tableau, or Chart.js | Professional visualization and analytics |
| **Hosting** | AWS, Google Cloud, or Azure | Scalability and reliability |

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                         │
│                                                         │
│  ┌──────────────────┐      ┌────────────────────┐     │
│  │  Web Dashboard   │      │ Mobile Driver App  │     │
│  │  (React/Vue.js)  │      │  (React Native)    │     │
│  └──────────────────┘      └────────────────────┘     │
└────────────────┬────────────────────┬───────────────────┘
                 │                    │
                 ↓                    ↓
┌─────────────────────────────────────────────────────────┐
│            APPLICATION LAYER                            │
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │          REST API (Express/Django)         │        │
│  │  • Authentication & Authorization          │        │
│  │  • Business Logic Processing               │        │
│  │  • Data Validation                         │        │
│  │  • Financial Calculations                  │        │
│  └────────────────────────────────────────────┘        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│               DATA LAYER                                │
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │       PostgreSQL Database                  │        │
│  │                                            │        │
│  │  ┌──────────────┐  ┌──────────────────┐  │        │
│  │  │    Trips     │  │    Payments      │  │        │
│  │  └──────────────┘  └──────────────────┘  │        │
│  │  ┌──────────────┐  ┌──────────────────┐  │        │
│  │  │   Expenses   │  │   Maintenance    │  │        │
│  │  └──────────────┘  └──────────────────┘  │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### 2.3 System Components

#### 2.3.1 User Roles & Permissions

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **Administrator** | Full system access, user management, financial reports | Complete |
| **Manager** | View all reports, manage trips, expenses, payments | High |
| **Data Entry Clerk** | Enter trips, expenses, record payments | Medium |
| **Driver** | Log trip details via mobile app, view own trips | Limited |
| **Accountant** | View financial reports, manage payments, reconciliation | High |

#### 2.3.2 Core Modules

1. **Trip Management Module**
   - Trip logging and tracking
   - Cost recording
   - Cement transaction details
   - Status tracking

2. **Payment Management Module**
   - Haulage payment recording
   - Customer payment tracking
   - Dangote cement payment recording
   - Payment reconciliation

3. **Expense Management Module**
   - Operating expense recording
   - Categorization and tracking
   - Approval workflows

4. **Reporting & Analytics Module**
   - Financial reports (P&L, Cash Flow)
   - Operational reports (Trip analysis, Fleet utilization)
   - Dashboard visualizations

5. **Fleet Management Module** (Optional)
   - Vehicle tracking
   - Maintenance scheduling
   - Driver management

---

## 3. DATABASE DESIGN

### 3.1 Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   trucks    │────┐    │   drivers    │
└─────────────┘    │    └──────────────┘
                   │            │
                   │            │
                   ↓            ↓
              ┌─────────────────────┐
              │       trips         │
              │  (Central Entity)   │
              └─────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   haulage_   │ │  customer_   │ │cement_pay_   │
│   payments   │ │  payments    │ │to_dangote    │
└──────────────┘ └──────────────┘ └──────────────┘
        
        ↓
┌──────────────┐
│   other_     │
│   expenses   │
└──────────────┘
```

### 3.2 Core Tables

#### Table 1: trips

**Purpose:** Primary table tracking each delivery trip with both haulage costs and cement trading details.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `trip_id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique trip identifier |
| `trip_date` | DATE | NOT NULL | Date of delivery |
| `truck_id` | INTEGER | FOREIGN KEY | Reference to trucks table |
| `driver_id` | INTEGER | FOREIGN KEY | Reference to drivers table |
| `waybill_number` | VARCHAR(50) | UNIQUE | Dangote delivery reference |
| `customer_name` | VARCHAR(200) | NOT NULL | Final customer name |
| `destination` | VARCHAR(300) | | Delivery location |
| `distance_km` | DECIMAL(10,2) | | Trip distance in kilometers |
| **HAULAGE COSTS** | | | |
| `fuel_cost` | DECIMAL(15,2) | DEFAULT 0 | Actual fuel cost for trip |
| `driver_allowance` | DECIMAL(15,2) | DEFAULT 0 | Per-trip driver allowance |
| `other_trip_costs` | DECIMAL(15,2) | DEFAULT 0 | Tolls, loading fees, etc. |
| `total_trip_cost` | DECIMAL(15,2) | GENERATED | Sum of all trip costs |
| **CEMENT TRADING** | | | |
| `cement_quantity_tons` | DECIMAL(10,2) | | Tons of cement delivered |
| `cement_purchase_price` | DECIMAL(15,2) | | Price per ton from Dangote |
| `total_cement_purchase` | DECIMAL(15,2) | GENERATED | Quantity × Purchase price |
| `cement_sale_price` | DECIMAL(15,2) | | Price per ton to customer |
| `total_cement_sale` | DECIMAL(15,2) | GENERATED | Quantity × Sale price |
| `cement_profit` | DECIMAL(15,2) | GENERATED | Sale - Purchase |
| `payment_terms` | VARCHAR(50) | | COD, 7 days, 30 days, etc. |
| `payment_status` | VARCHAR(20) | | Paid, pending, partial |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Calculated Fields:**
```sql
total_trip_cost = fuel_cost + driver_allowance + other_trip_costs
total_cement_purchase = cement_quantity_tons * cement_purchase_price
total_cement_sale = cement_quantity_tons * cement_sale_price
cement_profit = total_cement_sale - total_cement_purchase
```

#### Table 2: haulage_payments

**Purpose:** Tracks bulk haulage payments received from Dangote.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `payment_id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique payment identifier |
| `payment_date` | DATE | NOT NULL | Date payment received |
| `amount_received` | DECIMAL(15,2) | NOT NULL | Total amount in bulk payment |
| `payment_reference` | VARCHAR(100) | | Bank reference or invoice number |
| `period_covered` | VARCHAR(50) | | e.g., "Jan 1-10, 2026" |
| `notes` | TEXT | | Additional details |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

#### Table 3: cement_payments_to_dangote

**Purpose:** Tracks payments made to Dangote for cement purchases.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `payment_id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique payment identifier |
| `payment_date` | DATE | NOT NULL | Date payment made |
| `amount_paid` | DECIMAL(15,2) | NOT NULL | Total amount paid |
| `payment_reference` | VARCHAR(100) | | Payment reference number |
| `period_covered` | VARCHAR(50) | | Period this payment covers |
| `payment_method` | VARCHAR(50) | | Bank transfer, cash, etc. |
| `notes` | TEXT | | Additional details |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

#### Table 4: customer_payments

**Purpose:** Tracks payments received from customers for cement sales.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `payment_id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique payment identifier |
| `customer_name` | VARCHAR(200) | NOT NULL | Customer making payment |
| `payment_date` | DATE | NOT NULL | Date payment received |
| `amount_received` | DECIMAL(15,2) | NOT NULL | Amount paid |
| `trip_ids` | VARCHAR(500) | | Comma-separated trip IDs covered |
| `payment_method` | VARCHAR(50) | | Bank transfer, cash, etc. |
| `notes` | TEXT | | Additional details |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

#### Table 5: other_expenses

**Purpose:** Tracks all non-trip operating expenses.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `expense_id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique expense identifier |
| `date` | DATE | NOT NULL | Date expense incurred |
| `category` | VARCHAR(100) | NOT NULL | Salary, maintenance, insurance, etc. |
| `truck_id` | INTEGER | FOREIGN KEY (nullable) | If expense is truck-specific |
| `amount` | DECIMAL(15,2) | NOT NULL | Amount of expense |
| `description` | TEXT | | Description of expense |
| `payment_method` | VARCHAR(50) | | Cash, bank transfer, etc. |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Common Expense Categories:**
- Salary
- Maintenance
- Insurance
- License/Permits
- Office/Administration
- Utilities
- Equipment
- Miscellaneous

### 3.3 Supporting Tables

#### Table 6: trucks

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `truck_id` | INTEGER PRIMARY KEY | Unique truck identifier |
| `registration_number` | VARCHAR(50) UNIQUE | License plate number |
| `truck_type` | VARCHAR(100) | Model/capacity |
| `capacity_tons` | DECIMAL(10,2) | Load capacity |
| `acquisition_date` | DATE | Purchase date |
| `status` | VARCHAR(20) | Active, maintenance, retired |

#### Table 7: drivers

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| `driver_id` | INTEGER PRIMARY KEY | Unique driver identifier |
| `name` | VARCHAR(200) | Driver full name |
| `license_number` | VARCHAR(50) | Driver's license number |
| `phone` | VARCHAR(20) | Contact number |
| `monthly_salary` | DECIMAL(15,2) | Base monthly salary |
| `allowance_per_trip` | DECIMAL(15,2) | Standard trip allowance |
| `employment_date` | DATE | Date hired |
| `status` | VARCHAR(20) | Active, on leave, terminated |

### 3.4 Database Indexes

For optimal performance, create indexes on:

```sql
-- Trips table
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_truck ON trips(truck_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_customer ON trips(customer_name);
CREATE INDEX idx_trips_payment_status ON trips(payment_status);

-- Payments
CREATE INDEX idx_haulage_payments_date ON haulage_payments(payment_date);
CREATE INDEX idx_customer_payments_date ON customer_payments(payment_date);
CREATE INDEX idx_customer_payments_name ON customer_payments(customer_name);

-- Expenses
CREATE INDEX idx_expenses_date ON other_expenses(date);
CREATE INDEX idx_expenses_category ON other_expenses(category);
```

---

## 4. CORE BUSINESS PROCESSES

### 4.1 Daily Operations Workflow

#### Process 1: Recording a Trip

**Trigger:** Driver completes a delivery

**Steps:**
1. Driver/clerk logs into system
2. Navigate to "New Trip" form
3. Enter trip details:
   - Date, truck, driver
   - Waybill number
   - Customer name and destination
   - Distance traveled
4. Enter haulage costs:
   - Fuel amount spent
   - Driver allowance
   - Other costs (tolls, etc.)
5. Enter cement details:
   - Quantity in tons
   - Purchase price from Dangote
   - Sale price to customer
   - Payment terms
6. System auto-calculates:
   - Total trip cost
   - Total cement purchase
   - Total cement sale
   - Cement profit margin
7. Save trip record

**Data Validation:**
- Waybill number must be unique
- All required fields completed
- Cement sale price > purchase price
- Reasonable fuel cost for distance

**System Actions:**
- Create trip record
- Update fleet utilization
- Flag for payment tracking

#### Process 2: Recording Haulage Payment from Dangote

**Trigger:** Bulk payment received (every ~10 days)

**Steps:**
1. Navigate to "Haulage Payments"
2. Click "Record New Payment"
3. Enter:
   - Date received
   - Amount
   - Payment reference
   - Optional: period covered
4. Save payment record

**System Actions:**
- Record payment
- Update cash flow
- Update revenue totals

**No trip-to-payment allocation required** - System uses simple approach of tracking total in vs total out.

#### Process 3: Recording Payment to Dangote for Cement

**Trigger:** Payment made to Dangote for cement purchases

**Steps:**
1. Navigate to "Cement Payments to Dangote"
2. Click "Record Payment"
3. Enter:
   - Date paid
   - Amount
   - Payment reference
   - Period covered
   - Payment method
4. Save record

**System Actions:**
- Record payment out
- Update payables
- Update cash flow

#### Process 4: Recording Customer Payment

**Trigger:** Customer pays for cement received

**Steps:**
1. Navigate to "Customer Payments"
2. Click "Record Payment"
3. Enter:
   - Customer name
   - Date received
   - Amount
   - Select which trips this payment covers
   - Payment method
4. Save record

**System Actions:**
- Update trip payment status
- Reduce receivables
- Update cash flow

#### Process 5: Recording Other Expenses

**Trigger:** Operating expense incurred

**Steps:**
1. Navigate to "Record Expense"
2. Enter:
   - Date
   - Category (dropdown)
   - Amount
   - Description
   - Optional: specific truck if applicable
   - Payment method
3. Save expense

**System Actions:**
- Record expense
- Update expense totals by category
- Update cash flow

### 4.2 Periodic Processes

#### Monthly Closing Process

**Frequency:** End of each month

**Steps:**
1. **Reconciliation:**
   - Verify all trips for month recorded
   - Confirm all payments entered
   - Review and categorize all expenses

2. **Validation:**
   - Check for pending customer payments
   - Review outstanding payables to Dangote
   - Identify any discrepancies

3. **Report Generation:**
   - Generate monthly P&L statement
   - Create cash flow statement
   - Analyze profitability by business stream
   - Export data for accounting system

4. **Review:**
   - Management reviews reports
   - Identify trends and issues
   - Plan for next month

### 4.3 Business Rules

#### Cost Allocation Rules

Since we use a simplified approach without complex allocation:

1. **Trip Costs** - Directly attributed to each trip at time of entry
2. **Fixed Monthly Costs** - Tracked separately, not allocated to individual trips
3. **Profitability Calculation** - Simple: Total Revenue - Total Costs

#### Payment Status Rules

**For Customer Payments:**
- `Paid` - Full payment received
- `Pending` - Payment not yet received
- `Partial` - Some payment received, balance outstanding
- Auto-update when payment recorded

#### Cement Pricing Rules

- Sale price must be ≥ purchase price
- Typical margin: 1-2%
- System should flag if margin < 0.5% or > 5% (unusual)

#### Data Entry Rules

- All trips must have waybill numbers
- Costs must be entered same day or next business day
- Bulk payments recorded within 24 hours of receipt
- Customer payments recorded when received

---

## 5. USER INTERFACE DESIGN

### 5.1 Web Dashboard Layout

#### Main Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Logo    HAULAGE & CEMENT MANAGEMENT         User: Admin ▼  │
├─────────────────────────────────────────────────────────────┤
│ Dashboard | Trips | Payments | Expenses | Reports | Settings│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════ BUSINESS OVERVIEW ═══════════════╗       │
│  ║  THIS MONTH (February 2026)                     ║       │
│  ║                                                  ║       │
│  ║  💰 Haulage Received:      ₦15,000,000          ║       │
│  ║  💰 Cement Sales:          ₦150,000,000         ║       │
│  ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ║       │
│  ║  📊 Total Revenue:         ₦165,000,000         ║       │
│  ║                                                  ║       │
│  ║  💸 Cement Purchases:      ₦147,000,000         ║       │
│  ║  💸 Operating Costs:       ₦8,100,000           ║       │
│  ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ║       │
│  ║  💸 Total Costs:           ₦155,100,000         ║       │
│  ║                                                  ║       │
│  ║  ✅ NET PROFIT:            ₦9,900,000           ║       │
│  ║  📈 Margin:                6.0%                 ║       │
│  ╚══════════════════════════════════════════════════╝       │
│                                                             │
│  ┌──────── QUICK STATS ────────┬──── ALERTS ──────┐       │
│  │ Today's trips:       12     │ ⚠️ Payment due   │       │
│  │ This week:           85     │ in 2 days        │       │
│  │ Active trucks:       10     │ ₦50M to Dangote  │       │
│  │ Avg fuel/trip:  ₦18,000     │                  │       │
│  └─────────────────────────────┴──────────────────┘       │
│                                                             │
│  ┌───── RECENT ACTIVITY ──────────────────────────┐       │
│  │ Feb 8: Trip #345 - ABC Industries - ₦10.8M    │       │
│  │ Feb 8: Expense - Maintenance - ₦85,000        │       │
│  │ Feb 7: Payment received - XYZ Ltd - ₦5.4M     │       │
│  │ Feb 7: Trip #344 - DEF Corp - ₦8.2M           │       │
│  └────────────────────────────────────────────────┘       │
│                                                             │
│  [View Full Reports →]        [Enter New Trip →]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Trip Entry Screen

```
┌─────────────── NEW TRIP ENTRY ─────────────────┐
│                                                │
│  Trip Date:  [________] 📅                     │
│  Truck:      [Select Truck ▼]                  │
│  Driver:     [Select Driver ▼]                 │
│  Waybill #:  [________________]                │
│                                                │
│  Customer:   [________________]                │
│  Destination:[________________]                │
│  Distance:   [____] km                         │
│                                                │
│  ═══ HAULAGE COSTS ═══                         │
│  Fuel:       ₦ [________]                      │
│  Allowance:  ₦ [________]                      │
│  Other:      ₦ [________]                      │
│  ────────────────────────                      │
│  Total Cost: ₦ 21,500 (auto)                   │
│                                                │
│  ═══ CEMENT DETAILS ═══                        │
│  Quantity:   [____] tons                       │
│  Purchase:   ₦ [________] /ton                 │
│  Total Purch:₦ 10,620,000 (auto)               │
│                                                │
│  Sale Price: ₦ [________] /ton                 │
│  Total Sale: ₦ 10,800,000 (auto)               │
│  Margin:     ₦ 180,000 (1.7%) ✓                │
│                                                │
│  Payment:    [Credit 30 days ▼]                │
│                                                │
│  [Cancel]              [Save Trip]             │
│                                                │
└────────────────────────────────────────────────┘
```

#### Haulage Payment Entry Screen

```
┌─────── RECORD HAULAGE PAYMENT ────────┐
│                                       │
│  Date Received: [________] 📅         │
│  Amount:        ₦ [__________]        │
│  Reference:     [__________]          │
│  Period:        [Jan 21-31] (opt)     │
│  Notes:         [__________]          │
│                 [__________]          │
│                                       │
│  [Cancel]        [Save Payment]       │
│                                       │
└───────────────────────────────────────┘
```

### 5.2 Mobile App Interface (Driver)

#### Mobile Trip Logging Screen

```
┌─────────────────────┐
│ ≡  Trip Log    🔔   │
├─────────────────────┤
│                     │
│ Waybill #           │
│ ┌─────────────────┐ │
│ │ [Scan QR]  📷   │ │
│ └─────────────────┘ │
│ Or enter manually:  │
│ [_______________]   │
│                     │
│ Destination         │
│ [_______________]   │
│                     │
│ Distance (km)       │
│ [_______________]   │
│                     │
│ ═══ COSTS ═══       │
│ Fuel:     ₦ [____]  │
│ Allowance:₦ [____]  │
│ Tolls:    ₦ [____]  │
│                     │
│ Total: ₦21,500      │
│                     │
│ ┌─────────────────┐ │
│ │   SUBMIT TRIP   │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

### 5.3 Key UI Components

#### Data Tables
- Sortable columns
- Search/filter functionality
- Export to Excel/CSV
- Pagination for large datasets

#### Charts & Visualizations
- Revenue trends (line chart)
- Cost breakdown (pie chart)
- Monthly comparison (bar chart)
- Cash flow visualization

#### Forms
- Clear labels and validation
- Auto-calculation fields
- Dropdown for standardized entries
- Date pickers
- Currency formatting

---

## 6. REPORTING & ANALYTICS

### 6.1 Financial Reports

#### Report 1: Monthly Profit & Loss Statement

```
HAULAGE & CEMENT TRADING BUSINESS
PROFIT & LOSS STATEMENT
Period: February 1-28, 2026
═══════════════════════════════════════════════

REVENUE
  Haulage Payments                   ₦15,000,000
  Cement Sales                      ₦150,000,000
                                    ─────────────
  Total Revenue                     ₦165,000,000

COST OF GOODS SOLD
  Cement Purchases                  ₦147,000,000
                                    ─────────────
  Gross Profit (Cement)               ₦3,000,000
  Cement Gross Margin                        2.0%

OPERATING EXPENSES

Direct Trip Costs:
  Fuel                                ₦5,400,000
  Driver Allowances                     ₦900,000
  Tolls & Loading Fees                  ₦150,000
                                    ─────────────
  Total Direct Costs                  ₦6,450,000

Fixed Operating Costs:
  Driver Salaries                       ₦500,000
  Vehicle Maintenance                   ₦800,000
  Insurance                             ₦200,000
  Licenses & Permits                    ₦100,000
  Office/Administration                  ₦50,000
                                    ─────────────
  Total Fixed Costs                   ₦1,650,000
                                    ─────────────
Total Operating Expenses              ₦8,100,000

HAULAGE BUSINESS ANALYSIS
  Haulage Revenue                    ₦15,000,000
  Haulage Operating Costs             ₦8,100,000
                                    ─────────────
  Haulage Profit                      ₦6,900,000
  Haulage Margin                            46.0%

═══════════════════════════════════════════════
NET PROFIT                            ₦9,900,000
Overall Profit Margin                        6.0%

PROFIT BREAKDOWN:
• Cement Trading:     ₦3,000,000 (30.3%)
• Haulage Business:   ₦6,900,000 (69.7%)

KEY METRICS:
• Trips Completed:              300
• Tons Delivered:             9,000
• Avg Revenue per Trip:  ₦550,000
• Avg Cost per Trip:      ₦27,000
• Avg Profit per Trip:    ₦33,000
```

#### Report 2: Cash Flow Statement

```
CASH FLOW STATEMENT
Period: February 2026
═══════════════════════════════════════

OPENING BALANCE (Feb 1):          ₦8,900,000

CASH INFLOWS:
  Haulage Payments:
    Feb 5  - Payment #1          ₦5,000,000
    Feb 15 - Payment #2          ₦5,000,000
    Feb 25 - Payment #3          ₦5,000,000
                                ────────────
    Subtotal Haulage            ₦15,000,000

  Customer Payments:
    Various customers            ₦45,000,000
                                ────────────
  Total Cash In                 ₦60,000,000

CASH OUTFLOWS:
  Cement Payments to Dangote:
    Feb 10 - Invoice #123       ₦48,000,000
    Feb 20 - Invoice #124       ₦50,000,000
                                ────────────
    Subtotal Cement             ₦98,000,000

  Operating Expenses:
    Fuel                         ₦5,400,000
    Salaries & Allowances        ₦1,400,000
    Maintenance                    ₦800,000
    Other                          ₦500,000
                                ────────────
    Subtotal Operations          ₦8,100,000
                                ────────────
  Total Cash Out               ₦106,100,000

NET CASH FLOW:                  -₦46,100,000

CLOSING BALANCE (Feb 28):        -₦37,200,000

⚠️ NEGATIVE CASH POSITION ALERT
═══════════════════════════════════════

ACCOUNTS RECEIVABLE:             ₦105,000,000
ACCOUNTS PAYABLE:                 ₦49,000,000
NET WORKING CAPITAL:              ₦56,000,000

NOTES:
- High receivables indicate need for better
  collection efforts
- Consider negotiating extended payment
  terms with Dangote
- Monitor credit exposure per customer
```

#### Report 3: Accounts Receivable Aging

```
ACCOUNTS RECEIVABLE AGING REPORT
As of: February 28, 2026
═══════════════════════════════════════════════

Customer        Amount      Due Date    Days  Status
─────────────────────────────────────────────────────
ABC Industries  ₦10,800,000  Mar 30      30   Current
XYZ Ltd         ₦15,400,000  Mar 15      15   Current
DEF Corp        ₦8,200,000   Mar 20      20   Current
GHI Trading     ₦12,600,000  Mar 25      25   Current
JKL Builders    ₦18,000,000  Feb 28       0   Current
MNO Construct   ₦8,500,000   Feb 15     -13  OVERDUE
PQR Industries  ₦12,300,000  Feb 10     -18  OVERDUE
STU Developers  ₦6,700,000   Jan 31     -28  OVERDUE
Others          ₦12,500,000  Various     -    Mixed
─────────────────────────────────────────────────────
TOTAL          ₦105,000,000

AGING SUMMARY:
Current (0-30 days):      ₦65,000,000  (61.9%)
1-30 days overdue:        ₦20,800,000  (19.8%)
31-60 days overdue:       ₦12,500,000  (11.9%)
60+ days overdue:          ₦6,700,000   (6.4%)

⚠️ COLLECTION PRIORITY:
1. STU Developers - 28 days overdue
2. PQR Industries - 18 days overdue
3. MNO Construct - 13 days overdue

RECOMMENDATIONS:
- Follow up immediately on 60+ day overdue
- Send reminders for 30+ day overdue
- Consider stopping new deliveries to
  customers with overdue balances >30 days
```

### 6.2 Operational Reports

#### Report 4: Trip Analysis Report

```
TRIP ANALYSIS REPORT
Period: February 2026
═══════════════════════════════════════

TRIP SUMMARY:
Total Trips:                     300
Total Distance:               25,500 km
Total Tons Delivered:          9,000 tons
Avg Distance per Trip:           85 km
Avg Tons per Trip:               30 tons

FLEET UTILIZATION:
Total Trucks:                     10
Trips per Truck (avg):            30
Best Performer:  Truck #5 (42 trips)
Lowest Usage:    Truck #8 (18 trips)

COST ANALYSIS:
Avg Fuel per Trip:         ₦18,000
Avg Allowance per Trip:     ₦3,000
Avg Other Costs per Trip:     ₦500
Avg Total Cost per Trip:   ₦21,500

Fuel Efficiency:          4.7 km/liter
Cost per Kilometer:            ₦212

ROUTE ANALYSIS:
Top 5 Routes by Volume:
1. Ibese to Lagos         85 trips
2. Ibese to Abeokuta      52 trips
3. Obajana to Abuja       38 trips
4. Ibese to Ikorodu       35 trips
5. Obajana to Lokoja      28 trips

Most Profitable Routes:
1. Ibese to Lagos    - ₦30,000 profit/trip
2. Obajana to Abuja  - ₦28,500 profit/trip
3. Ibese to Abeokuta - ₦25,000 profit/trip

CEMENT MARGIN ANALYSIS:
Average Margin:               1.95%
Best Margin:                  2.5%
Lowest Margin:                1.2%

Margins by Customer Type:
• Large Volume:               1.7%
• Medium Volume:              2.0%
• Small Orders:               2.3%
```

#### Report 5: Cost Breakdown Report

```
COST BREAKDOWN ANALYSIS
Period: February 2026
═══════════════════════════════════════

TOTAL COSTS:              ₦155,100,000

BY BUSINESS STREAM:
Cement COGS:              ₦147,000,000  (94.8%)
Haulage Operations:         ₦8,100,000   (5.2%)

HAULAGE COST BREAKDOWN:

Direct Trip Costs:          ₦6,450,000  (79.6%)
├─ Fuel:                   ₦5,400,000  (66.7%)
├─ Allowances:               ₦900,000  (11.1%)
└─ Other Trip Costs:         ₦150,000   (1.9%)

Fixed Costs:                ₦1,650,000  (20.4%)
├─ Salaries:                 ₦500,000   (6.2%)
├─ Maintenance:              ₦800,000   (9.9%)
├─ Insurance:                ₦200,000   (2.5%)
├─ Licenses:                 ₦100,000   (1.2%)
└─ Admin:                     ₦50,000   (0.6%)

COST PER TRIP ANALYSIS:
Fuel:                        ₦18,000
Allowance:                    ₦3,000
Other Direct:                   ₦500
Allocated Fixed:              ₦5,500
─────────────────────────────────────
Total Cost per Trip:         ₦27,000

COST TRENDS (vs Previous Month):
Fuel:                      ↑ 5.2%
Maintenance:               ↓ 2.1%
Salaries:                  → 0%
Overall:                   ↑ 3.8%

EFFICIENCY METRICS:
Cost per Kilometer:         ₦212
Cost per Ton Delivered:     ₦900
Fuel Cost % of Revenue:     3.3%
```

### 6.3 Dashboard Visualizations

#### Chart 1: Monthly Revenue Trend (Line Chart)
- X-axis: Months
- Y-axis: Revenue (₦)
- Two lines: Haulage Revenue, Cement Sales

#### Chart 2: Cost Breakdown (Pie Chart)
- Segments:
  - Cement Purchases (94.8%)
  - Fuel (3.5%)
  - Maintenance (0.5%)
  - Salaries (0.3%)
  - Other (0.9%)

#### Chart 3: Profitability Comparison (Bar Chart)
- Haulage Profit Margin: 46%
- Cement Profit Margin: 2%
- Overall Profit Margin: 6%

#### Chart 4: Cash Flow Visualization
- Cumulative cash in vs cash out
- Daily balance tracking

---

## 7. FINANCIAL CALCULATIONS

### 7.1 Core Calculation Formulas

#### Trip-Level Calculations

```
Total Trip Cost = Fuel Cost + Driver Allowance + Other Trip Costs

Total Cement Purchase = Quantity (tons) × Purchase Price per Ton

Total Cement Sale = Quantity (tons) × Sale Price per Ton

Cement Profit = Total Cement Sale - Total Cement Purchase

Cement Margin % = (Cement Profit / Total Cement Sale) × 100
```

#### Period-Level Calculations

```
Total Revenue = Sum(Haulage Payments) + Sum(Cement Sales)

Total Cement COGS = Sum(Cement Purchases to Dangote)

Total Operating Costs = Sum(All Trip Costs) + Sum(Other Expenses)

Gross Profit (Cement) = Sum(Cement Sales) - Sum(Cement Purchases)

Haulage Profit = Sum(Haulage Payments) - Total Operating Costs

Net Profit = Total Revenue - Cement COGS - Operating Costs

Overall Margin % = (Net Profit / Total Revenue) × 100
```

#### Cash Flow Calculations

```
Cash Inflow = Haulage Payments + Customer Payments

Cash Outflow = Cement Payments to Dangote + Operating Expenses

Net Cash Flow = Cash Inflow - Cash Outflow

Closing Balance = Opening Balance + Net Cash Flow

Days Cash on Hand = (Cash Balance / Avg Daily Expenses)
```

#### Efficiency Metrics

```
Cost per Trip = Total Costs / Number of Trips

Revenue per Trip = Total Revenue / Number of Trips

Profit per Trip = Net Profit / Number of Trips

Cost per Kilometer = Total Fuel Cost / Total Distance

Cost per Ton = Total Costs / Total Tons Delivered

Fuel Efficiency = Total Distance / Total Liters Used
```

### 7.2 Sample Calculation Example

**Scenario:** One month of operations

**Given Data:**
- Trips completed: 300
- Haulage payments received: ₦15,000,000
- Cement sales: ₦150,000,000
- Cement purchases: ₦147,000,000
- Fuel costs: ₦5,400,000
- Driver allowances: ₦900,000
- Other trip costs: ₦150,000
- Salaries: ₦500,000
- Maintenance: ₦800,000
- Insurance: ₦200,000
- Other fixed: ₦150,000

**Calculations:**

```
Step 1: Calculate Total Revenue
Total Revenue = ₦15,000,000 + ₦150,000,000
              = ₦165,000,000

Step 2: Calculate Total Costs
Direct Trip Costs = ₦5,400,000 + ₦900,000 + ₦150,000
                  = ₦6,450,000

Fixed Costs = ₦500,000 + ₦800,000 + ₦200,000 + ₦150,000
            = ₦1,650,000

Total Operating Costs = ₦6,450,000 + ₦1,650,000
                      = ₦8,100,000

Total Costs = ₦147,000,000 + ₦8,100,000
            = ₦155,100,000

Step 3: Calculate Profitability
Cement Gross Profit = ₦150,000,000 - ₦147,000,000
                    = ₦3,000,000

Cement Margin = (₦3,000,000 / ₦150,000,000) × 100
              = 2.0%

Haulage Profit = ₦15,000,000 - ₦8,100,000
               = ₦6,900,000

Haulage Margin = (₦6,900,000 / ₦15,000,000) × 100
               = 46.0%

Net Profit = ₦165,000,000 - ₦155,100,000
           = ₦9,900,000

Overall Margin = (₦9,900,000 / ₦165,000,000) × 100
               = 6.0%

Step 4: Calculate Per-Trip Metrics
Revenue per Trip = ₦165,000,000 / 300
                 = ₦550,000

Cost per Trip = ₦155,100,000 / 300
              = ₦517,000
              (Includes cement purchase)

Operating Cost per Trip = ₦8,100,000 / 300
                        = ₦27,000

Profit per Trip = ₦9,900,000 / 300
                = ₦33,000
```

### 7.3 Key Performance Indicators (KPIs)

#### Financial KPIs

| KPI | Formula | Target | Description |
|-----|---------|--------|-------------|
| **Overall Profit Margin** | (Net Profit / Total Revenue) × 100 | >5% | Overall business profitability |
| **Cement Margin** | (Cement Profit / Cement Sales) × 100 | 1.5-2% | Margin on cement trading |
| **Haulage Margin** | (Haulage Profit / Haulage Revenue) × 100 | >40% | Margin on haulage operations |
| **Operating Ratio** | (Operating Costs / Haulage Revenue) × 100 | <60% | Efficiency of operations |

#### Operational KPIs

| KPI | Formula | Target | Description |
|-----|---------|--------|-------------|
| **Cost per Trip** | Total Operating Costs / Trips | <₦30,000 | Average cost per delivery |
| **Cost per Kilometer** | Total Fuel Cost / Total Distance | <₦250 | Fuel efficiency metric |
| **Fleet Utilization** | (Actual Trips / Maximum Possible) × 100 | >80% | Truck usage efficiency |
| **Trips per Truck** | Total Trips / Number of Trucks | >25/month | Productivity metric |

#### Cash Flow KPIs

| KPI | Formula | Target | Description |
|-----|---------|--------|-------------|
| **Days Cash on Hand** | Cash Balance / Avg Daily Expenses | >15 days | Liquidity measure |
| **Collection Period** | Avg Receivables / (Sales / Days) | <45 days | How fast customers pay |
| **Payables Period** | Avg Payables / (Purchases / Days) | 30-60 days | Payment timing to Dangote |

---

## 8. IMPLEMENTATION PLAN

### 8.1 Phased Rollout Approach

#### Phase 1: Foundation (Weeks 1-4)

**Objectives:**
- Set up basic infrastructure
- Implement core data models
- Build essential features

**Deliverables:**
1. Database setup and schema implementation
2. Basic trip logging functionality
3. Simple expense recording
4. Basic dashboard with key metrics

**Success Criteria:**
- Users can log trips with costs
- Users can record basic expenses
- Dashboard shows current month totals

#### Phase 2: Payment Management (Weeks 5-8)

**Objectives:**
- Implement payment tracking
- Add financial calculations
- Build basic reports

**Deliverables:**
1. Haulage payment recording
2. Customer payment tracking
3. Cement payment to Dangote recording
4. Monthly P&L report
5. Cash flow tracking

**Success Criteria:**
- All payment types can be recorded
- P&L generates automatically
- Cash flow is visible

#### Phase 3: Reporting & Analytics (Weeks 9-12)

**Objectives:**
- Build comprehensive reporting
- Add data visualizations
- Implement advanced analytics

**Deliverables:**
1. All financial reports
2. Operational reports
3. Dashboard charts and graphs
4. Export functionality (Excel, PDF)
5. Accounts receivable aging

**Success Criteria:**
- Management can view all required reports
- Data can be exported for external use
- Visualizations are accurate and helpful

#### Phase 4: Mobile App & Enhancements (Weeks 13-16)

**Objectives:**
- Develop mobile app for drivers
- Add advanced features
- Optimize performance

**Deliverables:**
1. Mobile driver app (iOS & Android)
2. Fleet management module
3. Maintenance scheduling
4. Alert system
5. Performance optimizations

**Success Criteria:**
- Drivers can log trips from mobile
- System performance is acceptable
- All alerts functioning properly

### 8.2 Resource Requirements

#### Development Team

| Role | Quantity | Responsibilities |
|------|----------|------------------|
| **Project Manager** | 1 | Overall coordination, timeline management |
| **Backend Developer** | 2 | API development, database design |
| **Frontend Developer** | 2 | Web dashboard, UI/UX |
| **Mobile Developer** | 1 | iOS and Android apps |
| **QA/Testing** | 1 | Testing, bug tracking |
| **Business Analyst** | 1 | Requirements, user training |

#### Infrastructure

| Component | Specification | Purpose |
|-----------|--------------|---------|
| **Database Server** | PostgreSQL on cloud | Data storage |
| **Application Server** | Cloud hosting (AWS/Azure) | Backend API |
| **Web Server** | Nginx/Apache | Frontend hosting |
| **Backup System** | Automated daily backups | Data protection |

### 8.3 Training Plan

#### User Training Schedule

**Week 1: Administrator Training**
- System overview
- User management
- Report generation
- Troubleshooting

**Week 2: Data Entry Clerk Training**
- Trip logging
- Expense recording
- Payment entry
- Data validation

**Week 3: Driver Training**
- Mobile app usage
- Trip logging
- Photo documentation
- Best practices

**Week 4: Management Training**
- Dashboard navigation
- Report interpretation
- Decision making with data
- KPI monitoring

### 8.4 Go-Live Checklist

**Pre-Launch (1 week before):**
- [ ] All Phase 1-3 features tested and working
- [ ] Data migration complete (if applicable)
- [ ] User accounts created
- [ ] Training completed
- [ ] Backup system tested
- [ ] Support processes in place

**Launch Day:**
- [ ] System goes live
- [ ] Support team on standby
- [ ] Monitor system performance
- [ ] Collect user feedback

**Post-Launch (1 week after):**
- [ ] Address any critical issues
- [ ] Gather user feedback
- [ ] Make necessary adjustments
- [ ] Plan Phase 4 if needed

---

## 9. APPENDICES

### Appendix A: Sample SQL Queries

#### Query 1: Monthly P&L Data

```sql
-- Get monthly profit & loss data
WITH monthly_data AS (
  SELECT 
    DATE_TRUNC('month', trip_date) as month,
    SUM(total_cement_sale) as cement_sales,
    SUM(total_cement_purchase) as cement_purchases,
    SUM(total_trip_cost) as trip_costs,
    COUNT(*) as trip_count,
    SUM(cement_quantity_tons) as total_tons
  FROM trips
  WHERE trip_date >= '2026-01-01' 
    AND trip_date < '2026-02-01'
  GROUP BY DATE_TRUNC('month', trip_date)
),
monthly_payments AS (
  SELECT 
    DATE_TRUNC('month', payment_date) as month,
    SUM(amount_received) as haulage_revenue
  FROM haulage_payments
  WHERE payment_date >= '2026-01-01' 
    AND payment_date < '2026-02-01'
  GROUP BY DATE_TRUNC('month', payment_date)
),
monthly_expenses AS (
  SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(amount) as other_expenses
  FROM other_expenses
  WHERE date >= '2026-01-01' 
    AND date < '2026-02-01'
  GROUP BY DATE_TRUNC('month', date)
)
SELECT 
  md.month,
  mp.haulage_revenue,
  md.cement_sales,
  md.cement_purchases,
  md.trip_costs,
  me.other_expenses,
  (mp.haulage_revenue + md.cement_sales) as total_revenue,
  (md.cement_purchases + md.trip_costs + me.other_expenses) as total_costs,
  (mp.haulage_revenue + md.cement_sales - md.cement_purchases - md.trip_costs - me.other_expenses) as net_profit
FROM monthly_data md
LEFT JOIN monthly_payments mp ON md.month = mp.month
LEFT JOIN monthly_expenses me ON md.month = me.month;
```

#### Query 2: Accounts Receivable Aging

```sql
-- Get accounts receivable aging report
SELECT 
  customer_name,
  SUM(total_cement_sale) as total_owed,
  MIN(trip_date) as oldest_invoice_date,
  CASE 
    WHEN CURRENT_DATE - MIN(trip_date) <= 30 THEN 'Current'
    WHEN CURRENT_DATE - MIN(trip_date) <= 60 THEN '31-60 days'
    WHEN CURRENT_DATE - MIN(trip_date) <= 90 THEN '61-90 days'
    ELSE '90+ days'
  END as aging_bucket,
  CURRENT_DATE - MIN(trip_date) as days_outstanding
FROM trips
WHERE payment_status IN ('pending', 'partial')
GROUP BY customer_name
ORDER BY days_outstanding DESC;
```

#### Query 3: Fleet Utilization

```sql
-- Get fleet utilization by truck
SELECT 
  t.truck_id,
  tr.registration_number,
  COUNT(t.trip_id) as trips_this_month,
  SUM(t.distance_km) as total_km,
  SUM(t.total_trip_cost) as total_costs,
  AVG(t.total_trip_cost) as avg_cost_per_trip,
  SUM(t.fuel_cost) / SUM(t.distance_km) as cost_per_km
FROM trips t
JOIN trucks tr ON t.truck_id = tr.truck_id
WHERE t.trip_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY t.truck_id, tr.registration_number
ORDER BY trips_this_month DESC;
```

### Appendix B: API Endpoints

#### Trip Management

```
POST   /api/trips              - Create new trip
GET    /api/trips              - List all trips (with filters)
GET    /api/trips/:id          - Get trip details
PUT    /api/trips/:id          - Update trip
DELETE /api/trips/:id          - Delete trip
GET    /api/trips/stats        - Get trip statistics
```

#### Payment Management

```
POST   /api/payments/haulage   - Record haulage payment
GET    /api/payments/haulage   - List haulage payments
POST   /api/payments/customer  - Record customer payment
GET    /api/payments/customer  - List customer payments
POST   /api/payments/cement    - Record cement payment to Dangote
GET    /api/payments/cement    - List cement payments
```

#### Expense Management

```
POST   /api/expenses           - Record expense
GET    /api/expenses           - List expenses
PUT    /api/expenses/:id       - Update expense
DELETE /api/expenses/:id       - Delete expense
GET    /api/expenses/summary   - Get expense summary by category
```

#### Reporting

```
GET    /api/reports/pl         - P&L statement (with date params)
GET    /api/reports/cashflow   - Cash flow report
GET    /api/reports/receivables - Accounts receivable aging
GET    /api/reports/trips      - Trip analysis
GET    /api/reports/costs      - Cost breakdown
```

### Appendix C: System Configuration

#### Environment Variables

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=haulage_cement_db
DB_USER=admin
DB_PASSWORD=secure_password

# Application
APP_PORT=3000
APP_ENV=production
SECRET_KEY=your_secret_key

# Currency
CURRENCY_CODE=NGN
CURRENCY_SYMBOL=₦

# Business Rules
DEFAULT_CEMENT_MARGIN=0.02
MIN_CEMENT_MARGIN=0.005
MAX_CEMENT_MARGIN=0.05
PAYMENT_REMINDER_DAYS=7
```

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Waybill** | Delivery note from Dangote showing cement quantity and destination |
| **Bulk Payment** | Periodic lump sum payment from Dangote for haulage services |
| **Dropshipping** | Business model where cement goes directly from supplier to customer without holding inventory |
| **Trip Cost** | Direct costs associated with a delivery (fuel, allowances, tolls) |
| **Haulage Fee** | Payment received for transportation services |
| **Cement Margin** | Difference between sale price and purchase price of cement |
| **Receivables** | Money owed to business by customers |
| **Payables** | Money owed by business to Dangote |
| **Fleet Utilization** | Percentage of time/capacity trucks are being used productively |

### Appendix E: Assumptions & Constraints

#### Business Assumptions

1. Haulage payments received approximately every 10 days
2. Cement margin target is 1-2%
3. Haulage operations maintain 40-50% margin
4. Average trip is 30 tons over 85km
5. Payment terms with customers vary (COD to 60 days)

#### Technical Constraints

1. System must handle minimum 500 trips per month
2. Reports must generate within 5 seconds
3. Mobile app must work offline with sync
4. Data must be retained for minimum 7 years
5. System must support 50 concurrent users

#### Known Limitations

1. No automated trip-to-payment matching (by design - simplified approach)
2. Manual entry required for all transactions
3. Limited integration with external accounting systems initially
4. Mobile app requires internet for data submission

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | System Architect | Initial document creation |

---

**END OF DOCUMENT**

---

*This is a living document and will be updated as the system evolves and requirements change.*