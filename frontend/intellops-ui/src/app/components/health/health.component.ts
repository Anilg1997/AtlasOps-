import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ServiceHealth {
  name: string;
  port: number;
  url: string;
  status: 'UP' | 'DOWN' | 'CHECKING';
  icon: string;
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-heartbeat"></i> System Health</h1>
          <p>Real-time monitoring of all microservices</p>
        </div>
        <button class="btn btn-secondary" (click)="checkAll()"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>

      <div class="health-grid">
        <div class="health-card" *ngFor="let svc of services" [ngClass]="svc.status.toLowerCase()">
          <div class="status-indicator" [ngClass]="svc.status.toLowerCase()"></div>
          <div class="svc-info">
            <h3><i [class]="svc.icon"></i> {{ svc.name }}</h3>
            <p>Port {{ svc.port }}</p>
          </div>
          <span class="status-badge" [ngClass]="svc.status.toLowerCase()">
            <i [class]="svc.status === 'UP' ? 'fas fa-check-circle' : svc.status === 'DOWN' ? 'fas fa-times-circle' : 'fas fa-spinner fa-spin'"></i>
            {{ svc.status }}
          </span>
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <h3><i class="fas fa-info-circle"></i> Infrastructure</h3>
        <div class="infra-grid">
          <div class="infra-item"><i class="fas fa-database" style="color: #336791;"></i><span>PostgreSQL 16</span><span class="port">:5432</span></div>
          <div class="infra-item"><i class="fas fa-database" style="color: #47A248;"></i><span>MongoDB 7</span><span class="port">:27017</span></div>
          <div class="infra-item"><i class="fas fa-database" style="color: #F80000;"></i><span>Oracle XE</span><span class="port">:1521</span></div>
          <div class="infra-item"><i class="fas fa-stream" style="color: #231F20;"></i><span>Apache Kafka</span><span class="port">:9092</span></div>
          <div class="infra-item"><i class="fas fa-brain" style="color: #000;"></i><span>Ollama (LLM)</span><span class="port">:11434</span></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: var(--gray-500); font-size: 0.875rem; }
    .health-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .health-card { display: flex; align-items: center; gap: 1rem; background: white; padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow); border-left: 4px solid var(--gray-300);
      &.up { border-left-color: var(--success); }
      &.down { border-left-color: var(--danger); }
      &.checking { border-left-color: var(--warning); } }
    .status-indicator { width: 12px; height: 12px; border-radius: 50%; background: var(--gray-300);
      &.up { background: var(--success); box-shadow: 0 0 8px rgba(16,185,129,0.4); }
      &.down { background: var(--danger); }
      &.checking { background: var(--warning); animation: pulse 1.5s infinite; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .svc-info { flex: 1; h3 { font-size: 0.9375rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; } p { font-size: 0.8125rem; color: var(--gray-500); } }
    .status-badge { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;
      &.up { background: #d1fae5; color: #065f46; }
      &.down { background: #fee2e2; color: #991b1b; }
      &.checking { background: #fef3c7; color: #92400e; } }
    .card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .infra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .infra-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); font-size: 0.875rem;
      .port { font-family: monospace; color: var(--gray-500); font-size: 0.8125rem; } }
  `]
})
export class HealthComponent implements OnInit {
  services: ServiceHealth[] = [
    { name: 'Auth Service', port: 8080, url: 'http://localhost:8080/api/actuator/health', status: 'CHECKING', icon: 'fas fa-shield-alt' },
    { name: 'Order Service', port: 8081, url: 'http://localhost:8081/api/actuator/health', status: 'CHECKING', icon: 'fas fa-receipt' },
    { name: 'Inventory Service', port: 8082, url: 'http://localhost:8082/api/actuator/health', status: 'CHECKING', icon: 'fas fa-boxes-stacked' },
    { name: 'AI Co-Pilot', port: 8083, url: 'http://localhost:8083/api/v1/copilot/health', status: 'CHECKING', icon: 'fas fa-robot' },
    { name: 'Billing Service', port: 8084, url: 'http://localhost:8084/api/actuator/health', status: 'CHECKING', icon: 'fas fa-file-invoice-dollar' },
    { name: 'Notification/Activity', port: 8085, url: 'http://localhost:8085/actuator/health', status: 'CHECKING', icon: 'fas fa-stream' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.checkAll(); }

  checkAll() {
    this.services.forEach(svc => {
      svc.status = 'CHECKING';
      this.http.get(svc.url, { responseType: 'text' }).subscribe({
        next: () => svc.status = 'UP',
        error: () => svc.status = 'DOWN'
      });
    });
  }
}
