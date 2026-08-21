import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/notification/toast.service';

interface SystemConfig {
  siteName: string;
  maintenanceMode: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  enableNotifications: boolean;
  enableAiCopilot: boolean;
  defaultOrderStatus: string;
  taxRate: number;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-gear"></i> System Settings</h1>
          <p>Configure platform settings and preferences</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- General Settings -->
        <div class="card">
          <h3><i class="fas fa-sliders"></i> General</h3>
          <div class="setting-item">
            <div class="setting-info">
              <label>Site Name</label>
              <p>The name displayed in the browser tab and navigation</p>
            </div>
            <input type="text" class="form-control" [(ngModel)]="config.siteName" style="max-width: 280px;">
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <label>Maintenance Mode</label>
              <p>Temporarily disable access for non-admin users</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="config.maintenanceMode">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <label>Default Tax Rate</label>
              <p>Applied to new orders when no customer-specific rate exists</p>
            </div>
            <div class="input-group">
              <input type="number" class="form-control" [(ngModel)]="config.taxRate" step="0.01" min="0" max="100" style="max-width: 100px;">
              <span class="input-suffix">%</span>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="card">
          <h3><i class="fas fa-shield-halved"></i> Security</h3>
          <div class="setting-item">
            <div class="setting-info">
              <label>Max Login Attempts</label>
              <p>Lock account after this many failed login attempts</p>
            </div>
            <input type="number" class="form-control" [(ngModel)]="config.maxLoginAttempts" min="1" max="20" style="max-width: 100px;">
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <label>Session Timeout</label>
              <p>Auto-logout after period of inactivity (minutes)</p>
            </div>
            <input type="number" class="form-control" [(ngModel)]="config.sessionTimeoutMinutes" min="5" max="480" style="max-width: 100px;">
          </div>
        </div>

        <!-- Feature Toggles -->
        <div class="card">
          <h3><i class="fas fa-puzzle-piece"></i> Features</h3>
          <div class="setting-item">
            <div class="setting-info">
              <label>AI Co-Pilot</label>
              <p>Enable the AI-powered operations assistant</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="config.enableAiCopilot">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <label>Notifications</label>
              <p>Enable real-time notifications for order events</p>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="config.enableNotifications">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- System Info -->
        <div class="card">
          <h3><i class="fas fa-circle-info"></i> System Info</h3>
          <div class="info-grid">
            <div class="info-item"><span class="label">Version</span><span class="value">1.0.0</span></div>
            <div class="info-item"><span class="label">Angular</span><span class="value">17.3</span></div>
            <div class="info-item"><span class="label">Spring Boot</span><span class="value">3.2.5</span></div>
            <div class="info-item"><span class="label">Java</span><span class="value">17</span></div>
            <div class="info-item"><span class="label">Database</span><span class="value">PostgreSQL 16 + MongoDB 7</span></div>
            <div class="info-item"><span class="label">AI Model</span><span class="value">Ollama (local LLM)</span></div>
            <div class="info-item"><span class="label">License</span><span class="value">MIT</span></div>
            <div class="info-item"><span class="label">Environment</span><span class="value">Demo / Mock Mode</span></div>
          </div>
        </div>
      </div>

      <div class="save-bar">
        <button class="btn btn-primary" (click)="saveSettings()">
          <i class="fas fa-check"></i> Save Settings
        </button>
        <button class="btn btn-secondary" (click)="resetSettings()">
          <i class="fas fa-rotate-left"></i> Reset to Defaults
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: var(--gray-500); font-size: 0.875rem; }
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
    .card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); }
    .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 0; border-bottom: 1px solid var(--gray-100); }
    .setting-item:last-child { border-bottom: none; }
    .setting-info { flex: 1; }
    .setting-info label { font-weight: 500; font-size: 0.875rem; color: var(--gray-800); }
    .setting-info p { font-size: 0.8125rem; color: var(--gray-500); margin-top: 0.125rem; }
    .input-group { display: flex; align-items: center; gap: 0.5rem; }
    .input-suffix { font-size: 0.875rem; color: var(--gray-500); }
    .toggle { position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; inset: 0; background: var(--gray-300); border-radius: 13px; transition: 0.3s; }
    .toggle-slider::before { content: ''; position: absolute; width: 20px; height: 20px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    .toggle input:checked + .toggle-slider { background: var(--primary); }
    .toggle input:checked + .toggle-slider::before { transform: translateX(22px); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; padding: 0.5rem 0; }
    .info-item .label { font-size: 0.75rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .info-item .value { font-size: 0.875rem; color: var(--gray-900); font-weight: 500; }
    .save-bar { display: flex; gap: 0.75rem; padding-top: 1rem; }
    @media (max-width: 860px) { .settings-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminSettingsComponent implements OnInit {
  config: SystemConfig = {
    siteName: 'AtlasOps',
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    enableNotifications: true,
    enableAiCopilot: true,
    defaultOrderStatus: 'PENDING',
    taxRate: 7.41
  };

  private defaults = { ...this.config };

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    const stored = localStorage.getItem('atlasops_settings');
    if (stored) { try { this.config = { ...this.defaults, ...JSON.parse(stored) }; } catch {} }
  }

  saveSettings() {
    localStorage.setItem('atlasops_settings', JSON.stringify(this.config));
    this.toastService.success('Settings saved', 'System settings have been updated');
  }

  resetSettings() {
    this.config = { ...this.defaults };
    localStorage.removeItem('atlasops_settings');
    this.toastService.info('Settings reset', 'All settings restored to defaults');
  }
}
