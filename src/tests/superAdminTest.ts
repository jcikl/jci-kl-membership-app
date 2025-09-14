// 超级管理员权限测试
import { permissionService } from '../services/permissionService';
import { getMemberByEmail } from '../services/memberService';

export const testSuperAdminPermissions = async () => {
  try {
    console.log('开始测试超级管理员权限...');
    
    // 查找 admin@jcikl.com 用户
    const adminMember = await getMemberByEmail('admin@jcikl.com');
    
    if (!adminMember) {
      console.log('❌ 未找到 admin@jcikl.com 用户');
      return;
    }
    
    console.log('✅ 找到 admin@jcikl.com 用户:', adminMember.id);
    
    // 测试各种权限
    const permissions = [
      'member.create',
      'member.read', 
      'member.update',
      'member.delete',
      'finance.create',
      'finance.read',
      'finance.update', 
      'finance.delete',
      'activity.create',
      'activity.read',
      'activity.update',
      'activity.delete',
      'system.admin',
      'system.config',
      'system.audit'
    ];
    
    console.log('测试权限检查...');
    for (const permission of permissions) {
      const hasPermission = await permissionService.checkPermission(adminMember.id, permission);
      console.log(`${permission}: ${hasPermission ? '✅' : '❌'}`);
    }
    
    // 测试管理权限
    console.log('\n测试管理权限...');
    const hasAdminPermission = await permissionService.hasAdminPermission(adminMember.id);
    const canManageUsers = await permissionService.canManageUsers(adminMember.id);
    const canManageActivities = await permissionService.canManageActivities(adminMember.id);
    const canManageFinance = await permissionService.canManageFinance(adminMember.id);
    
    console.log(`hasAdminPermission: ${hasAdminPermission ? '✅' : '❌'}`);
    console.log(`canManageUsers: ${canManageUsers ? '✅' : '❌'}`);
    console.log(`canManageActivities: ${canManageActivities ? '✅' : '❌'}`);
    console.log(`canManageFinance: ${canManageFinance ? '✅' : '❌'}`);
    
    // 测试有效权限列表
    console.log('\n测试有效权限列表...');
    const effectivePermissions = await permissionService.getEffectivePermissions(adminMember.id);
    console.log(`有效权限数量: ${effectivePermissions.length}`);
    console.log('有效权限列表:', effectivePermissions);
    
    console.log('\n✅ 超级管理员权限测试完成');
    
  } catch (error) {
    console.error('❌ 超级管理员权限测试失败:', error);
  }
};

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).testSuperAdminPermissions = testSuperAdminPermissions;
}
