import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { AuthService, User } from '../../services/auth.service';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let component: LayoutComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: 1,
    email: 'ops@intellops.dev',
    firstName: 'Ops',
    lastName: 'User',
    fullName: 'Ops User',
    role: 'OPS_ADMIN'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    authServiceSpy.user = signal<User | null>(mockUser) as any;

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand, nav links, and user name', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('IntelliOps');
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Orders');
    expect(compiled.textContent).toContain('AI Co-Pilot');
    expect(compiled.textContent).toContain('Inventory');
    expect(compiled.textContent).toContain('Billing');
    expect(compiled.textContent).toContain('Activity Feed');
    expect(compiled.textContent).toContain('Health');
    expect(compiled.textContent).toContain('Ops User');
  });

  it('should link to the feed page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/feed"]')).toBeTruthy();
  });

  it('should logout when the logout button is clicked', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const logoutBtn = Array.from(buttons).find(b => b.textContent?.includes('Logout'));
    expect(logoutBtn).toBeTruthy();
    logoutBtn?.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should fall back to a generic user label when no user is set', () => {
    authServiceSpy.user = signal<User | null>(null) as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-name')?.textContent).toContain('User');
  });
});
