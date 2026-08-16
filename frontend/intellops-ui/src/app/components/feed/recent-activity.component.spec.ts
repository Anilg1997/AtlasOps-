import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RecentActivityComponent } from './recent-activity.component';
import { ActivityService, ActivityEntry } from '../../services/activity.service';

describe('RecentActivityComponent', () => {
  let fixture: ComponentFixture<RecentActivityComponent>;
  let component: RecentActivityComponent;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;

  const mockEntries: ActivityEntry[] = [
    {
      id: '1',
      eventType: 'ORDER_CREATED',
      source: 'order-service',
      entityId: 'ORD-1001',
      entityType: 'ORDER',
      details: {},
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      eventType: 'INVOICE_PAID',
      source: 'billing-service',
      entityId: 'INV-5001',
      entityType: 'INVOICE',
      details: {},
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ];

  beforeEach(async () => {
    activityServiceSpy = jasmine.createSpyObj('ActivityService', ['getActivity']);
    activityServiceSpy.getActivity.and.returnValue(of(mockEntries));

    await TestBed.configureTestingModule({
      imports: [RecentActivityComponent],
      providers: [
        provideRouter([]),
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecentActivityComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the latest entries on init', () => {
    fixture.detectChanges();
    expect(activityServiceSpy.getActivity).toHaveBeenCalledWith(jasmine.objectContaining({ limit: 8 }));
    expect(component.entries.length).toBe(2);
  });

  it('should render activity items with labels and entity ids', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.activity-item').length).toBe(2);
    expect(compiled.textContent).toContain('Order Created');
    expect(compiled.textContent).toContain('Invoice Paid');
    expect(compiled.textContent).toContain('ORD-1001');
    expect(compiled.textContent).toContain('INV-5001');
  });

  it('should link order entities to the order detail page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/orders/ORD-1001"]')).toBeTruthy();
  });

  it('should link to the full feed page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/feed"]')?.textContent).toContain('View all');
  });

  it('should show the empty state when there is no activity', () => {
    activityServiceSpy.getActivity.and.returnValue(of([]));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')?.textContent).toContain('No activity yet');
  });
});
