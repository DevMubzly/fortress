// Role-based permission system for enterprise AI gateway

export type UserRole = 'SuperAdmin' | 'Manager' | 'Analyst' | 'User' | 'Staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

// Mock current user - in production this would come from auth context
export const mockCurrentUser: User = {
  id: 'user-001',
  email: 'admin@enterprise.gov',
  name: 'System Administrator',
  role: 'SuperAdmin',
  department: 'IT Security',
};

export interface Permissions {
  // Audit & Compliance
  canAccessAuditLogs: boolean;
  canExportAuditLogs: boolean;
  
  // Agent Management
  canCreateAgents: boolean;
  canEditAgents: boolean;
  canDeleteAgents: boolean;
  canRevokeKeys: boolean;
  canAssignKeys: boolean;
  
  // Model Hub
  canDownloadModels: boolean;
  canDeleteModels: boolean;
  canSetDefaultModel: boolean;
  canScanLocalModels: boolean;
  canManageModels: boolean;
  
  // Vault / Documents
  canAccessVault: boolean;
  canAddConnectors: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canConfigurePrivacyFilters: boolean;
  
  // Identity & Access
  canConfigureSSO: boolean;
  canManageRoles: boolean;
  canViewRoleMappings: boolean;
  
  // System Health
  canAccessSystemHealth: boolean;
  canDownloadBackups: boolean;
  canTriggerBackup: boolean;
  
  // General
  canChat: boolean;
  canViewDashboard: boolean;
  canAccessMonitoring: boolean;
  
  // Staff-only features
  canAccessPromptLibrary: boolean;
  canAccessPersonalRAG: boolean;
  isStaffOnly: boolean;
}

export function getPermissions(user: User): Permissions {
  const { role } = user;
  const isStaff = role === 'Staff';
  
  return {
    // Audit & Compliance
    canAccessAuditLogs: role === 'SuperAdmin',
    canExportAuditLogs: role === 'SuperAdmin',
    
    // Agent Management
    canCreateAgents: ['SuperAdmin', 'Manager'].includes(role),
    canEditAgents: ['SuperAdmin', 'Manager'].includes(role),
    canDeleteAgents: role === 'SuperAdmin',
    canRevokeKeys: ['SuperAdmin', 'Manager'].includes(role),
    canAssignKeys: ['SuperAdmin', 'Manager'].includes(role),
    
    // Model Hub
    canDownloadModels: role === 'SuperAdmin',
    canDeleteModels: role === 'SuperAdmin',
    canSetDefaultModel: role === 'SuperAdmin',
    canScanLocalModels: role === 'SuperAdmin',
    canManageModels: ['SuperAdmin', 'Manager'].includes(role),
    
    // Vault / Documents
    canAccessVault: ['SuperAdmin', 'Manager', 'Analyst'].includes(role),
    canAddConnectors: ['SuperAdmin', 'Manager'].includes(role),
    canUploadDocuments: ['SuperAdmin', 'Manager', 'Analyst'].includes(role),
    canDeleteDocuments: ['SuperAdmin', 'Manager'].includes(role),
    canConfigurePrivacyFilters: role === 'SuperAdmin',
    
    // Identity & Access
    canConfigureSSO: role === 'SuperAdmin',
    canManageRoles: role === 'SuperAdmin',
    canViewRoleMappings: ['SuperAdmin', 'Manager'].includes(role),
    
    // System Health
    canAccessSystemHealth: role === 'SuperAdmin',
    canDownloadBackups: role === 'SuperAdmin',
    canTriggerBackup: role === 'SuperAdmin',
    
    // General
    canChat: true,
    canViewDashboard: !isStaff,
    canAccessMonitoring: ['SuperAdmin', 'Manager'].includes(role),
    
    // Staff-only features
    canAccessPromptLibrary: true,
    canAccessPersonalRAG: true,
    isStaffOnly: isStaff,
  };
}

// Hook-style helper for components
export function usePermissions(): Permissions {
  // In production, this would use auth context
  return getPermissions(mockCurrentUser);
}

export function useCurrentUser(): User {
  return mockCurrentUser;
}
