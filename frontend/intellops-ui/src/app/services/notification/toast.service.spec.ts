import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no active toasts', () => {
    expect(service.activeToasts().length).toBe(0);
  });

  it('should add a success toast', () => {
    service.success('Done', 'Operation completed');
    const toasts = service.activeToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Done');
    expect(toasts[0].message).toBe('Operation completed');
  });

  it('should add error, warning and info toasts with correct types', () => {
    service.error('Oops', 'Something broke');
    service.warning('Careful', 'Watch out');
    service.info('FYI', 'Just so you know');

    const toasts = service.activeToasts();
    expect(toasts.map(t => t.type)).toEqual(['error', 'warning', 'info']);
  });

  it('should remove a toast by id', () => {
    service.info('Temp', 'Remove me', 0);
    const [toast] = service.activeToasts();
    service.remove(toast.id);
    expect(service.activeToasts().length).toBe(0);
  });

  it('should auto-dismiss after the duration', (done) => {
    service.info('Short', 'Goes away', 20);
    expect(service.activeToasts().length).toBe(1);
    setTimeout(() => {
      expect(service.activeToasts().length).toBe(0);
      done();
    }, 60);
  });

  it('should keep a toast with zero duration until removed', () => {
    service.info('Sticky', 'Stays', 0);
    expect(service.activeToasts().length).toBe(1);
  });
});
