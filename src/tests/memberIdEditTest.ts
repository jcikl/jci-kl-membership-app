// 会员编号编辑权限测试
import { checkFieldPermission } from '../utils/fieldPermissions';
import { UserRole } from '../utils/fieldPermissions';

export const testMemberIdEditPermissions = () => {
  console.log('开始测试会员编号编辑权限...');
  
  // 测试超级管理员权限
  const superAdminMember = {
    id: 'test-super-admin',
    email: 'admin@jcikl.com',
    name: 'Super Admin',
    memberId: 'ADMIN001'
  };
  
  // 测试普通管理员权限
  const adminMember = {
    id: 'test-admin',
    email: 'admin@example.com',
    name: 'Admin User',
    memberId: 'ADMIN002'
  };
  
  // 测试普通会员权限
  const regularMember = {
    id: 'test-member',
    email: 'member@example.com',
    name: 'Regular Member',
    memberId: 'MEMBER001'
  };
  
  console.log('\n=== 超级管理员权限测试 ===');
  const superAdminResult = checkFieldPermission('memberId', 'member' as UserRole, superAdminMember);
  console.log('超级管理员会员编号权限:', {
    permission: superAdminResult.permission,
    editable: superAdminResult.editable,
    message: superAdminResult.message
  });
  
  console.log('\n=== 普通管理员权限测试 ===');
  const adminResult = checkFieldPermission('memberId', 'admin' as UserRole, adminMember);
  console.log('普通管理员会员编号权限:', {
    permission: adminResult.permission,
    editable: adminResult.editable,
    message: adminResult.message
  });
  
  console.log('\n=== 普通会员权限测试 ===');
  const memberResult = checkFieldPermission('memberId', 'member' as UserRole, regularMember);
  console.log('普通会员会员编号权限:', {
    permission: memberResult.permission,
    editable: memberResult.editable,
    message: memberResult.message
  });
  
  console.log('\n=== 其他管理员专用字段测试 ===');
  const otherFields = ['status', 'level', 'accountType'];
  otherFields.forEach(field => {
    const result = checkFieldPermission(field, 'member' as UserRole, superAdminMember);
    console.log(`${field} 字段权限:`, {
      permission: result.permission,
      editable: result.editable,
      message: result.message
    });
  });
  
  console.log('\n✅ 会员编号编辑权限测试完成');
};

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).testMemberIdEditPermissions = testMemberIdEditPermissions;
}
