import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ServiceHealth {
  name: string;
  port: number;
  url: string;
  status: 'UP' | 'DOWN' | 'CHECKING';
  icon: string;
  color: string;
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-heart-pulse"></i> System Health</h1>
          <p>Real-time monitoring of all microservices</p>
        </div>
        <button class="btn btn-secondary" (click)="checkAll()"><i class="fas fa-rotate"></i> Refresh</button>
      </div>

      <!-- Overall Status -->
      <div class="overall-status" [ngClass]="getOverallStatus()">
        <div class="overall-icon">
          <i class="fas" [ngClass]="getOverallStatus() === 'healthy' ? 'fa-circle-check' : getOverallStatus() === 'degraded' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'"></i>
        </div>
        <div class="overall-info">
          <h2>{{ getOverallStatus() === 'healthy' ? 'All Systems Operational' : getOverallStatus() === 'degraded' ? 'Degraded Performance' : 'System Issues Detected' }}</h2>
          <p>{{ getUpCount() }}/{{ services.length }} services are healthy</p>
        </div>
      </div>

      <!-- Services Grid -->
      <div class="health-grid">
        <div class="health-card" *ngFor="let svc of services" [ngClass]="svc.status.toLowerCase()">
          <div class="svc-header">
            <div class="svc-icon" [style.background]="svc.color + '20'" [style.color]="svc.color">
              <i [class]="svc.icon"></i>
            </div>
            <div class="svc-info">
              <h3>{{ svc.name }}</h3>
              <p>Port {{ svc.port }}</p>
            </div>
            <div class="status-badge" [ngClass]="svc.status.toLowerCase()">
              <span class="status-dot"></span>
              {{ svc.status === 'CHECKING' ? 'Checking...' : svc.status }}
            </div>
          </div>
        </div>
      </div>

      <!-- Infrastructure -->
      <div class="card" style="margin-top: 1.5rem;">
        <div class="card-header">
          <h3><i class="fas fa-server"></i> Infrastructure</h3>
        </div>
        <div class="infra-grid">
          <div class="infra-item">
            <div class="infra-icon" style="background: #dbeafe; color: #336791;"><i class="fas fa-database"></i></div>
            <div class="infra-info">
              <strong>PostgreSQL 16</strong>
              <span>Port 5432 · Auth + Orders</span>
            </div>
          </div>
          <div class="infra-item">
            <div class="infra-icon" style="background: #d1fae5; color: #47A248;"><i class="fas fa-database"></i></div>
            <div class="infra-info">
              <strong>MongoDB 7</strong>
              <span>Port 27017 · Inventory + Copilot</span>
            </div>
          </div>
          <div class="infra-item">
            <div class="infra-icon" style="background: #fee2e2; color: #F80000;"><i class="fas fa-database"></i></div>
            <div class="infra-info">
              <strong>Oracle XE</strong>
              <span>Port 1521 · Legacy Billing</span>
            </div>
          </div>
          <div class="infra-item">
            <div class="infra-icon" style="background: #f1f5f9; color: #231F20;"><i class="fas fa-stream"></i></div>
            <div class="infra-info">
              <strong>Apache Kafka</strong>
              <span>Port 9092 · Event Pipeline</span>
            </div>
          </div>
          <div class="infra-item">
            <div class="infra-icon" style="background: #ede9fe; color: #7c3aed;"><i class="fas fa-brain"></i></div>
            <div class="infra-info">
              <strong>Ollama (LLM)</strong>
              <span>Port 11434 · Local AI</span>
            </div>
          </div>
          <div class="infra-item">
            <div class="infra-icon" style="background: #ffedd5; color: #ea580c;"><i class="fas fa-vector-square"></i></div>
            <div class="infra-info">
              <strong>ChromaDB</strong>
              <span>Port 8000 · Vector Store</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overall-status { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; }
    .overall-status.healthy { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .overall-status.degraded { background: #fffbeb; border: 1px solid #fde68a; }
    .overall-status.error { background: #fef2f2; border: 1px solid #fecaca; }
    .overall-icon { font-size: 2rem; }
    .overall-status.healthy .overall-icon { color: var(--success); }
    .overall-status.degraded .overall-icon { color: var(--warning); }
    .overall-status.error .overall-icon { color: var(--danger); }
    .overall-info h2 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.125rem; }
    .overall-info p { font-size: 0.875rem; color: var(--gray-500); }
    .health-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .health-card { background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow); border: 1px solid var(--gray-100); padding: 1.25rem 1.5rem; border-left: 4px solid var(--gray-300); }
    .health-card.up { border-left-color: var(--success); }
    .health-card.down { border-left-color: var(--danger); }
    .health-card.checking { border-left-color: var(--warning); }
    .svc-header { display: flex; align-items: center; gap: 1rem; }
    .svc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; }
    .svc-info { flex: 1; }
    .svc-info h3 { font-size: 0.9375rem; font-weight: 600; margin: 0; }
    .svc-info p { font-size: 0.8125rem; color: var(--gray-500); margin: 0; }
    .status-badge { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.up { background: #d1fae5; color: #065f46; }
    .status-badge.down { background: #fee2e2; color: #991b1b; }
    .status-badge.checking { background: #fef3c7; color: #92400e; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-badge.up .status-dot { background: var(--success); }
    .status-badge.down .status-dot { background: var(--danger); }
    .status-badge.checking .status-dot { background: var(--warning); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .card-header { margin-bottom: 1rem; }
    .card-header h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .infra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .infra-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem; background: var(--gray-50); border-radius: var(--radius); }
    .infra-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .infra-info { display: flex; flex-direction: column; }
    .infra-info strong { font-size: 0.875rem; color: var(--gray-800); }
    .infra-info span { font-size: 0.75rem; color: var(--gray-500); }
  `]
})
export class HealthComponent implements OnInit {
  services: ServiceHealth[] = [
    { name: 'Auth Service', port: 8080, url: 'http://localhost:8080/api/actuator/health', status: 'CHECKING', icon: 'fas fa-shield-halved', color: '#2563eb' },
    { name: 'Order Service', port: 8081, url: 'http://localhost:8081/api/actuator/health', status: 'CHECKING', icon: 'fas fa-receipt', color: '#7c3aed' },
    { name: 'Inventory Service', port: 8082, url: 'http://localhost:8082/api/actuator/health', status: 'CHECKING', icon: 'fas fa-boxes-stacked', color: '#059669' },
    { name: 'AI Co-Pilot', port: 8083, url: 'http://localhost:8083/api/v1/copilot/health', status: 'CHECKING', icon: 'fas fa-robot', color: '#8b5cf6' },
    { name: 'Billing Service', port: 8084, url: 'http://localhost:8084/api/actuator/health', status: 'CHECKING', icon: 'fas fa-file-invoice-dollar', color: '#f59e0b' },
    { name: 'Notification Service', port: 8085, url: 'http://localhost:8085/actuator/health', status: 'CHECKING', icon: 'fas fa-stream', color: '#06b6d4' },
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

  getUpCount() { return this.services.filter(s => s.status === 'UP').length; }
  getOverallStatus(): string {
    const up = this.getUpCount();
    if (up === this.services.length) return 'healthy';
    if (up > 0) return 'degraded';
    return 'error';
  }
}
