import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../services/notification/toast.service';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nothing when there are no toasts', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.toast').length).toBe(0);
  });

  it('should render an active toast with title and message', () => {
    toastService.success('Saved', 'Your changes were saved');
    fixture.detectChanges();

    const toastEl = fixture.nativeElement.querySelector('.toast') as HTMLElement;
    expect(toastEl).toBeTruthy();
    expect(toastEl.classList.contains('success')).toBeTrue();
    expect(toastEl.textContent).toContain('Saved');
    expect(toastEl.textContent).toContain('Your changes were saved');
  });

  it('should remove a toast when its close button is clicked', () => {
    toastService.success('Closable', 'Click the X');
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.toast-close') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.toast').length).toBe(0);
  });
});
