import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, AuthResponse, AuthUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

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

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should be created and report no stored user initially', () => {
    expect(service).toBeTruthy();
    expect(service.user()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('should login and persist the token and user', () => {
    service.login('ops', 'secret123').subscribe(res => {
      expect(res.accessToken).toBe('jwt-token');
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'ops', password: 'secret123' });
    req.flush(mockAuthResponse);

    expect(service.getToken()).toBe('jwt-token');
    expect(service.user()?.firstName).toBe('Ops');
  });

  it('should register and persist the token and user', () => {
    const payload = { username: 'newuser', email: 'new@intellops.dev', password: 'secret123', firstName: 'New', lastName: 'Hire' };
    service.register(payload).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockAuthResponse);

    expect(service.getToken()).toBe('jwt-token');
    expect(service.user()?.email).toBe('ops@intellops.dev');
  });

  it('should restore the stored user from localStorage on construction', () => {
    localStorage.setItem('shop_user', JSON.stringify(mockUser));
    localStorage.setItem('shop_token', 'stored-token');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }]
    });
    const restored = TestBed.inject(AuthService);

    expect(restored.user()?.firstName).toBe('Ops');
    expect(restored.getToken()).toBe('stored-token');
  });

  it('should ignore corrupt stored user JSON', () => {
    localStorage.setItem('shop_user', '{not valid json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }]
    });
    const restored = TestBed.inject(AuthService);

    expect(restored.user()).toBeNull();
    expect(localStorage.getItem('intellops_user')).toBeNull();
  });

  it('should logout, clear storage, and navigate to login', () => {
    localStorage.setItem('shop_token', 't');
    localStorage.setItem('shop_refresh', 'r');
    localStorage.setItem('shop_user', JSON.stringify(mockUser));

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('shop_refresh')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should fetch the profile and update the current user', () => {
    service.getProfile().subscribe(user => {
      expect(user.id).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    expect(service.user()?.firstName).toBe('Ops');
    expect(localStorage.getItem('shop_user')).toBeTruthy();
  });
});
