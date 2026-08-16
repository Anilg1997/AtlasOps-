import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ActivityService]
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch activity with only the provided query params', () => {
    service.getActivity({ entityType: 'ORDER', eventType: 'ORDER_CREATED', limit: 25 }).subscribe();

    const req = httpMock.expectOne(req => req.url === '/api/v1/activity' && req.method === 'GET');
    expect(req.request.params.get('entityType')).toBe('ORDER');
    expect(req.request.params.get('eventType')).toBe('ORDER_CREATED');
    expect(req.request.params.get('limit')).toBe('25');
    expect(req.request.params.has('entityId')).toBeFalse();
    req.flush([]);
  });

  it('should omit params that are not set', () => {
    service.getActivity().subscribe();

    const req = httpMock.expectOne(req => req.url === '/api/v1/activity' && req.method === 'GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('should fetch activity stats', () => {
    const stats = { totalEntries: 42, totalOrders: 10, totalInvoices: 5, totalPayments: 3 };
    service.getStats().subscribe(result => {
      expect(result).toEqual(stats);
    });

    const req = httpMock.expectOne('/api/v1/activity/stats');
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });
});
