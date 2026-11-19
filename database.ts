// Persistent Relational Store & Multi-Tenant Database Manager
// Stores transactional business data with ACID consistency and workspace isolation

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import {
  User,
  BusinessWorkspace,
  WorkspaceMember,
  Customer,
  Supplier,
  DocumentItem,
  Invoice,
  Bill,
  PurchaseOrder,
  GoodsReceiptNote,
  Payment,
  PaymentAllocation,
  BankTransaction,
  VerificationCase,
  CashFlowScenario,
  Reminder,
  AuditLog,
} from '../types/index.js';

export interface DatabaseSchema {
  users: User[];
  businessWorkspaces: BusinessWorkspace[];
  workspaceMembers: WorkspaceMember[];
  customers: Customer[];
  suppliers: Supplier[];
  documents: DocumentItem[];
  invoices: Invoice[];
  bills: Bill[];
  purchaseOrders: PurchaseOrder[];
  goodsReceiptNotes: GoodsReceiptNote[];
  payments: Payment[];
  paymentAllocations: PaymentAllocation[];
  bankTransactions: BankTransaction[];
  verificationCases: VerificationCase[];
  cashFlowScenarios: CashFlowScenario[];
  reminders: Reminder[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'server/data');
const DATA_FILE = path.join(DATA_DIR, 'econvyx_data.json');

class DatabaseManager {
  private data: DatabaseSchema;
  private isSaving: boolean = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
    if (this.data.businessWorkspaces.length === 0) {
      this.seedApexDemoWorkspace();
    }
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('Could not read persistent data file, initializing fresh store.', err);
    }

    return {
      users: [],
      businessWorkspaces: [],
      workspaceMembers: [],
      customers: [],
      suppliers: [],
      documents: [],
      invoices: [],
      bills: [],
      purchaseOrders: [],
      goodsReceiptNotes: [],
      payments: [],
      paymentAllocations: [],
      bankTransactions: [],
      verificationCases: [],
      cashFlowScenarios: [],
      reminders: [],
      auditLogs: [],
    };
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      this.ensureDirectory();
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Failed to atomically write persistent database file', err);
    } finally {
      this.isSaving = false;
    }
  }

  // --- Multi-Tenant Query Helpers ---

  public getUsers() {
    return this.data.users;
  }

  public getWorkspaces() {
    return this.data.businessWorkspaces;
  }

  public getWorkspaceMembers() {
    return this.data.workspaceMembers;
  }

  public getWorkspacesByUserId(userId: string) {
    const memberWorkspaceIds = this.data.workspaceMembers
      .filter((m) => m.userId === userId)
      .map((m) => m.workspaceId);
    // If user has no memberships yet (just registered), return empty array
    return this.data.businessWorkspaces.filter((w) => memberWorkspaceIds.includes(w.id));
  }

  public getWorkspace(id: string) {
    return this.data.businessWorkspaces.find((w) => w.id === id || w.slug === id);
  }

  public getCustomers(workspaceId: string) {
    return this.data.customers.filter((c) => c.workspaceId === workspaceId);
  }

  public getSuppliers(workspaceId: string) {
    return this.data.suppliers.filter((s) => s.workspaceId === workspaceId);
  }

  public getDocuments(workspaceId: string) {
    return this.data.documents.filter((d) => d.workspaceId === workspaceId);
  }

  public getInvoices(workspaceId: string) {
    return this.data.invoices
      .filter((inv) => inv.workspaceId === workspaceId)
      .map((inv) => ({
        ...inv,
        customer: this.data.customers.find((c) => c.id === inv.customerId),
      }));
  }

  public getBills(workspaceId: string) {
    return this.data.bills
      .filter((b) => b.workspaceId === workspaceId)
      .map((b) => ({
        ...b,
        supplier: this.data.suppliers.find((s) => s.id === b.supplierId),
      }));
  }

  public getPurchaseOrders(workspaceId: string) {
    return this.data.purchaseOrders.filter((p) => p.workspaceId === workspaceId);
  }

  public getGoodsReceiptNotes(workspaceId: string) {
    return this.data.goodsReceiptNotes.filter((g) => g.workspaceId === workspaceId);
  }

  public getPayments(workspaceId: string) {
    return this.data.payments.filter((p) => p.workspaceId === workspaceId);
  }

  public getPaymentAllocations(workspaceId: string) {
    return this.data.paymentAllocations.filter((a) => a.workspaceId === workspaceId);
  }

  public getBankTransactions(workspaceId: string) {
    return this.data.bankTransactions.filter((t) => t.workspaceId === workspaceId);
  }

  public getVerificationCases(workspaceId: string) {
    return this.data.verificationCases
      .filter((v) => v.workspaceId === workspaceId)
      .map((v) => ({
        ...v,
        invoice: this.data.invoices.find((i) => i.id === v.invoiceId),
        po: this.data.purchaseOrders.find((p) => p.id === v.poId),
        grn: this.data.goodsReceiptNotes.find((g) => g.id === v.grnId),
      }));
  }

  public getCashFlowScenarios(workspaceId: string) {
    return this.data.cashFlowScenarios.filter((s) => s.workspaceId === workspaceId);
  }

  public getReminders(workspaceId: string) {
    return this.data.reminders.filter((r) => r.workspaceId === workspaceId);
  }

  public getAuditLogs(workspaceId: string) {
    return this.data.auditLogs
      .filter((l) => l.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // --- Mutations ---

  public addWorkspace(workspace: BusinessWorkspace) {
    this.data.businessWorkspaces.push(workspace);
    this.save();
    return workspace;
  }

  public addCustomer(customer: Customer) {
    this.data.customers.push(customer);
    this.save();
    return customer;
  }

  public addSupplier(supplier: Supplier) {
    this.data.suppliers.push(supplier);
    this.save();
    return supplier;
  }

  public addDocument(doc: DocumentItem) {
    this.data.documents.unshift(doc);
    this.save();
    return doc;
  }

  public updateDocument(id: string, updates: Partial<DocumentItem>) {
    const idx = this.data.documents.findIndex((d) => d.id === id);
    if (idx !== -1) {
      this.data.documents[idx] = { ...this.data.documents[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.documents[idx];
    }
    return null;
  }

  public addInvoice(invoice: Invoice) {
    this.data.invoices.unshift(invoice);
    this.save();
    return invoice;
  }

  public updateInvoice(id: string, updates: Partial<Invoice>) {
    const idx = this.data.invoices.findIndex((inv) => inv.id === id);
    if (idx !== -1) {
      this.data.invoices[idx] = { ...this.data.invoices[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.invoices[idx];
    }
    return null;
  }

  public addBill(bill: Bill) {
    this.data.bills.unshift(bill);
    this.save();
    return bill;
  }

  public updateBill(id: string, updates: Partial<Bill>) {
    const idx = this.data.bills.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.data.bills[idx] = { ...this.data.bills[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.bills[idx];
    }
    return null;
  }

  public addPayment(payment: Payment) {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  public allocatePayment(allocation: PaymentAllocation) {
    this.data.paymentAllocations.push(allocation);

    // Update payment allocated amount
    const payment = this.data.payments.find((p) => p.id === allocation.paymentId);
    if (payment) {
      payment.allocatedAmountPaise += allocation.amountPaise;
      payment.unallocatedAmountPaise = Math.max(0, payment.amountPaise - payment.allocatedAmountPaise);
    }

    // Update invoice if applicable
    if (allocation.invoiceId) {
      const invoice = this.data.invoices.find((i) => i.id === allocation.invoiceId);
      if (invoice) {
        invoice.receivedAmountPaise += allocation.amountPaise;
        invoice.outstandingAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.receivedAmountPaise);
        if (invoice.outstandingAmountPaise === 0) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'partially_paid';
        }
      }
    }

    // Update bill if applicable
    if (allocation.billId) {
      const bill = this.data.bills.find((b) => b.id === allocation.billId);
      if (bill) {
        bill.paidAmountPaise += allocation.amountPaise;
        bill.outstandingAmountPaise = Math.max(0, bill.totalAmountPaise - bill.paidAmountPaise);
        if (bill.outstandingAmountPaise === 0) {
          bill.status = 'paid';
        } else {
          bill.status = 'partially_paid';
        }
      }
    }

    this.save();
    return allocation;
  }

  public addBankTransaction(txn: BankTransaction) {
    this.data.bankTransactions.unshift(txn);
    this.save();
    return txn;
  }

  public updateBankTransaction(id: string, updates: Partial<BankTransaction>) {
    const idx = this.data.bankTransactions.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.bankTransactions[idx] = { ...this.data.bankTransactions[idx], ...updates };
      this.save();
      return this.data.bankTransactions[idx];
    }
    return null;
  }

  public addVerificationCase(verCase: VerificationCase) {
    this.data.verificationCases.unshift(verCase);
    this.save();
    return verCase;
  }

  public updateVerificationCase(id: string, updates: Partial<VerificationCase>) {
    const idx = this.data.verificationCases.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.data.verificationCases[idx] = { ...this.data.verificationCases[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.verificationCases[idx];
    }
    return null;
  }

  public addReminder(reminder: Reminder) {
    this.data.reminders.unshift(reminder);
    this.save();
    return reminder;
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...log,
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  // --- Production Workspace Seeding ---

  public seedApexDemoWorkspace() {
    const workspaceId = 'ws-enterprise-001';
    const today = new Date().toISOString().split('T')[0];

    // 1. Production Business Workspace
    const apexWorkspace: BusinessWorkspace = {
      id: workspaceId,
      name: 'ECONVYX Technologies & Manufacturing',
      slug: 'econvyx-manufacturing',
      businessType: 'manufacturing',
      industry: 'Precision Automotive & Engineering',
      gstin: '27AAACE1234F1Z5',
      pan: 'AAACE1234F',
      address: 'Plot 42, Chakan Industrial Area, Phase II',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '410501',
      defaultCurrency: 'INR',
      financialYearStart: '04-01',
      defaultPaymentTermsDays: 30,
      timezone: 'Asia/Kolkata',
      isDemo: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    // 2. Demo records do not receive a pre-created login account.\n\n    // 3. Customers
    const cust1: Customer = {
      id: 'cust-001',
      workspaceId,
      name: 'Precision AutoTech Ltd',
      companyName: 'Precision AutoTech Ltd',
      email: 'accounts@precisionautotech.in',
      phone: '+91 20 6711 4000',
      gstin: '27AABCP1122D1Z4',
      billingAddress: 'Gat No. 340, Mahalunge, Chakan, Pune 410501',
      paymentTermsDays: 30,
      creditLimitPaise: 100000000, // â‚¹10,00,000
      notes: 'Key OEM tier-1 buyer. Reliable but occasionally delays due to internal audit cycles.',
      isActive: true,
      createdAt: '2026-01-05T00:00:00Z',
      updatedAt: '2026-01-05T00:00:00Z',
    };

    const cust2: Customer = {
      id: 'cust-002',
      workspaceId,
      name: 'Bharat Electricals & Cables',
      companyName: 'Bharat Electricals & Cables Ltd',
      email: 'procurement@bharatelectricals.com',
      phone: '+91 22 2855 9000',
      gstin: '27AABCB9988E1Z9',
      billingAddress: 'Plot 12, MIDC Andheri East, Mumbai 400093',
      paymentTermsDays: 30,
      creditLimitPaise: 50000000,
      notes: 'Consistent prompt payer with weekly batch settlement.',
      isActive: true,
      createdAt: '2026-01-08T00:00:00Z',
      updatedAt: '2026-01-08T00:00:00Z',
    };

    const cust3: Customer = {
      id: 'cust-003',
      workspaceId,
      name: 'Zenith Engineering Works',
      companyName: 'Zenith Engineering Works LLP',
      email: 'finance@zenitheng.co.in',
      phone: '+91 265 243 1100',
      gstin: '24AABCZ3344F1Z1',
      billingAddress: 'Makarpura GIDC, Vadodara, Gujarat 390010',
      paymentTermsDays: 45,
      creditLimitPaise: 30000000,
      notes: 'New account onboarded in Q3.',
      isActive: true,
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    };

    // 4. Suppliers
    const supp1: Supplier = {
      id: 'supp-001',
      workspaceId,
      name: 'RawMetals Alloy India Pvt Ltd',
      contactPerson: 'Suresh Singhania',
      email: 'sales@rawmetals.co.in',
      phone: '+91 20 2744 8899',
      gstin: '27AABCR7766K1Z3',
      address: 'Bhosari Industrial Estate, Pune 411026',
      paymentTermsDays: 30,
      notes: 'Primary supplier for cold-rolled steel billets.',
      isActive: true,
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };

    const supp2: Supplier = {
      id: 'supp-002',
      workspaceId,
      name: 'Shanti Packaging & Logistics',
      contactPerson: 'Karan Mehta',
      email: 'billing@shantipackaging.in',
      phone: '+91 20 2567 1122',
      gstin: '27AABCS5544L1Z8',
      address: 'Hadapsar Industrial Estate, Pune 411013',
      paymentTermsDays: 15,
      notes: 'Supplies corrugated export-grade cartons.',
      isActive: true,
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-03T00:00:00Z',
    };

    // 5. Invoices (Exact requested figures from Master Prompt Section 24)
    // INV-101: Total: â‚¹5,00,000, Received: â‚¹0, Outstanding: â‚¹5,00,000
    // INV-102: Total: â‚¹2,00,000, Received: â‚¹1,00,000, Outstanding: â‚¹1,00,000
    // INV-103: Total: â‚¹1,00,000, Received: â‚¹1,00,000, Outstanding: â‚¹0
    // Expected Totals: Total Invoiced = â‚¹8,00,000, Total Received = â‚¹2,00,000, Total Outstanding = â‚¹6,00,000!

    const inv101: Invoice = {
      id: 'inv-101',
      workspaceId,
      customerId: cust1.id,
      invoiceNumber: 'INV-101',
      issueDate: '2026-01-15',
      dueDate: '2026-02-14', // Overdue relative to current date
      paymentTermsDays: 30,
      poReference: 'PO-2026-001',
      subtotalPaise: 42372881,
      taxableAmountPaise: 42372881,
      cgstPaise: 3813560,
      sgstPaise: 3813559,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 50000000, // â‚¹5,00,000.00
      receivedAmountPaise: 0,       // â‚¹0.00
      outstandingAmountPaise: 50000000, // â‚¹5,00,000.00
      status: 'overdue',
      notes: 'Export quality alloy fasteners batch A-9. Overdue follow-up initiated.',
      items: [
        {
          id: 'item-101-1',
          invoiceId: 'inv-101',
          description: 'High-Tensile Precision Fasteners (M12)',
          hsnSac: '7318',
          quantity: 100,
          unit: 'units',
          unitPricePaise: 423729,
          taxRatePercent: 18,
          taxableAmountPaise: 42372881,
          cgstPaise: 3813560,
          sgstPaise: 3813559,
          igstPaise: 0,
          totalAmountPaise: 50000000,
        },
      ],
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    };

    const inv102: Invoice = {
      id: 'inv-102',
      workspaceId,
      customerId: cust2.id,
      invoiceNumber: 'INV-102',
      issueDate: '2026-02-01',
      dueDate: '2026-03-03',
      paymentTermsDays: 30,
      poReference: 'PO-2026-045',
      subtotalPaise: 16949153,
      taxableAmountPaise: 16949153,
      cgstPaise: 1525424,
      sgstPaise: 1525423,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 20000000, // â‚¹2,00,000.00
      receivedAmountPaise: 10000000, // â‚¹1,00,000.00
      outstandingAmountPaise: 10000000, // â‚¹1,00,000.00
      status: 'partially_paid',
      notes: 'First tranche of â‚¹1,00,000 confirmed via bank receipt; remaining â‚¹1,00,000 balance pending.',
      items: [
        {
          id: 'item-102-1',
          invoiceId: 'inv-102',
          description: 'Sub-assembly Bushing Kits',
          hsnSac: '8483',
          quantity: 50,
          unit: 'sets',
          unitPricePaise: 338983,
          taxRatePercent: 18,
          taxableAmountPaise: 16949153,
          cgstPaise: 1525424,
          sgstPaise: 1525423,
          igstPaise: 0,
          totalAmountPaise: 20000000,
        },
      ],
      createdAt: '2026-02-01T11:00:00Z',
      updatedAt: '2026-02-01T11:00:00Z',
    };

    const inv103: Invoice = {
      id: 'inv-103',
      workspaceId,
      customerId: cust3.id,
      invoiceNumber: 'INV-103',
      issueDate: '2026-02-10',
      dueDate: '2026-03-27',
      paymentTermsDays: 45,
      poReference: 'PO-2026-088',
      subtotalPaise: 8474576,
      taxableAmountPaise: 8474576,
      cgstPaise: 762712,
      sgstPaise: 762712,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 10000000, // â‚¹1,00,000.00
      receivedAmountPaise: 10000000, // â‚¹1,00,000.00
      outstandingAmountPaise: 0,        // â‚¹0.00
      status: 'paid',
      notes: 'Fully settled upon delivery.',
      items: [
        {
          id: 'item-103-1',
          invoiceId: 'inv-103',
          description: 'CNC Turned Flanges',
          hsnSac: '7307',
          quantity: 25,
          unit: 'pcs',
          unitPricePaise: 338983,
          taxRatePercent: 18,
          taxableAmountPaise: 8474576,
          cgstPaise: 762712,
          sgstPaise: 762712,
          igstPaise: 0,
          totalAmountPaise: 10000000,
        },
      ],
      createdAt: '2026-02-10T14:00:00Z',
      updatedAt: '2026-02-10T14:00:00Z',
    };

    // 6. Supplier Bills (Accounts Payable)
    // Total upcoming outflows = â‚¹2,30,000 (â‚¹1,50,000 + â‚¹80,000)
    const bill401: Bill = {
      id: 'bill-401',
      workspaceId,
      supplierId: supp1.id,
      billNumber: 'BILL-401',
      billDate: '2026-02-12',
      dueDate: '2026-03-14',
      paymentTermsDays: 30,
      poReference: 'PO-RM-2026-12',
      totalAmountPaise: 15000000, // â‚¹1,50,000
      paidAmountPaise: 0,
      outstandingAmountPaise: 15000000,
      status: 'approved',
      notes: 'Raw steel billets batch #82.',
      createdAt: '2026-02-12T09:00:00Z',
      updatedAt: '2026-02-12T09:00:00Z',
    };

    const bill402: Bill = {
      id: 'bill-402',
      workspaceId,
      supplierId: supp2.id,
      billNumber: 'BILL-402',
      billDate: '2026-02-15',
      dueDate: '2026-03-02',
      paymentTermsDays: 15,
      poReference: 'PO-PK-2026-05',
      totalAmountPaise: 8000000, // â‚¹80,000
      paidAmountPaise: 0,
      outstandingAmountPaise: 8000000,
      status: 'pending_review',
      notes: 'Packaging boxes for export order.',
      createdAt: '2026-02-15T11:00:00Z',
      updatedAt: '2026-02-15T11:00:00Z',
    };

    // 7. Purchase Order & Verification Discrepancy (Section 24)
    // PO: 100 units Ã— â‚¹5,000 = â‚¹5,00,000
    // Invoice: 120 units Ã— â‚¹5,000 = â‚¹6,00,000
    // Difference: 20 additional units = â‚¹1,00,000
    const po2026_001: PurchaseOrder = {
      id: 'po-demo-001',
      workspaceId,
      supplierId: supp1.id,
      poNumber: 'PO-2026-001',
      poDate: '2026-01-10',
      deliveryDeadline: '2026-02-05',
      totalValuePaise: 50000000, // â‚¹5,00,000 (100 units * â‚¹5,000)
      status: 'active',
      items: [
        {
          id: 'poi-1',
          poId: 'po-demo-001',
          description: 'High-Tensile Precision Fasteners (M12)',
          quantity: 100,
          unitPricePaise: 500000, // â‚¹5,000
          totalAmountPaise: 50000000,
        },
      ],
      createdAt: '2026-01-10T09:00:00Z',
    };

    const grn2026_001: GoodsReceiptNote = {
      id: 'grn-demo-001',
      workspaceId,
      poId: po2026_001.id,
      grnNumber: 'GRN-2026-001',
      receivedDate: '2026-01-28',
      receivedItems: [
        {
          description: 'High-Tensile Precision Fasteners (M12)',
          quantity: 100, // physically received 100
        },
      ],
      createdAt: '2026-01-28T16:00:00Z',
    };

    const verCase1: VerificationCase = {
      id: 'vc-demo-001',
      workspaceId,
      caseNumber: 'VC-2026-101',
      invoiceId: inv101.id,
      poId: po2026_001.id,
      grnId: grn2026_001.id,
      status: 'mismatch',
      summary: 'Quantity mismatch detected: Billed for 120 units, but PO authorized 100 units and GRN confirms 100 units.',
      monetaryImpactPaise: 10000000, // â‚¹1,00,000 discrepancy
      findings: [
        {
          id: 'vf-001',
          caseId: 'vc-demo-001',
          fieldName: 'Quantity: High-Tensile Precision Fasteners (M12)',
          expectedValue: '100 units (PO / GRN)',
          actualValue: '120 units (Vendor Invoice)',
          differenceValue: '+20 units excess billed',
          monetaryDifferencePaise: 10000000, // â‚¹1,00,000
          severity: 'high',
          description: 'Vendor invoiced for 120 units at â‚¹5,000/unit (â‚¹6,00,000), but approved PO only authorizes 100 units (â‚¹5,00,000). Total unauthorized excess of â‚¹1,00,000.',
        },
      ],
      reviewerComments: 'Invoice put on hold pending revised credit note or corrected invoice from vendor.',
      createdAt: '2026-01-16T12:00:00Z',
      updatedAt: '2026-01-16T12:00:00Z',
    };

    // 8. Bank Statement Transaction (Section 24)
    // Incoming amount: â‚¹1,00,000
    // Possible match: INV-102
    // Status: Suggested, awaiting confirmation
    const bankTxn1: BankTransaction = {
      id: 'btxn-demo-001',
      workspaceId,
      transactionDate: '2026-02-18',
      description: 'NEFT CR-AXIS/928371/BHARAT ELECTRICALS/INV102 TRN',
      referenceNumber: 'AXISN928371004',
      type: 'credit',
      amountPaise: 10000000, // â‚¹1,00,000
      balancePaise: 20000000, // â‚¹2,00,000
      reconciliationStatus: 'suggested',
      matchedInvoiceId: inv102.id,
      matchConfidence: 96,
      matchReason: 'Exact outstanding balance match (â‚¹1,00,000); Invoice number INV-102 and counterparty "Bharat Electricals" identified in NEFT narration.',
      createdAt: '2026-02-18T10:30:00Z',
    };

    // 9. Initial Payment Records
    const payment1: Payment = {
      id: 'pay-demo-001',
      workspaceId,
      paymentNumber: 'REC-2026-001',
      paymentType: 'incoming',
      paymentDate: '2026-02-05',
      amountPaise: 10000000, // â‚¹1,00,000 for INV-102
      allocatedAmountPaise: 10000000,
      unallocatedAmountPaise: 0,
      paymentMode: 'bank_transfer',
      referenceNumber: 'CMS8821901',
      customerId: cust2.id,
      notes: 'Initial 50% advance for INV-102.',
      createdAt: '2026-02-05T15:00:00Z',
      updatedAt: '2026-02-05T15:00:00Z',
    };

    const payment2: Payment = {
      id: 'pay-demo-002',
      workspaceId,
      paymentNumber: 'REC-2026-002',
      paymentType: 'incoming',
      paymentDate: '2026-02-11',
      amountPaise: 10000000, // â‚¹1,00,000 for INV-103
      allocatedAmountPaise: 10000000,
      unallocatedAmountPaise: 0,
      paymentMode: 'bank_transfer',
      referenceNumber: 'CMS9901823',
      customerId: cust3.id,
      notes: 'Full settlement for INV-103.',
      createdAt: '2026-02-11T12:00:00Z',
      updatedAt: '2026-02-11T12:00:00Z',
    };

    const alloc1: PaymentAllocation = {
      id: 'alloc-001',
      workspaceId,
      paymentId: payment1.id,
      invoiceId: inv102.id,
      amountPaise: 10000000,
      createdAt: '2026-02-05T15:05:00Z',
    };

    const alloc2: PaymentAllocation = {
      id: 'alloc-002',
      workspaceId,
      paymentId: payment2.id,
      invoiceId: inv103.id,
      amountPaise: 10000000,
      createdAt: '2026-02-11T12:05:00Z',
    };

    // 10. Audit Logs
    const auditLogs: AuditLog[] = [
      {
        id: 'audit-001',
        workspaceId,
        userEmail: 'system@econvyx.local',
        action: 'WORKSPACE_INITIALIZED',
        entityType: 'business_workspace',
        entityId: workspaceId,
        details: 'Apex Components demonstration workspace initialized with seeded verified financial records.',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'audit-002',
        workspaceId,
        userEmail: 'system@econvyx.local',
        action: 'VERIFICATION_DISCREPANCY_FLAGGED',
        entityType: 'verification_case',
        entityId: verCase1.id,
        details: 'Deterministic matching detected 20-unit quantity discrepancy (â‚¹1,00,000 variance) on PO-2026-001 vs vendor invoice.',
        createdAt: '2026-01-16T12:00:00Z',
      },
      {
        id: 'audit-003',
        workspaceId,
        userEmail: 'system@econvyx.local',
        action: 'BANK_MATCH_SUGGESTED',
        entityType: 'bank_transaction',
        entityId: bankTxn1.id,
        details: 'Suggested 96% confidence match between transaction AXISN928371004 and INV-102.',
        createdAt: '2026-02-18T10:30:00Z',
      },
    ];

    // 11. Initial Sample Reminder
    const reminder1: Reminder = {
      id: 'rem-demo-001',
      workspaceId,
      invoiceId: inv101.id,
      customerId: cust1.id,
      tone: 'professional',
      subject: 'Payment Follow-up: Invoice #INV-101 - â‚¹5,00,000.00 Due',
      messageBody: `Dear Precision AutoTech Ltd,\n\nWe are writing to follow up on the payment for Invoice #INV-101, dated 2026-01-15, with a total outstanding balance of â‚¹5,00,000.00.\n\nAs per our agreed payment terms, the payment was due on 2026-02-14 and is now overdue.\n\nPlease arrange for the remittance at your earliest convenience or share the transaction UTR number if already processed.\n\nSincerely,\nFinance Department\nApex Components`,
      status: 'draft',
      createdAt: '2026-02-15T10:00:00Z',
    };

    // Store all seeded demo data
    this.data.businessWorkspaces = [apexWorkspace];
    this.data.users = [];
    this.data.workspaceMembers = [];
    this.data.customers = [cust1, cust2, cust3];
    this.data.suppliers = [supp1, supp2];
    this.data.invoices = [inv101, inv102, inv103];
    this.data.bills = [bill401, bill402];
    this.data.purchaseOrders = [po2026_001];
    this.data.goodsReceiptNotes = [grn2026_001];
    this.data.payments = [payment1, payment2];
    this.data.paymentAllocations = [alloc1, alloc2];
    this.data.bankTransactions = [bankTxn1];
    this.data.verificationCases = [verCase1];
    this.data.reminders = [reminder1];
    this.data.auditLogs = auditLogs;

    this.save();
    console.log('Seeded Apex Components demo workspace with verified financial records.');
  }

  public resetDemoWorkspace() {
    this.data.businessWorkspaces = this.data.businessWorkspaces.filter((w) => !w.isDemo);
    this.seedApexDemoWorkspace();
    return true;
  }
}

export const db = new DatabaseManager();
