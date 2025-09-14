// 权限增强功能测试
import { permissionService } from '../services/permissionService';
import { JCIPosition, MembershipCategory } from '../types/rbac';

// 模拟数据
const mockPositionService = {
  getCurrentPosition: jest.fn()
};

const mockCategoryService = {
  getMemberCategory: jest.fn()
};

// 模拟权限服务
jest.mock('../services/positionService', () => ({
  positionService: mockPositionService
}));

jest.mock('../services/categoryService', () => ({
  categoryService: mockCategoryService
}));

describe('权限增强功能测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('权限增强规则测试', () => {
    test('活跃会员担任会长应该获得增强权限', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'active' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue({
        position: 'president' as JCIPosition
      });

      const memberId = 'test-member-1';
      const permissions = await permissionService.getEffectivePermissions(memberId);

      // 验证基础权限（活跃会员）
      expect(permissions).toContain('member.read');
      expect(permissions).toContain('member.update');
      expect(permissions).toContain('activity.read');
      expect(permissions).toContain('activity.create');
      expect(permissions).toContain('message.read');
      expect(permissions).toContain('message.create');
      expect(permissions).toContain('profile.read');
      expect(permissions).toContain('profile.update');

      // 验证增强权限（会长岗位）
      expect(permissions).toContain('member.create');
      expect(permissions).toContain('member.delete');
      expect(permissions).toContain('finance.create');
      expect(permissions).toContain('finance.update');
      expect(permissions).toContain('finance.delete');
    });

    test('准会员担任秘书长应该获得增强权限', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'associate' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue({
        position: 'secretary' as JCIPosition
      });

      const memberId = 'test-member-2';
      const permissions = await permissionService.getEffectivePermissions(memberId);

      // 验证基础权限（准会员）
      expect(permissions).toContain('member.read');
      expect(permissions).toContain('member.update');
      expect(permissions).toContain('activity.read');
      expect(permissions).toContain('message.read');
      expect(permissions).toContain('profile.read');
      expect(permissions).toContain('profile.update');

      // 验证增强权限（秘书长岗位）
      expect(permissions).toContain('member.create');
      expect(permissions).toContain('activity.create');
      expect(permissions).toContain('activity.update');
      expect(permissions).toContain('message.create');
      expect(permissions).toContain('message.update');
    });

    test('准会员担任财务长应该获得财务查看权限', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'associate' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue({
        position: 'treasurer' as JCIPosition
      });

      const memberId = 'test-member-3';
      const permissions = await permissionService.getEffectivePermissions(memberId);

      // 验证基础权限（准会员）
      expect(permissions).toContain('member.read');
      expect(permissions).toContain('member.update');
      expect(permissions).toContain('activity.read');
      expect(permissions).toContain('message.read');
      expect(permissions).toContain('profile.read');
      expect(permissions).toContain('profile.update');

      // 验证增强权限（财务长岗位）
      expect(permissions).toContain('finance.read');
    });

    test('没有岗位的用户只获得基础权限', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'active' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue(null);

      const memberId = 'test-member-4';
      const permissions = await permissionService.getEffectivePermissions(memberId);

      // 验证只有基础权限（活跃会员）
      expect(permissions).toContain('member.read');
      expect(permissions).toContain('member.update');
      expect(permissions).toContain('activity.read');
      expect(permissions).toContain('activity.create');
      expect(permissions).toContain('message.read');
      expect(permissions).toContain('message.create');
      expect(permissions).toContain('profile.read');
      expect(permissions).toContain('profile.update');

      // 验证没有增强权限
      expect(permissions).not.toContain('member.create');
      expect(permissions).not.toContain('member.delete');
      expect(permissions).not.toContain('finance.create');
      expect(permissions).not.toContain('finance.update');
      expect(permissions).not.toContain('finance.delete');
    });
  });

  describe('权限增强详情测试', () => {
    test('获取权限增强详情', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'active' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue({
        position: 'president' as JCIPosition
      });

      const memberId = 'test-member-5';
      const details = await permissionService.getPermissionEnhancementDetails(memberId);

      expect(details).toBeDefined();
      expect(details?.position).toBe('president');
      expect(details?.category).toBe('active');
      expect(details?.additionalPermissions).toContain('member.create');
      expect(details?.additionalPermissions).toContain('member.delete');
      expect(details?.additionalPermissions).toContain('finance.create');
      expect(details?.description).toContain('活跃会员担任会长时获得完整管理权限');
      expect(details?.enhancementCount).toBeGreaterThan(0);
    });

    test('没有权限增强时返回null', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'active' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue(null);

      const memberId = 'test-member-6';
      const details = await permissionService.getPermissionEnhancementDetails(memberId);

      expect(details).toBeNull();
    });
  });

  describe('权限增强检查测试', () => {
    test('检查是否有权限增强', async () => {
      // 有权限增强的情况
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'active' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue({
        position: 'president' as JCIPosition
      });

      const memberId1 = 'test-member-7';
      const hasEnhancement1 = await permissionService.hasPermissionEnhancement(memberId1);
      expect(hasEnhancement1).toBe(true);

      // 没有权限增强的情况
      mockPositionService.getCurrentPosition.mockResolvedValue(null);

      const memberId2 = 'test-member-8';
      const hasEnhancement2 = await permissionService.hasPermissionEnhancement(memberId2);
      expect(hasEnhancement2).toBe(false);
    });
  });

  describe('权限增强规则获取测试', () => {
    test('获取特定岗位和类别的增强规则', () => {
      const rule = permissionService.getPermissionEnhancementRule('president', 'active');
      expect(rule).toBeDefined();
      expect(rule?.position).toBe('president');
      expect(rule?.category).toBe('active');
      expect(rule?.additionalPermissions).toContain('member.create');
      expect(rule?.description).toContain('活跃会员担任会长时获得完整管理权限');
    });

    test('获取不存在的增强规则返回null', () => {
      const rule = permissionService.getPermissionEnhancementRule('official_member', 'visitor');
      expect(rule).toBeNull();
    });

    test('获取所有权限增强规则', () => {
      const rules = permissionService.getAllPermissionEnhancementRules();
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(rule => rule.position === 'president' && rule.category === 'active')).toBe(true);
    });
  });

  describe('权限统计测试', () => {
    test('权限统计包含增强信息', async () => {
      // 模拟数据
      mockCategoryService.getMemberCategory.mockResolvedValue({
        membershipCategory: 'active' as MembershipCategory,
        accountType: 'member'
      });
      mockPositionService.getCurrentPosition.mockResolvedValue({
        position: 'president' as JCIPosition
      });

      const memberId = 'test-member-9';
      const stats = await permissionService.getPermissionStats(memberId);

      expect(stats).toBeDefined();
      expect(stats?.position).toBe('president');
      expect(stats?.membershipCategory).toBe('active');
      expect(stats?.enhancementInfo).toBeDefined();
      expect(stats?.enhancementInfo?.additionalPermissions).toContain('member.create');
      expect(stats?.enhancementInfo?.description).toContain('活跃会员担任会长时获得完整管理权限');
    });
  });
});
