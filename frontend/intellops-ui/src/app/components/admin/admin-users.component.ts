import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/notification/toast.service';
import { AuthService } from '../../services/auth.service';

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page animate-fadeIn">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-users-cog"></i> User Management</h1>
          <p>Manage platform users, roles, and permissions</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="fas fa-user-plus"></i> Add User
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ users.length }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-user-check"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ getActiveCount() }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fas fa-shield-halved"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ getRoleCount('ADMIN') }}</span>
            <span class="stat-label">Admins</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i class="fas fa-user-gear"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ getRoleCount('OPERATOR') }}</span>
            <span class="stat-label">Operators</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="toolbar">
          <input type="text" class="form-control" placeholder="Search by name or email..." [(ngModel)]="searchTerm" (keyup.enter)="filterUsers()" style="max-width: 320px;">
          <select class="form-control" [(ngModel)]="roleFilter" (ngModelChange)="filterUsers()" style="max-width: 160px;">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="OPERATOR">Operator</option>
            <option value="USER">User</option>
          </select>
          <select class="form-control" [(ngModel)]="statusFilter" (ngModelChange)="filterUsers()" style="max-width: 160px;">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <span class="result-count">{{ filteredUsers.length }} user(s)</span>
        </div>

        <!-- Users Table -->
        <table class="table" *ngIf="filteredUsers.length; else noUsers">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers" [class.disabled-row]="!user.enabled">
              <td>
                <div class="user-cell">
                  <div class="avatar" [ngClass]="getAvatarClass(user.role)">
                    {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                  </div>
                  <div>
                    <div class="user-name">{{ user.fullName }}</div>
                    <div class="user-id">ID: {{ user.id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" [ngClass]="getRoleClass(user.role)">
                  <i class="fas" [ngClass]="getRoleIcon(user.role)"></i> {{ user.role }}
                </span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="user.enabled ? 'active' : 'disabled'">
                  {{ user.enabled ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td>{{ user.createdAt | date:'MMM d, yyyy' }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-sm btn-secondary" (click)="editUser(user)" title="Edit">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button class="btn btn-sm" [ngClass]="user.enabled ? 'btn-warning' : 'btn-success'"
                          (click)="toggleUser(user)" [title]="user.enabled ? 'Disable' : 'Enable'">
                    <i class="fas" [ngClass]="user.enabled ? 'fa-ban' : 'fa-check'"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteUser(user)" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noUsers>
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>No users match your filters</p>
          </div>
        </ng-template>
      </div>

      <!-- Edit / Create Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal animate-fadeIn" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><i class="fas" [ngClass]="editingUser ? 'fa-user-pen' : 'fa-user-plus'"></i> {{ editingUser ? 'Edit User' : 'Create User' }}</h2>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form (ngSubmit)="saveUser()" class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" class="form-control" [(ngModel)]="form.firstName" name="firstName" required>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" class="form-control" [(ngModel)]="form.lastName" name="lastName" required>
              </div>
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="form.email" name="email" required [disabled]="!!editingUser">
            </div>
            <div class="form-group" *ngIf="!editingUser">
              <label>Password</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" name="password" required minlength="6" placeholder="Min 6 characters">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Role</label>
                <select class="form-control" [(ngModel)]="form.role" name="role">
                  <option value="USER">User</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="form-control" [(ngModel)]="form.enabled" name="enabled">
                  <option [ngValue]="true">Active</option>
                  <option [ngValue]="false">Disabled</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                <span class="spinner" *ngIf="saving"></span>
                <span *ngIf="!saving"><i class="fas fa-check"></i> {{ editingUser ? 'Update' : 'Create' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { color: var(--gray-500); font-size: 0.875rem; }
    .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; background: white; padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-icon.blue { background: #dbeafe; color: #2563eb; }
    .stat-icon.green { background: #d1fae5; color: #059669; }
    .stat-icon.purple { background: #ede9fe; color: #7c3aed; }
    .stat-icon.orange { background: #ffedd5; color: #ea580c; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.8125rem; color: var(--gray-500); }
    .toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .result-count { font-size: 0.8125rem; color: var(--gray-500); margin-left: auto; }
    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0; }
    .avatar.admin { background: linear-gradient(135deg, #7c3aed, #a855f7); }
    .avatar.operator { background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .avatar.user { background: linear-gradient(135deg, #64748b, #94a3b8); }
    .user-name { font-weight: 600; font-size: 0.875rem; }
    .user-id { font-size: 0.75rem; color: var(--gray-400); font-family: monospace; }
    .role-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .role-badge.admin { background: #ede9fe; color: #7c3aed; }
    .role-badge.operator { background: #dbeafe; color: #2563eb; }
    .role-badge.user { background: #f1f5f9; color: #475569; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.active { background: #d1fae5; color: #065f46; }
    .status-badge.disabled { background: #fee2e2; color: #991b1b; }
    .action-btns { display: flex; gap: 0.375rem; }
    .btn-warning { background: #fef3c7; color: #92400e; &:hover { background: #fde68a; } }
    .btn-success { background: #d1fae5; color: #065f46; &:hover { background: #a7f3d0; } }
    .disabled-row { opacity: 0.6; }
    .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); i { font-size: 2rem; margin-bottom: 0.5rem; } }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: white; border-radius: 12px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--gray-200); }
    .modal-header h2 { font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    .modal-close { background: none; border: none; font-size: 1.5rem; color: var(--gray-400); cursor: pointer; padding: 0.25rem; }
    .modal-close:hover { color: var(--gray-700); }
    .modal-body { padding: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  showModal = false;
  editingUser: AdminUser | null = null;
  saving = false;

  form = { firstName: '', lastName: '', email: '', password: '', role: 'USER', enabled: true };

  constructor(private http: HttpClient, private toastService: ToastService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.http.get<AdminUser[]>('/api/admin/users').subscribe({
      next: (users) => { this.users = users; this.filterUsers(); },
      error: () => { this.users = []; this.filteredUsers = []; }
    });
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(u => {
      const matchSearch = !this.searchTerm || u.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) || u.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchRole = !this.roleFilter || u.role === this.roleFilter;
      const matchStatus = this.statusFilter === '' || (this.statusFilter === 'active' ? u.enabled : !u.enabled);
      return matchSearch && matchRole && matchStatus;
    });
  }

  getActiveCount() { return this.users.filter(u => u.enabled).length; }
  getRoleCount(role: string) { return this.users.filter(u => u.role === role).length; }
  getRoleClass(role: string) { return role.toLowerCase(); }
  getRoleIcon(role: string) {
    if (role === 'ADMIN') return 'fa-shield-halved';
    if (role === 'OPERATOR') return 'fa-user-gear';
    return 'fa-user';
  }
  getAvatarClass(role: string) { return role.toLowerCase(); }

  openCreateModal() {
    this.editingUser = null;
    this.form = { firstName: '', lastName: '', email: '', password: '', role: 'USER', enabled: true };
    this.showModal = true;
  }

  editUser(user: AdminUser) {
    this.editingUser = user;
    this.form = { firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role, enabled: user.enabled };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editingUser = null; }

  saveUser() {
    this.saving = true;
    if (this.editingUser) {
      this.http.put(`/api/admin/users/${this.editingUser.id}`, this.form).subscribe({
        next: () => { this.toastService.success('User updated', `${this.form.firstName} ${this.form.lastName} has been updated`); this.saving = false; this.closeModal(); this.loadUsers(); },
        error: (e) => { this.toastService.error('Update failed', e.error?.message || 'Could not update user'); this.saving = false; }
      });
    } else {
      this.http.post('/api/admin/users', this.form).subscribe({
        next: () => { this.toastService.success('User created', `${this.form.firstName} ${this.form.lastName} has been added`); this.saving = false; this.closeModal(); this.loadUsers(); },
        error: (e) => { this.toastService.error('Creation failed', e.error?.message || 'Could not create user'); this.saving = false; }
      });
    }
  }

  toggleUser(user: AdminUser) {
    this.http.put(`/api/admin/users/${user.id}`, { ...user, enabled: !user.enabled }).subscribe({
      next: () => { this.toastService.success(user.enabled ? 'User disabled' : 'User enabled', user.fullName); this.loadUsers(); },
      error: () => this.toastService.error('Error', 'Could not update user status')
    });
  }

  deleteUser(user: AdminUser) {
    if (!confirm(`Delete ${user.fullName}? This cannot be undone.`)) return;
    this.http.delete(`/api/admin/users/${user.id}`).subscribe({
      next: () => { this.toastService.success('User deleted', user.fullName); this.loadUsers(); },
      error: () => this.toastService.error('Delete failed', 'Could not delete user')
    });
  }
}
