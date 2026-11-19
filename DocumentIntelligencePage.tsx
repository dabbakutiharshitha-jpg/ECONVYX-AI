// Document Intelligence Centre Page

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  Check,
  Search,
  Filter,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { DocumentItem, DocumentType } from '../../types/index.js';
import { formatINR, formatDate, getStatusBadgeProps } from '../../lib/utils.js';

export const DocumentIntelligencePage: React.FC = () => {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('tax_invoice');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Editable fields in preview modal
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [isSavingFields, setIsSavingFields] = useState(false);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedType);

    try {
      setIsUploading(true);
      addToast({
        type: 'info',
        title: 'Processing Document',
        message: `Extracting financial fields from ${file.name}...`,
      });

      const res = await api.uploadDocument(formData);
      addToast({
        type: 'success',
        title: 'Document Extracted',
        message: `AI structured extraction completed with ${res.document?.confidenceScore}% confidence.`,
      });

      await fetchDocs();
      if (res.document) {
        openDocumentDetail(res.document);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Could not process document.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openDocumentDetail = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    const fields = doc.extractedData?.fields || {};
    setEditFields({
      documentNumber: fields.documentNumber?.value || '',
      counterpartyName: fields.counterpartyName?.value || '',
      counterpartyGstin: fields.counterpartyGstin?.value || '',
      issueDate: fields.issueDate?.value || '',
      dueDate: fields.dueDate?.value || '',
      subtotalRupees: fields.subtotalPaise?.value ? fields.subtotalPaise.value / 100 : 0,
      taxTotalRupees: fields.taxTotalPaise?.value ? fields.taxTotalPaise.value / 100 : 0,
      grandTotalRupees: fields.grandTotalPaise?.value ? fields.grandTotalPaise.value / 100 : 0,
    });
  };

  const handleSaveFields = async () => {
    if (!selectedDoc) return;
    try {
      setIsSavingFields(true);
      await api.updateDocumentFields(selectedDoc.id, {
        fields: {
          documentNumber: { value: editFields.documentNumber, confidence: 1.0 },
          counterpartyName: { value: editFields.counterpartyName, confidence: 1.0 },
          counterpartyGstin: { value: editFields.counterpartyGstin, confidence: 1.0 },
          issueDate: { value: editFields.issueDate, confidence: 1.0 },
          dueDate: { value: editFields.dueDate, confidence: 1.0 },
          subtotalPaise: { value: Math.round(editFields.subtotalRupees * 100), confidence: 1.0 },
          taxTotalPaise: { value: Math.round(editFields.taxTotalRupees * 100), confidence: 1.0 },
          grandTotalPaise: { value: Math.round(editFields.grandTotalRupees * 100), confidence: 1.0 },
        },
      });
      addToast({ type: 'success', title: 'Fields Updated', message: 'Extracted fields updated.' });
      await fetchDocs();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setIsSavingFields(false);
    }
  };

  const handleConfirmDocument = async (docId: string) => {
    try {
      await api.confirmDocument(docId);
      addToast({
        type: 'success',
        title: 'Document Confirmed',
        message: 'Financial record confirmed and verified into ledger.',
      });
      setSelectedDoc(null);
      await fetchDocs();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Confirmation Failed', message: err.message });
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.extractionStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Document Intelligence Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AI-assisted extraction for Purchase Orders, GRNs, Delivery Acks, Tax Invoices & Bank Statements.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-6 bg-white border-2 border-dashed border-slate-300 hover:border-brand-teal rounded-xl shadow-card transition-all">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center">
          <div className="p-3 bg-teal-50 text-brand-teal rounded-full mb-3">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Upload Financial Document for Extraction
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Supports PDF, JPG, JPEG, and PNG (Up to 10MB). Document will be extracted using Google Gemini Flash.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-brand-teal"
            >
              <option value="tax_invoice">Tax Invoice</option>
              <option value="purchase_order">Purchase Order (PO)</option>
              <option value="grn">Goods Receipt Note (GRN)</option>
              <option value="delivery_acknowledgement">Delivery Acknowledgement</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="credit_note">Credit Note</option>
              <option value="debit_note">Debit Note</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
              <UploadCloud className="w-4 h-4 text-brand-aqua" />
              <span>{isUploading ? 'Extracting with AI...' : 'Choose File to Upload'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
            <span>AI extracts line items, quantities, and GST. Human confirmation is always required.</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name or type..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:border-brand-teal outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredDocs.length}</span> documents
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-brand-border text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Extraction Status</th>
                <th className="px-4 py-3">AI Confidence</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No documents found. Upload a PO, GRN, or invoice above.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const statusProps = getStatusBadgeProps(doc.extractionStatus);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-brand-teal shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-800">{doc.originalName}</div>
                            <div className="text-[10px] text-slate-400">
                              {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize font-medium text-slate-700">
                        {doc.documentType.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusProps.className}`}>
                          {statusProps.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand-teal h-full rounded-full"
                              style={{ width: `${doc.confidenceScore}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {doc.confidenceScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openDocumentDetail(doc)}
                          className="px-2.5 py-1 text-xs font-medium text-brand-teal bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors"
                        >
                          Inspect & Edit
                        </button>
                        {doc.extractionStatus !== 'confirmed' && (
                          <button
                            onClick={() => handleConfirmDocument(doc.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-brand-teal hover:bg-brand-teal/90 rounded transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review & Field Editor Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-brand-primary-navy">
                  Document Extraction Review: {selectedDoc.originalName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Confidence: {selectedDoc.confidenceScore}% &bull; Type: {selectedDoc.documentType.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Human Approval Required:</strong> You can edit any extracted value below. Once confirmed, this document will be recorded into the verified financial ledger.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Document / Invoice Number</label>
                  <input
                    type="text"
                    value={editFields.documentNumber}
                    onChange={(e) => setEditFields({ ...editFields, documentNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Counterparty Name</label>
                  <input
                    type="text"
                    value={editFields.counterpartyName}
                    onChange={(e) => setEditFields({ ...editFields, counterpartyName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Counterparty GSTIN</label>
                  <input
                    type="text"
                    value={editFields.counterpartyGstin}
                    onChange={(e) => setEditFields({ ...editFields, counterpartyGstin: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Issue Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={editFields.issueDate}
                    onChange={(e) => setEditFields({ ...editFields, issueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Due Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={editFields.dueDate}
                    onChange={(e) => setEditFields({ ...editFields, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Grand Total (₹)</label>
                  <input
                    type="number"
                    value={editFields.grandTotalRupees}
                    onChange={(e) => setEditFields({ ...editFields, grandTotalRupees: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg font-bold text-brand-primary-navy outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              {/* Extracted line items preview */}
              {selectedDoc.extractedData?.fields?.lineItems && (
                <div className="mt-4 border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-slate-800 mb-2">Extracted Line Items</div>
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-1.5">Description</th>
                        <th className="p-1.5">HSN</th>
                        <th className="p-1.5">Qty</th>
                        <th className="p-1.5">Unit Price</th>
                        <th className="p-1.5">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDoc.extractedData.fields.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 font-medium">{item.description}</td>
                          <td className="p-1.5 text-slate-500">{item.hsnSac || '—'}</td>
                          <td className="p-1.5">{item.quantity} {item.unit}</td>
                          <td className="p-1.5">{formatINR(item.unitPricePaise)}</td>
                          <td className="p-1.5 font-bold">{formatINR(item.totalAmountPaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={handleSaveFields}
                disabled={isSavingFields}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
              >
                {isSavingFields ? 'Saving...' : 'Save Edited Fields'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDocument(selectedDoc.id)}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-xs"
                >
                  Confirm & Commit to Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
