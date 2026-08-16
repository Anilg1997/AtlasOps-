import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HealthComponent } from './health.component';

describe('HealthComponent', () => {
  let fixture: ComponentFixture<HealthComponent>;
  let component: HealthComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HealthComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track all six backend services', () => {
    expect(component.services.length).toBe(6);
    const ports = component.services.map(s => s.port);
    expect(ports).toEqual([8080, 8081, 8082, 8083, 8084, 8085]);
  });

  it('should check all services on init and mark them up', () => {
    fixture.detectChanges();

    component.services.forEach(svc => {
      httpMock.expectOne(svc.url).flush('ok');
    });

    component.services.forEach(svc => {
      expect(svc.status).toBe('UP');
    });
  });

  it('should mark services down when the health call fails', () => {
    fixture.detectChanges();

    component.services.forEach(svc => {
      httpMock.expectOne(svc.url).error(new ErrorEvent('boom'));
    });

    component.services.forEach(svc => {
      expect(svc.status).toBe('DOWN');
    });
  });

  it('should re-check services on refresh', () => {
    fixture.detectChanges();
    component.services.forEach(svc => httpMock.expectOne(svc.url).flush('ok'));

    component.checkAll();
    component.services.forEach(svc => expect(svc.status).toBe('CHECKING'));
    component.services.forEach(svc => httpMock.expectOne(svc.url).flush('ok'));
    component.services.forEach(svc => expect(svc.status).toBe('UP'));
  });
});
