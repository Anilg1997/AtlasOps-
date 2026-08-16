import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { OrderService } from '../../services/order.service';
import { ActivityService } from '../../services/activity.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;

  beforeEach(async () => {
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['getStats', 'getOrders']);
    orderServiceSpy.getStats.and.returnValue(of({
      totalOrders: 10,
      totalRevenue: 5000,
      pendingOrders: 2,
      deliveredOrders: 3
    }));
    orderServiceSpy.getOrders.and.returnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0
    }));

    activityServiceSpy = jasmine.createSpyObj('ActivityService', ['getActivity', 'getStats']);
    activityServiceSpy.getActivity.and.returnValue(of([]));
    activityServiceSpy.getStats.and.returnValue(of({
      totalEntries: 0,
      totalOrders: 0,
      totalInvoices: 0,
      totalPayments: 0
    }));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load order stats and recent orders on init', () => {
    fixture.detectChanges();
    expect(orderServiceSpy.getStats).toHaveBeenCalled();
    expect(orderServiceSpy.getOrders).toHaveBeenCalledWith(0, 5);
  });

  it('should render the recent-activity widget', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-recent-activity')).toBeTruthy();
    expect(compiled.textContent).toContain('Recent Activity');
  });

  it('should compute fulfillment rate from stats', () => {
    component.stats = { totalOrders: 10, deliveredOrders: 3 };
    expect(component.getFulfillmentRate()).toBe(30);
  });

  it('should compute average order value from stats', () => {
    component.stats = { totalOrders: 10, totalRevenue: 5000 };
    expect(component.getAvgOrderValue()).toBe('500.00');
  });
});
