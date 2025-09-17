import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  Permission, 
  Role, 
  RoleBinding, 
  UserRole, 
  RBACPolicy, 
  PermissionCheck,
  RBACAuditLog,
  PermissionMatrixEntry,
  RolePermissionMatrix
} from '@/types/rbac';
import { permissionService as enhancedPermissionService } from './permissionService';

// 权限管理
export const permissionService = {
  // 获取所有权限
  async getAllPermissions(): Promise<Permission[]> {
    const snapshot = await getDocs(collection(db, 'rbac_permissions'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Permission));
  },

  // 创建权限
  async createPermission(permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, 'rbac_permissions'));
    const newPermission = {
      ...permission,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newPermission);
    return docRef.id;
  },

  // 更新权限
  async updatePermission(id: string, updates: Partial<Permission>): Promise<void> {
    const docRef = doc(db, 'rbac_permissions', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // 删除权限
  async deletePermission(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rbac_permissions', id));
  }
};

// 角色管理
export const roleService = {
  // 获取所有角色
  async getAllRoles(): Promise<Role[]> {
    const snapshot = await getDocs(collection(db, 'rbac_roles'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
  },

  // 创建角色
  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, 'rbac_roles'));
    const newRole = {
      ...role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newRole);
    return docRef.id;
  },

  // 更新角色
  async updateRole(id: string, updates: Partial<Role>): Promise<void> {
    const docRef = doc(db, 'rbac_roles', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // 删除角色
  async deleteRole(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rbac_roles', id));
  },

  // 获取单个角色
  async getRole(id: string): Promise<Role | null> {
    const docRef = doc(db, 'rbac_roles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Role;
    }
    return null;
  }
};

// 用户角色绑定管理
export const bindingService = {
  // 获取用户角色绑定
  async getUserBindings(userId: string): Promise<RoleBinding[]> {
    const q = query(
      collection(db, 'rbac_bindings'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoleBinding));
  },

  // 创建角色绑定
  async createBinding(binding: Omit<RoleBinding, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, 'rbac_bindings'));
    const newBinding = {
      ...binding,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newBinding);
    return docRef.id;
  },

  // 更新角色绑定
  async updateBinding(id: string, updates: Partial<RoleBinding>): Promise<void> {
    const docRef = doc(db, 'rbac_bindings', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // 删除角色绑定
  async deleteBinding(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rbac_bindings', id));
  },

  // 批量更新用户角色
  async updateUserRoles(userId: string, roles: Array<{
    roleId: string;
    scopes?: Record<string, any>;
    expiresAt?: string;
    delegationRef?: string;
  }>): Promise<void> {
    const batch = writeBatch(db);
    
    // 删除现有绑定
    const existingBindings = await this.getUserBindings(userId);
    existingBindings.forEach(binding => {
      batch.delete(doc(db, 'rbac_bindings', binding.id));
    });

    // 创建新绑定
    if (roles.length > 0) {
      const newBindingRef = doc(collection(db, 'rbac_bindings'));
      batch.set(newBindingRef, {
        userId,
        roles,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  }
};

// 权限检查服务
export const permissionCheckService = {
  // 检查用户权限
  async checkUserPermission(
    userId: string, 
    permission: string
  ): Promise<PermissionCheck> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) {
      return {
        hasPermission: false,
        reason: '用户角色未找到',
        effectivePermissions: [],
        inheritedPermissions: [],
        deniedPermissions: []
      };
    }

    const effectivePermissions = userRole.effectivePermissions;
    const hasPermission = effectivePermissions.includes(permission);

    return {
      hasPermission,
      reason: hasPermission ? undefined : '权限不足',
      effectivePermissions,
      inheritedPermissions: [], // 可以进一步实现继承逻辑
      deniedPermissions: [] // 可以进一步实现拒绝逻辑
    };
  },

  // 获取用户角色信息
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      // 获取用户基本信息
      const userDoc = await getDoc(doc(db, 'members', userId));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      
      // 获取角色绑定
      const bindings = await bindingService.getUserBindings(userId);
      
      // 计算有效权限
      const effectivePermissions = await this.calculateEffectivePermissions(bindings);

      return {
        userId,
        accountType: userData.accountType || 'member',
        membershipCategory: userData.membershipCategory || 'associate',
        position: userData.position || 'member_none',
        effectivePermissions,
        roleBindings: bindings
      };
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return null;
    }
  },

  // 计算有效权限
  async calculateEffectivePermissions(bindings: RoleBinding[]): Promise<string[]> {
    const allRoles = await roleService.getAllRoles();
    const roleMap = new Map(allRoles.map(role => [role.id, role]));
    
    const permissions = new Set<string>();
    const deniedPermissions = new Set<string>();

    // 处理每个绑定
    for (const binding of bindings) {
      for (const roleBinding of binding.roles) {
        const role = roleMap.get(roleBinding.roleId);
        if (!role) continue;

        // 添加允许的权限
        role.allow.forEach(perm => permissions.add(perm));
        
        // 添加拒绝的权限
        role.deny.forEach(perm => deniedPermissions.add(perm));

        // 处理继承的权限
        for (const inheritedRoleId of role.inherits) {
          const inheritedRole = roleMap.get(inheritedRoleId);
          if (inheritedRole) {
            inheritedRole.allow.forEach(perm => permissions.add(perm));
            inheritedRole.deny.forEach(perm => deniedPermissions.add(perm));
          }
        }
      }
    }

    // 移除被拒绝的权限
    deniedPermissions.forEach(perm => permissions.delete(perm));

    return Array.from(permissions);
  }
};

// 审计日志服务
export const auditService = {
  // 记录审计日志
  async logAction(
    actorId: string,
    action: string,
    targetType: 'user' | 'role' | 'permission' | 'binding',
    targetId: string,
    changes: Record<string, any>
  ): Promise<void> {
    const log: Omit<RBACAuditLog, 'id'> = {
      actorId,
      action,
      targetType,
      targetId,
      changes,
      timestamp: new Date().toISOString(),
      ipAddress: '', // 可以从请求中获取
      userAgent: '' // 可以从请求中获取
    };

    const docRef = doc(collection(db, 'rbac_audit'));
    await setDoc(docRef, log);
  },

  // 获取审计日志
  async getAuditLogs(
    limit: number = 50,
    startAfter?: string
  ): Promise<RBACAuditLog[]> {
    let q = query(
      collection(db, 'rbac_audit'),
      orderBy('timestamp', 'desc')
    );

    if (startAfter) {
      // 可以添加 startAfter 逻辑
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as RBACAuditLog));
  }
};

// 策略配置服务
export const policyService = {
  // 获取策略配置
  async getPolicy(): Promise<RBACPolicy> {
    const docRef = doc(db, 'rbac_policies', 'default');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as RBACPolicy;
    }

    // 返回默认策略
    return {
      defaultNewUserType: 'member',
      typeChangeBy: ['developer'],
      positionOnlyFor: ['active'],
      actingPresidentMirrors: 'president',
      advisorPresidentReadOnly: true,
      legalCounselNoBusinessApproval: true
    };
  },

  // 更新策略配置
  async updatePolicy(policy: Partial<RBACPolicy>): Promise<void> {
    const docRef = doc(db, 'rbac_policies', 'default');
    await updateDoc(docRef, {
      ...policy,
      updatedAt: serverTimestamp()
    });
  }
};

// 权限矩阵服务
export const permissionMatrixService = {
  // 获取权限矩阵
  async getPermissionMatrix(): Promise<RolePermissionMatrix> {
    const docRef = doc(db, 'rbac_permission_matrix', 'default');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as RolePermissionMatrix;
    }

    // 返回默认权限矩阵
    return {
      roles: [],
      modules: [],
      actions: [],
      matrix: {}
    };
  },

  // 保存权限矩阵
  async savePermissionMatrix(matrix: RolePermissionMatrix): Promise<void> {
    const docRef = doc(db, 'rbac_permission_matrix', 'default');
    await setDoc(docRef, {
      ...matrix,
      updatedAt: serverTimestamp()
    });
  },

  // 获取权限矩阵条目
  async getPermissionMatrixEntries(): Promise<PermissionMatrixEntry[]> {
    const snapshot = await getDocs(collection(db, 'rbac_permission_matrix_entries'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PermissionMatrixEntry));
  },

  // 创建权限矩阵条目
  async createPermissionMatrixEntry(entry: Omit<PermissionMatrixEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, 'rbac_permission_matrix_entries'));
    const newEntry = {
      ...entry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newEntry);
    return docRef.id;
  },

  // 更新权限矩阵条目
  async updatePermissionMatrixEntry(id: string, updates: Partial<PermissionMatrixEntry>): Promise<void> {
    const docRef = doc(db, 'rbac_permission_matrix_entries', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // 删除权限矩阵条目
  async deletePermissionMatrixEntry(id: string): Promise<void> {
    await deleteDoc(doc(db, 'rbac_permission_matrix_entries', id));
  },

  // 批量更新权限矩阵
  async batchUpdatePermissionMatrix(updates: Array<{
    module: string;
    action: string;
    role: string;
    hasPermission: boolean;
  }>): Promise<void> {
    const batch = writeBatch(db);
    
    for (const update of updates) {
      const entryId = `${update.module}_${update.action}`;
      const docRef = doc(db, 'rbac_permission_matrix_entries', entryId);
      
      // 检查条目是否存在
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // 更新现有条目
        batch.update(docRef, {
          [`roles.${update.role}`]: update.hasPermission,
          updatedAt: serverTimestamp()
        });
      } else {
        // 创建新条目
        const newEntry: Omit<PermissionMatrixEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          module: update.module,
          action: update.action,
          roles: { [update.role]: update.hasPermission }
        };
        batch.set(docRef, newEntry);
      }
    }

    await batch.commit();
  },

  // 增强的权限检查 - 集成职位和分类权限
  async checkPermission(memberId: string, permission: string): Promise<boolean> {
    try {
      // 首先检查增强的权限服务
      const hasEnhancedPermission = await enhancedPermissionService.checkPermission(memberId, permission);
      if (hasEnhancedPermission) return true;

      // 如果增强权限服务没有找到权限，回退到传统RBAC检查
      const userRole = await permissionCheckService.getUserRole(memberId);
      if (!userRole) return false;

      // 检查角色绑定中的权限
      for (const binding of userRole.roleBindings) {
        for (const roleBinding of binding.roles) {
          const role = await roleService.getRole(roleBinding.roleId);
          if (role && role.allow.includes(permission)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  },

  // 获取用户的有效权限（集成职位和分类）
  async getEffectivePermissions(memberId: string): Promise<string[]> {
    try {
      // 获取增强权限服务的权限
      const enhancedPermissions = await enhancedPermissionService.getEffectivePermissions(memberId);
      
      // 获取传统RBAC权限
      const userRole = await permissionCheckService.getUserRole(memberId);
      const rbacPermissions = userRole?.effectivePermissions || [];

      // 合并并去重
      const allPermissions = [...enhancedPermissions, ...rbacPermissions];
      return [...new Set(allPermissions)];
    } catch (error) {
      console.error('获取有效权限失败:', error);
      return [];
    }
  },

  // 获取用户权限统计
  async getPermissionStats(memberId: string) {
    try {
      const enhancedStats = await enhancedPermissionService.getPermissionStats(memberId);
      const effectivePermissions = await this.getEffectivePermissions(memberId);
      
      return {
        ...enhancedStats,
        totalEffectivePermissions: effectivePermissions.length,
        allEffectivePermissions: effectivePermissions
      };
    } catch (error) {
      console.error('获取权限统计失败:', error);
      return null;
    }
  }
};
