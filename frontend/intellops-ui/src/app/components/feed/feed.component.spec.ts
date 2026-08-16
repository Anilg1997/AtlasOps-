import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FeedComponent } from './feed.component';
import { ActivityService, ActivityEntry, ActivityStats } from '../../services/activity.service';

describe('FeedComponent', () => {
  let fixture: ComponentFixture<FeedComponent>;
  let component: FeedComponent;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;

  const mockEntries: ActivityEntry[] = [
    {
      id: '1',
      eventType: 'ORDER_CREATED',
      source: 'order-service',
      entityId: 'ORD-1001',
      entityType: 'ORDER',
      details: { status: 'PENDING', totalAmount: '199.00' },
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      eventType: 'PAYMENT_RECEIVED',
      source: 'billing-service',
      entityId: 'INV-5001',
      entityType: 'INVOICE',
      details: {},
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ];

  const mockStats: ActivityStats = {
    totalEntries: 42,
    totalOrders: 20,
    totalInvoices: 15,
    totalPayments: 7
  };

  beforeEach(async () => {
    activityServiceSpy = jasmine.createSpyObj('ActivityService', ['getActivity', 'getStats']);
    activityServiceSpy.getActivity.and.returnValue(of(mockEntries));
    activityServiceSpy.getStats.and.returnValue(of(mockStats));

    await TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [
        provideRouter([]),
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load entries and stats on init', () => {
    fixture.detectChanges();
    expect(activityServiceSpy.getActivity).toHaveBeenCalled();
    expect(activityServiceSpy.getStats).toHaveBeenCalled();
    expect(component.entries.length).toBe(2);
    expect(component.stats?.totalEntries).toBe(42);
  });

  it('should render timeline entries with labels and entity ids', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.timeline-item').length).toBe(2);
    expect(compiled.textContent).toContain('Order Created');
    expect(compiled.textContent).toContain('Payment Received');
    expect(compiled.textContent).toContain('ORD-1001');
    expect(compiled.textContent).toContain('INV-5001');
  });

  it('should render stat values', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const values = Array.from(compiled.querySelectorAll('.stat-value')).map(el => el.textContent?.trim());
    expect(values[0]).toBe('42');
    expect(values[1]).toBe('20');
    expect(values[2]).toBe('15');
    expect(values[3]).toBe('7');
  });

  it('should link order entries to the order detail page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const orderLink = compiled.querySelector('a[href="/orders/ORD-1001"]');
    expect(orderLink).toBeTruthy();
    expect(orderLink?.textContent).toContain('ORD-1001');
  });

  it('should show the empty state when there is no activity', () => {
    activityServiceSpy.getActivity.and.returnValue(of([]));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')?.textContent).toContain('No activity yet');
  });

  it('should reload with the selected filters', () => {
    fixture.detectChanges();
    component.entityType = 'ORDER';
    component.eventType = 'ORDER_CREATED';
    component.load();
    expect(activityServiceSpy.getActivity).toHaveBeenCalledWith(
      jasmine.objectContaining({ entityType: 'ORDER', eventType: 'ORDER_CREATED', limit: 50 })
    );
  });

  it('should exclude entity identity keys from detail chips', () => {
    const entry: ActivityEntry = {
      id: '3',
      eventType: 'ORDER_STATUS_CHANGED',
      source: 'order-service',
      entityId: 'ORD-1002',
      entityType: 'ORDER',
      details: {
        orderNumber: 'ORD-1002',
        status: 'CONFIRMED',
        totalAmount: '299.00',
        timestamp: '2026-01-01T00:00:00Z'
      },
      timestamp: new Date().toISOString()
    };
    const chips = component.detailChips(entry);
    const keys = chips.map(c => c.key);
    expect(keys).toContain('status');
    expect(keys).toContain('totalAmount');
    expect(keys).not.toContain('orderNumber');
    expect(keys).not.toContain('timestamp');
  });
});
