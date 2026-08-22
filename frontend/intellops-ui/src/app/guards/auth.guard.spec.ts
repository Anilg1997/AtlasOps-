import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceStub: { isAuthenticated: jasmine.Spy };

  const fakeRoute = {} as ActivatedRouteSnapshot;
  const fakeState = { url: '/orders' } as RouterStateSnapshot;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceStub = { isAuthenticated: jasmine.createSpy('isAuthenticated') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceStub }
      ]
    });
  });

  it('should allow navigation when the user is authenticated', () => {
    authServiceStub.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login with the returnUrl when not authenticated', () => {
    authServiceStub.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
