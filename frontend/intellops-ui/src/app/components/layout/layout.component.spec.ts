import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { AuthService, AuthUser } from '../../services/auth.service';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let component: LayoutComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser: AuthUser = {
    id: 1,
    username: 'ops',
    email: 'ops@intellops.dev',
    firstName: 'Ops',
    lastName: 'User',
    gender: 'male',
    image: '',
    role: 'admin'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    authServiceSpy.user = signal<AuthUser | null>(mockUser) as any;

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
    expect(compiled.textContent).toContain('ShopHub');
    expect(compiled.textContent).toContain('Home');
    expect(compiled.textContent).toContain('Products');
    expect(compiled.textContent).toContain('Categories');
    expect(compiled.textContent).toContain('AI Agent');
    expect(compiled.textContent).toContain('Ops');
  });

  it('should link to the home page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/home"]')).toBeTruthy();
  });

  it('should logout when the sign out button is clicked', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const logoutBtn = Array.from(buttons).find(b => b.textContent?.includes('Sign Out'));
    expect(logoutBtn).toBeTruthy();
    logoutBtn?.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should hide user menu when no user is set', () => {
    authServiceSpy.user = signal<AuthUser | null>(null) as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-menu')).toBeNull();
  });
});
