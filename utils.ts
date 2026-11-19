import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer paise into Indian Numbering currency string.
 * Example: 50000000 -> "₹5,00,000.00"
 */
export function formatINR(paise: number = 0): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  const paiseStr = remainingPaise.toString().padStart(2, '0');
  let rupeeStr = rupees.toString();

  if (rupeeStr.length > 3) {
    const lastThree = rupeeStr.substring(rupeeStr.length - 3);
    const otherNumbers = rupeeStr.substring(0, rupeeStr.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    rupeeStr = `${formattedOthers},${lastThree}`;
  }

  const sign = isNegative ? '-' : '';
  return `${sign}₹${rupeeStr}.${paiseStr}`;
}

/**
 * Convert standard Rupee number to paise integer.
 */
export function rupeesToPaise(rupees: number = 0): number {
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to Rupee float.
 */
export function paiseToRupees(paise: number = 0): number {
  return paise / 100;
}

/**
 * Format Date to standard Indian business format: "DD MMM YYYY"
 * Example: "2026-02-15" -> "15 Feb 2026"
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Get visual styling badge classes for financial statuses.
 */
export function getStatusBadgeProps(status: string): { label: string; className: string } {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'paid':
    case 'verified':
    case 'matched':
    case 'approved':
    case 'confirmed':
    case 'on_time':
      return {
        label: s.replace('_', ' ').toUpperCase(),
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'partially_paid':
    case 'partially_matched':
    case 'minor_difference':
    case 'due_soon':
    case 'occasionally_late':
      return {
        label: s.replace('_', ' ').toUpperCase(),
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'open':
    case 'suggested':
    case 'extracted':
    case 'issued':
      return {
        label: s.replace('_', ' ').toUpperCase(),
        className: 'bg-teal-50 text-teal-700 border-teal-200',
      };
    case 'overdue':
    case 'mismatch':
    case 'disputed':
    case 'high_risk':
    case 'frequently_late':
    case 'critical':
      return {
        label: s.replace('_', ' ').toUpperCase(),
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'needs_review':
    case 'pending_review':
    case 'missing_document':
      return {
        label: s.replace('_', ' ').toUpperCase(),
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'draft':
    case 'unmatched':
    case 'uploaded':
    case 'insufficient_history':
    default:
      return {
        label: s.replace('_', ' ').toUpperCase(),
        className: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Copy string to clipboard with navigator fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
