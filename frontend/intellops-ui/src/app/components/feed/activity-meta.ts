import { ActivityEntry } from '../../services/activity.service';

export interface EventMeta {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const EVENT_META: Record<string, EventMeta> = {
  ORDER_CREATED: { label: 'Order Created', icon: 'fa-receipt', color: '#2563eb', bg: '#dbeafe' },
  ORDER_STATUS_CHANGED: { label: 'Order Status Changed', icon: 'fa-arrows-rotate', color: '#7c3aed', bg: '#ede9fe' },
  ORDER_CANCELLED: { label: 'Order Cancelled', icon: 'fa-ban', color: '#dc2626', bg: '#fee2e2' },
  INVOICE_CREATED: { label: 'Invoice Created', icon: 'fa-file-invoice-dollar', color: '#9333ea', bg: '#f3e8ff' },
  INVOICE_PAID: { label: 'Invoice Paid', icon: 'fa-circle-check', color: '#059669', bg: '#d1fae5' },
  INVOICE_OVERDUE: { label: 'Invoice Overdue', icon: 'fa-exclamation-triangle', color: '#d97706', bg: '#fef3c7' },
  PAYMENT_RECEIVED: { label: 'Payment Received', icon: 'fa-credit-card', color: '#059669', bg: '#d1fae5' },
  PAYMENT_FAILED: { label: 'Payment Failed', icon: 'fa-xmark-circle', color: '#dc2626', bg: '#fee2e2' },
  BILLING_ACCOUNT_CHANGED: { label: 'Account Updated', icon: 'fa-user-gear', color: '#ea580c', bg: '#ffedd5' }
};

export const ENTITY_ICONS: Record<string, string> = {
  ORDER: 'fa-receipt',
  INVOICE: 'fa-file-invoice-dollar',
  PAYMENT: 'fa-credit-card',
  ACCOUNT: 'fa-user'
};

export function eventMeta(eventType: string): EventMeta {
  return EVENT_META[eventType]
    || EVENT_META[`${eventType.split('_')[0]}_CREATED`]
    || {
      label: humanize(eventType),
      icon: 'fa-circle-info',
      color: 'var(--gray-600)',
      bg: 'var(--gray-100)'
    };
}

export function entityIcon(entityType: string): string {
  return ENTITY_ICONS[entityType] || 'fa-hashtag';
}

/** Router link for an entry's entity, or null when there's nowhere to navigate. */
export function entityRoute(entry: ActivityEntry): string[] | null {
  if (!entry.entityId) return null;
  if (entry.entityType === 'ORDER') return ['/orders', entry.entityId];
  if (entry.entityType === 'INVOICE' || entry.entityType === 'PAYMENT' || entry.entityType === 'ACCOUNT') {
    return ['/billing'];
  }
  return null;
}

export function relativeTime(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function humanize(s: string): string {
  return s
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
