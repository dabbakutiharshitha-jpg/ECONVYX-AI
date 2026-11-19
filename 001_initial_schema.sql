-- ECONVYX AI - Master Database Schema & PostgreSQL Migration
-- Turn financial complexity into clarity.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Workspaces
CREATE TABLE IF NOT EXISTS business_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    business_type VARCHAR(100) NOT NULL, -- 'manufacturing', 'wholesale', 'distribution', 'services', 'other'
    industry VARCHAR(100),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    default_currency VARCHAR(10) DEFAULT 'INR',
    financial_year_start VARCHAR(10) DEFAULT '04-01',
    default_payment_terms_days INT DEFAULT 30,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workspace Members (RBAC: Owner, Admin, Finance Manager, Accountant, Viewer)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- 'owner', 'admin', 'finance_manager', 'accountant', 'viewer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    gstin VARCHAR(15),
    billing_address TEXT,
    shipping_address TEXT,
    payment_terms_days INT DEFAULT 30,
    credit_limit_paise BIGINT DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    gstin VARCHAR(15),
    address TEXT,
    payment_terms_days INT DEFAULT 30,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Documents (PO, GRN, Delivery Ack, Tax Invoice, Credit/Debit Note, Bank Statement)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'purchase_order', 'grn', 'delivery_acknowledgement', 'tax_invoice', 'credit_note', 'debit_note', 'bank_statement', 'other'
    extraction_status VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'extracted', 'needs_review', 'confirmed', 'failed'
    confidence_score DECIMAL(5, 2) DEFAULT 0.00,
    extracted_data JSONB,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invoices (Accounts Receivable)
-- Note: All monetary amounts stored as integer paise (1 Rupee = 100 paise)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_terms_days INT DEFAULT 30,
    po_reference VARCHAR(100),
    subtotal_paise BIGINT NOT NULL DEFAULT 0,
    taxable_amount_paise BIGINT NOT NULL DEFAULT 0,
    cgst_paise BIGINT NOT NULL DEFAULT 0,
    sgst_paise BIGINT NOT NULL DEFAULT 0,
    igst_paise BIGINT NOT NULL DEFAULT 0,
    discount_paise BIGINT NOT NULL DEFAULT 0,
    total_amount_paise BIGINT NOT NULL DEFAULT 0,
    received_amount_paise BIGINT NOT NULL DEFAULT 0,
    outstanding_amount_paise BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'draft', 'awaiting_confirmation', 'open', 'due_soon', 'overdue', 'partially_paid', 'paid', 'disputed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, invoice_number)
);

-- 8. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn_sac VARCHAR(50),
    quantity DECIMAL(12, 3) NOT NULL,
    unit VARCHAR(50) DEFAULT 'units',
    unit_price_paise BIGINT NOT NULL,
    tax_rate_percent DECIMAL(5, 2) DEFAULT 18.00,
    taxable_amount_paise BIGINT NOT NULL,
    cgst_paise BIGINT DEFAULT 0,
    sgst_paise BIGINT DEFAULT 0,
    igst_paise BIGINT DEFAULT 0,
    total_amount_paise BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bills (Accounts Payable)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_terms_days INT DEFAULT 30,
    po_reference VARCHAR(100),
    total_amount_paise BIGINT NOT NULL DEFAULT 0,
    paid_amount_paise BIGINT NOT NULL DEFAULT 0,
    outstanding_amount_paise BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review', -- 'draft', 'pending_review', 'approved', 'partially_paid', 'paid', 'overdue', 'disputed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, bill_number)
);

-- 10. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    po_number VARCHAR(100) NOT NULL,
    po_date DATE NOT NULL,
    delivery_deadline DATE,
    total_value_paise BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'issued',
    document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, po_number)
);

-- 11. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_price_paise BIGINT NOT NULL,
    total_amount_paise BIGINT NOT NULL
);

-- 12. Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(id),
    grn_number VARCHAR(100) NOT NULL,
    received_date DATE NOT NULL,
    document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, grn_number)
);

-- 13. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    payment_type VARCHAR(20) NOT NULL, -- 'incoming' (customer receipt), 'outgoing' (supplier payment)
    payment_date DATE NOT NULL,
    amount_paise BIGINT NOT NULL,
    allocated_amount_paise BIGINT DEFAULT 0,
    unallocated_amount_paise BIGINT NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'bank_transfer', -- 'neft', 'rtgs', 'imps', 'upi', 'cheque', 'bank_transfer'
    reference_number VARCHAR(100),
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Payment Allocations (Atomic allocation to invoices or bills)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Bank Statements & Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    type VARCHAR(20) NOT NULL, -- 'credit', 'debit'
    amount_paise BIGINT NOT NULL,
    balance_paise BIGINT,
    reconciliation_status VARCHAR(50) DEFAULT 'unmatched', -- 'unmatched', 'suggested', 'partially_matched', 'matched', 'ignored'
    matched_invoice_id UUID REFERENCES invoices(id),
    matched_bill_id UUID REFERENCES bills(id),
    matched_payment_id UUID REFERENCES payments(id),
    match_confidence DECIMAL(5, 2) DEFAULT 0.00,
    match_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Verification Cases (PO <-> GRN <-> Delivery Ack <-> Invoice)
CREATE TABLE IF NOT EXISTS verification_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    case_number VARCHAR(100) NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    po_id UUID REFERENCES purchase_orders(id),
    grn_id UUID REFERENCES goods_receipt_notes(id),
    status VARCHAR(50) NOT NULL DEFAULT 'needs_review', -- 'verified', 'minor_difference', 'mismatch', 'missing_document', 'needs_review', 'disputed'
    summary TEXT NOT NULL,
    monetary_impact_paise BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Verification Findings
CREATE TABLE IF NOT EXISTS verification_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES verification_cases(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    expected_value TEXT,
    actual_value TEXT,
    difference_value TEXT,
    monetary_difference_paise BIGINT DEFAULT 0,
    severity VARCHAR(20) DEFAULT 'high', -- 'low', 'medium', 'high', 'critical'
    description TEXT NOT NULL
);

-- 18. Cash Flow Scenarios
CREATE TABLE IF NOT EXISTS cash_flow_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    delay_days INT DEFAULT 0,
    delayed_invoice_ids JSONB DEFAULT '[]',
    additional_expense_paise BIGINT DEFAULT 0,
    forecast_horizon_days INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tone VARCHAR(50) DEFAULT 'friendly', -- 'friendly', 'professional', 'firm', 'final_notice'
    subject TEXT NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'copied', 'sent'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES business_workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance multi-tenant querying
CREATE INDEX IF NOT EXISTS idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_workspace ON bills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace ON payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_workspace ON bank_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);

-- Enable Row Level Security (RLS) on all tenant-owned tables
ALTER TABLE business_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policy for Invoices: Enforce workspace membership
CREATE POLICY tenant_isolation_invoices ON invoices
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );
