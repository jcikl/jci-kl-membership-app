// 权限增强功能演示
import { permissionService } from '../services/permissionService';
import { JCIPosition, MembershipCategory } from '../types/rbac';

// 模拟数据 - 已清空
const mockMembers: any[] = [];

// 模拟服务
const mockPositionService = {
  getCurrentPosition: async (memberId: string) => {
    const member = mockMembers.find(m => m.id === memberId);
    return member?.position ? { position: member.position } : null;
  }
};

const mockCategoryService = {
  getMemberCategory: async (memberId: string) => {
    const member = mockMembers.find(m => m.id === memberId);
    return member ? {
      membershipCategory: member.category,
      accountType: member.accountType
    } : null;
  }
};

// 替换服务
(permissionService as any).positionService = mockPositionService;
(permissionService as any).categoryService = mockCategoryService;

// 演示函数
export const demonstratePermissionEnhancement = async () => {
  console.log('=== JCI KL 权限增强功能演示 ===\n');

  for (const member of mockMembers) {
    console.log(`\n--- ${member.name} (${member.id}) ---`);
    console.log(`岗位: ${member.position || '无'}`);
    console.log(`户口类别: ${member.category}`);
    console.log(`账户类型: ${member.accountType}`);

    try {
      // 获取有效权限
      const permissions = await permissionService.getEffectivePermissions(member.id);
      console.log(`总权限数: ${permissions.length}`);
      console.log(`权限列表: ${permissions.join(', ')}`);

      // 获取权限增强详情
      const enhancementDetails = await permissionService.getPermissionEnhancementDetails(member.id);
      if (enhancementDetails) {
        console.log(`\n权限增强详情:`);
        console.log(`- 增强规则: ${enhancementDetails.description}`);
        console.log(`- 基础权限数: ${enhancementDetails.basePermissions.length}`);
        console.log(`- 增强权限数: ${enhancementDetails.enhancementCount}`);
        console.log(`- 增强权限: ${enhancementDetails.additionalPermissions.join(', ')}`);
        console.log(`- 最终权限数: ${enhancementDetails.enhancedPermissions.length}`);
      } else {
        console.log(`\n无权限增强`);
      }

      // 检查是否有权限增强
      const hasEnhancement = await permissionService.hasPermissionEnhancement(member.id);
      console.log(`是否有权限增强: ${hasEnhancement ? '是' : '否'}`);

    } catch (error) {
      console.error(`获取权限失败: ${error}`);
    }
  }

  console.log('\n=== 权限增强规则总览 ===');
  const allRules = permissionService.getAllPermissionEnhancementRules();
  console.log(`总规则数: ${allRules.length}`);
  
  // 按岗位分组显示规则
  const rulesByPosition = allRules.reduce((acc, rule) => {
    if (!acc[rule.position]) {
      acc[rule.position] = [];
    }
    acc[rule.position].push(rule);
    return acc;
  }, {} as Record<string, typeof allRules>);

  Object.entries(rulesByPosition).forEach(([position, rules]) => {
    console.log(`\n${position} 岗位:`);
    rules.forEach(rule => {
      console.log(`  - ${rule.category}: ${rule.additionalPermissions.join(', ')}`);
    });
  });
};

// 权限对比演示
export const demonstratePermissionComparison = async () => {
  console.log('\n=== 权限对比演示 ===\n');

  const testCases = [
    { name: '活跃会员无岗位', position: null, category: 'active' as MembershipCategory },
    { name: '活跃会员担任会长', position: 'president' as JCIPosition, category: 'active' as MembershipCategory },
    { name: '准会员无岗位', position: null, category: 'associate' as MembershipCategory },
    { name: '准会员担任秘书长', position: 'secretary' as JCIPosition, category: 'associate' as MembershipCategory },
    { name: '准会员担任财务长', position: 'treasurer' as JCIPosition, category: 'associate' as MembershipCategory }
  ];

  for (const testCase of testCases) {
    const memberId = `test-${Math.random().toString(36).substr(2, 9)}`;
    
    // 模拟数据
    mockPositionService.getCurrentPosition = async () => 
      testCase.position ? { position: testCase.position } : null;
    mockCategoryService.getMemberCategory = async () => ({
      membershipCategory: testCase.category,
      accountType: 'member' as const
    });

    const permissions = await permissionService.getEffectivePermissions(memberId);
    const hasEnhancement = await permissionService.hasPermissionEnhancement(memberId);
    
    console.log(`${testCase.name}:`);
    console.log(`  权限数: ${permissions.length}`);
    console.log(`  有增强: ${hasEnhancement ? '是' : '否'}`);
    console.log(`  关键权限: ${permissions.filter(p => 
      p.includes('create') || p.includes('delete') || p.includes('finance')
    ).join(', ') || '无'}`);
    console.log('');
  }
};

// 运行演示
if (require.main === module) {
  demonstratePermissionEnhancement()
    .then(() => demonstratePermissionComparison())
    .catch(console.error);
}
