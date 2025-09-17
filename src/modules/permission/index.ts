// 权限模块导出索引
// Permission Module Export Index

// 组件导出
export { default as FieldGroupSection } from './components/FieldGroupSection';
export { default as FieldPermissionController } from './components/FieldPermissionController';
export { default as FieldPermissionStatus } from './components/FieldPermissionStatus';
export { default as FieldSelector } from './components/FieldSelector';
export { default as PermissionControlDemo } from './components/PermissionControlDemo';

// RBAC组件导出
export { default as CategoryManagement } from './components/rbac/CategoryManagement';
export { default as PermissionMatrix } from './components/rbac/PermissionMatrix';
export { default as PermissionMatrixChart } from './components/rbac/PermissionMatrixChart';
export { default as PositionManagement } from './components/rbac/PositionManagement';
export { default as RBACAudit } from './components/rbac/RBACAudit';
export { default as RBACBindings } from './components/rbac/RBACBindings';
export { default as RBACManagement } from './components/rbac/RBACManagement';
export { default as RBACPermissions } from './components/rbac/RBACPermissions';
export { default as RBACRoles } from './components/rbac/RBACRoles';
export { default as RolePermissionMatrix } from './components/rbac/RolePermissionMatrix';

// 服务导出
export * from './services/permissionService';
export { rbacService } from './services/rbacService';
export * from './services/permissionSyncService';
export * from './services/surveyPermissionService';
