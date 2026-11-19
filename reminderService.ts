// Payment Reminder Drafting Service
// Generates personalized drafts with 4 tones: Friendly, Professional, Firm, Final Notice

import { Invoice, Customer } from '../types/index.js';
import { calculateDaysDifference, formatINR } from './financialEngine.js';

export type ReminderTone = 'friendly' | 'professional' | 'firm' | 'final_notice';

export interface GeneratedReminderDraft {
  tone: ReminderTone;
  subject: string;
  messageBody: string;
  daysOverdue: number;
  amountDueStr: string;
}

export function generatePaymentReminderDraft(
  invoice: Invoice,
  customer: Customer,
  tone: ReminderTone = 'professional',
  referenceDateStr?: string
): GeneratedReminderDraft {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  const daysOverdue = Math.max(0, calculateDaysDifference(invoice.dueDate, today));
  const amountDueStr = formatINR(invoice.outstandingAmountPaise);

  let subject = '';
  let messageBody = '';

  switch (tone) {
    case 'friendly':
      subject = `Friendly Reminder: Invoice #${invoice.invoiceNumber} from Apex Components`;
      messageBody = `Dear ${customer.name},\n\n` +
        `We hope this email finds you well.\n\n` +
        `This is a gentle reminder that Invoice #${invoice.invoiceNumber} for the amount of ${amountDueStr} was due on ${invoice.dueDate}${daysOverdue > 0 ? ` (${daysOverdue} days ago)` : ''}.\n\n` +
        `If payment has already been initiated, please accept our thanks and disregard this note. Otherwise, we would appreciate it if you could confirm the expected settlement date.\n\n` +
        `Bank Details for NEFT/RTGS:\n` +
        `Account Name: Apex Components Pvt Ltd\n` +
        `Account Number: 924020018892341\n` +
        `IFSC Code: HDFC0000123\n\n` +
        `Warm regards,\nFinance & Accounts Team\nApex Components`;
      break;

    case 'professional':
      subject = `Payment Follow-up: Invoice #${invoice.invoiceNumber} - ${amountDueStr} Due`;
      messageBody = `Dear ${customer.name},\n\n` +
        `We are writing to follow up on the payment for Invoice #${invoice.invoiceNumber}, dated ${invoice.issueDate}, with a total outstanding balance of ${amountDueStr}.\n\n` +
        `As per our agreed payment terms, the payment was due on ${invoice.dueDate} and is now ${daysOverdue} day(s) overdue.\n\n` +
        `Please arrange for the remittance at your earliest convenience or share the transaction UTR number if already processed.\n\n` +
        `Should you have any queries regarding this invoice, please do not hesitate to contact our accounts department.\n\n` +
        `Sincerely,\nFinance Department\nApex Components`;
      break;

    case 'firm':
      subject = `Urgent: Overdue Payment Notice - Invoice #${invoice.invoiceNumber}`;
      messageBody = `Attention: Accounts Payable, ${customer.name}\n\n` +
        `Our records indicate that Invoice #${invoice.invoiceNumber} for the amount of ${amountDueStr} is currently ${daysOverdue} days overdue (Original due date: ${invoice.dueDate}).\n\n` +
        `Despite prior communications, we have not yet received confirmation of payment. Continued delay may impact future credit terms and pending dispatches.\n\n` +
        `We request you to prioritize this settlement within the next 48 hours and provide the payment UTR reference.\n\n` +
        `Regards,\nCredit Control Team\nApex Components`;
      break;

    case 'final_notice':
      subject = `FINAL NOTICE: Immediate Settlement Required - Invoice #${invoice.invoiceNumber}`;
      messageBody = `LEGAL & CREDIT CONTROL NOTICE\n\n` +
        `To: Management / Accounts Payable, ${customer.name}\n\n` +
        `This is a formal final notice regarding unpaid Invoice #${invoice.invoiceNumber} amounting to ${amountDueStr}, which is now ${daysOverdue} days past due date (${invoice.dueDate}).\n\n` +
        `Unless full payment is credited to our account within 3 business days, we will be compelled to suspend credit privileges, report default to MSME Samadhaan under the MSMED Act, 2006, and initiate formal recovery proceedings.\n\n` +
        `Please remit ${amountDueStr} immediately to prevent escalation.\n\n` +
        `Apex Components Finance & Legal Cell`;
      break;
  }

  return {
    tone,
    subject,
    messageBody,
    daysOverdue,
    amountDueStr,
  };
}
