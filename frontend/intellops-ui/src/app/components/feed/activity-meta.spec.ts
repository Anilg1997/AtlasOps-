import { eventMeta, entityIcon, entityRoute, relativeTime, humanize } from './activity-meta';
import { ActivityEntry } from '../../services/activity.service';

describe('activity-meta helpers', () => {
  describe('eventMeta', () => {
    it('returns the known metadata for a registered event type', () => {
      const meta = eventMeta('ORDER_CREATED');
      expect(meta.label).toBe('Order Created');
      expect(meta.icon).toBe('fa-receipt');
    });

    it('falls back to the prefix family for an unregistered variant', () => {
      const meta = eventMeta('ORDER_FULFILLED');
      expect(meta.label).toBe('Order Created');
      expect(meta.icon).toBe('fa-receipt');
    });

    it('returns a generic label for completely unknown event types', () => {
      const meta = eventMeta('SOMETHING_WEIRD');
      expect(meta.label).toBe('Something Weird');
      expect(meta.icon).toBe('fa-circle-info');
    });
  });

  describe('entityIcon', () => {
    it('maps known entity types to icons', () => {
      expect(entityIcon('ORDER')).toBe('fa-receipt');
      expect(entityIcon('INVOICE')).toBe('fa-file-invoice-dollar');
      expect(entityIcon('PAYMENT')).toBe('fa-credit-card');
      expect(entityIcon('ACCOUNT')).toBe('fa-user');
    });

    it('falls back for unknown entity types', () => {
      expect(entityIcon('UNKNOWN')).toBe('fa-hashtag');
    });
  });

  describe('entityRoute', () => {
    const entry = (entityType: string, entityId?: string): ActivityEntry => ({
      id: '1',
      eventType: 'ORDER_CREATED',
      source: 'order-service',
      entityId: entityId || '',
      entityType,
      details: {},
      timestamp: new Date().toISOString()
    });

    it('links orders to their detail page', () => {
      expect(entityRoute(entry('ORDER', 'ORD-1001'))).toEqual(['/orders', 'ORD-1001']);
    });

    it('links invoices, payments and accounts to billing', () => {
      expect(entityRoute(entry('INVOICE', 'INV-1'))).toEqual(['/billing']);
      expect(entityRoute(entry('PAYMENT', 'PAY-1'))).toEqual(['/billing']);
      expect(entityRoute(entry('ACCOUNT', 'ACC-1'))).toEqual(['/billing']);
    });

    it('returns null when there is no entity id or known type', () => {
      expect(entityRoute(entry('ORDER'))).toBeNull();
      expect(entityRoute(entry('UNKNOWN', 'X-1'))).toBeNull();
    });
  });

  describe('relativeTime', () => {
    it('handles empty input', () => {
      expect(relativeTime('')).toBe('');
    });

    it('reports just now for recent timestamps', () => {
      expect(relativeTime(new Date().toISOString())).toBe('just now');
    });

    it('reports minutes for the last hour', () => {
      const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(relativeTime(past)).toBe('5m ago');
    });

    it('reports hours for the last day', () => {
      const past = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(relativeTime(past)).toBe('3h ago');
    });

    it('reports days beyond 24h', () => {
      const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTime(past)).toBe('2d ago');
    });
  });

  describe('humanize', () => {
    it('turns snake_case into title case', () => {
      expect(humanize('ORDER_STATUS_CHANGED')).toBe('Order Status Changed');
    });
  });
});
