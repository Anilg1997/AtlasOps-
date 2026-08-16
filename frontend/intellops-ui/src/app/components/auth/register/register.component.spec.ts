import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService, AuthResponse, User } from '../../../services/auth.service';
import { ToastService } from '../../../services/notification/toast.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastService: ToastService;
  let router: Router;

  const mockUser: User = {
    id: 2,
    email: 'new@intellops.dev',
    firstName: 'New',
    lastName: 'Hire',
    fullName: 'New Hire',
    role: 'OPS_USER'
  };

  const mockAuthResponse: AuthResponse = {
    token: 'jwt-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: mockUser
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the success page and show a success toast on registration', () => {
    const navigateSpy = spyOn(router, 'navigate');
    authServiceSpy.register.and.returnValue(of(mockAuthResponse));
    const toastSpy = spyOn(toastService, 'success');

    component.firstName = 'New';
    component.lastName = 'Hire';
    component.email = 'new@intellops.dev';
    component.password = 'secret123';
    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      email: 'new@intellops.dev',
      password: 'secret123',
      firstName: 'New',
      lastName: 'Hire'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/register/success']);
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Account created', jasmine.any(String));
  });

  it('should surface the error and show an error toast on failed registration', () => {
    const navigateSpy = spyOn(router, 'navigate');
    authServiceSpy.register.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
    const toastSpy = spyOn(toastService, 'error');

    component.onSubmit();

    expect(component.error).toBe('Email already exists');
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Registration failed', 'Email already exists');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should fall back to a generic message when the error has no message', () => {
    authServiceSpy.register.and.returnValue(throwError(() => ({})));
    const toastSpy = spyOn(toastService, 'error');

    component.onSubmit();

    expect(component.error).toBe('Registration failed');
    expect(toastSpy).toHaveBeenCalledWith('Registration failed', 'Registration failed');
  });

  it('should render all form fields', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input#firstName')).toBeTruthy();
    expect(compiled.querySelector('input#lastName')).toBeTruthy();
    expect(compiled.querySelector('input#email')).toBeTruthy();
    expect(compiled.querySelector('input#password')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
  });
});
