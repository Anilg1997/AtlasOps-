import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, AuthResponse, AuthUser } from '../../../services/auth.service';
import { ToastService } from '../../../services/notification/toast.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastService: ToastService;
  let router: Router;

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

  const mockAuthResponse: AuthResponse = {
    ...mockUser,
    accessToken: 'jwt-token',
    refreshToken: 'refresh-token'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to dashboard on successful login and show a success toast', () => {
    const navigateByUrlSpy = spyOn(router, 'navigateByUrl');
    authServiceSpy.login.and.returnValue(of(mockAuthResponse));
    const toastSpy = spyOn(toastService, 'success');

    component.email = 'ops@intellops.dev';
    component.password = 'secret123';
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('ops@intellops.dev', 'secret123');
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/dashboard');
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Signed in', jasmine.any(String));
  });

  it('should respect a returnUrl query param', () => {
    const navigateByUrlSpy = spyOn(router, 'navigateByUrl');
    authServiceSpy.login.and.returnValue(of(mockAuthResponse));

    // Simulate arriving with ?returnUrl=/feed: stub the query params the
    // component reads from its activated route snapshot.
    Object.defineProperty(component, 'route', {
      value: { snapshot: { queryParams: { returnUrl: '/feed' } } }
    });

    component.onSubmit();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/feed');
  });

  it('should surface the error and show an error toast on failed login', () => {
    const navigateByUrlSpy = spyOn(router, 'navigateByUrl');
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Bad credentials' } })));
    const toastSpy = spyOn(toastService, 'error');

    component.onSubmit();

    expect(component.error).toBe('Bad credentials');
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Sign-in failed', 'Bad credentials');
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('should fall back to a generic message when the error has no message', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({})));
    const toastSpy = spyOn(toastService, 'error');

    component.onSubmit();

    expect(component.error).toBe('Invalid email or password');
    expect(toastSpy).toHaveBeenCalledWith('Sign-in failed', 'Invalid email or password');
  });

  it('should render the email, password, and submit button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input#email')).toBeTruthy();
    expect(compiled.querySelector('input#password')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
  });
});
