import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  writeBatch,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Member } from '@/types';

// 自动化规则类型定义
export interface AutoRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// 规则执行结果
export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  affectedMembers: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  executedAt: string;
}

// 规则变更日志
export interface RuleChangeLog {
  id: string;
  memberId: string;
  memberName: string;
  oldCategory: string;
  newCategory: string;
  ruleId: string;
  ruleName: string;
  reason: string;
  executedAt: string;
  executedBy: string;
}

const MEMBERS_COLLECTION = 'members';
const AUTO_RULES_COLLECTION = 'auto_rules';
const RULE_CHANGE_LOGS_COLLECTION = 'rule_change_logs';

// 计算年龄
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// 格式化日期为 dd-mmm-yyyy
const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// 规则1: 新用户默认为准会员
export const applyNewMemberRule = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Omit<Member, 'id'>> => {
  const now = new Date().toISOString();
  
  return {
    ...memberData,
    membershipCategory: 'associate', // 准会员
    accountType: 'member',
    categoryReason: '新用户自动分配为准会员',
    categoryAssignedBy: 'system',
    categoryAssignedDate: formatDate(new Date()),
    createdAt: now,
    updatedAt: now
  } as Omit<Member, 'id'>;
};

// 规则2: 拥有参议员编号的用户自动成为荣誉会员
export const applySenatorRule = async (): Promise<RuleExecutionResult> => {
  const result: RuleExecutionResult = {
    ruleId: 'senator_rule',
    ruleName: '参议员编号规则',
    affectedMembers: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    executedAt: new Date().toISOString()
  };

  try {
    // 查找所有有参议员编号但不是荣誉会员的用户
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('profile.senatorId', '!=', null),
      where('profile.senatorId', '!=', '')
    );

    const snapshot = await getDocs(q);
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Member[];

    result.affectedMembers = members.length;

    if (members.length === 0) {
      return result;
    }

    // 批量更新
    const batch = writeBatch(db);
    const changeLogs: Omit<RuleChangeLog, 'id'>[] = [];

    for (const member of members) {
      try {
        const oldCategory = (member as any).membershipCategory || 'associate';
        const newCategory = 'honorary';

        // 更新会员信息
        const memberRef = doc(db, MEMBERS_COLLECTION, member.id);
        batch.update(memberRef, {
          membershipCategory: newCategory,
          categoryReason: `拥有参议员编号 ${member.profile?.senatorId}，自动升级为荣誉会员`,
          categoryAssignedBy: 'system',
          categoryAssignedDate: formatDate(new Date()),
          updatedAt: new Date().toISOString()
        });

        // 记录变更日志
        changeLogs.push({
          memberId: member.id,
          memberName: member.name,
          oldCategory,
          newCategory,
          ruleId: 'senator_rule',
          ruleName: '参议员编号规则',
          reason: `拥有参议员编号 ${member.profile?.senatorId}`,
          executedAt: new Date().toISOString(),
          executedBy: 'system'
        });

        result.successCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push(`更新会员 ${member.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 执行批量更新
    if (result.successCount > 0) {
      await batch.commit();

      // 记录变更日志
      for (const changeLog of changeLogs) {
        await addDoc(collection(db, RULE_CHANGE_LOGS_COLLECTION), changeLog);
      }
    }

  } catch (error) {
    result.errors.push(`执行参议员规则失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }

  return result;
};

// 规则3: 40岁以上用户自动成为联合会员
export const applyAgeRule = async (): Promise<RuleExecutionResult> => {
  const result: RuleExecutionResult = {
    ruleId: 'age_rule',
    ruleName: '年龄规则',
    affectedMembers: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    executedAt: new Date().toISOString()
  };

  try {
    // 获取所有有出生日期的用户
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('profile.birthDate', '!=', null),
      where('profile.birthDate', '!=', '')
    );

    const snapshot = await getDocs(q);
    const allMembers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Member[];

    // 筛选40岁以上且不是联合会员的用户
    const eligibleMembers = allMembers.filter(member => {
      if (!member.profile?.birthDate) return false;
      
      const age = calculateAge(member.profile.birthDate);
      return age >= 40 && (member as any).membershipCategory !== 'affiliate';
    });

    result.affectedMembers = eligibleMembers.length;

    if (eligibleMembers.length === 0) {
      return result;
    }

    // 批量更新
    const batch = writeBatch(db);
    const changeLogs: Omit<RuleChangeLog, 'id'>[] = [];

    for (const member of eligibleMembers) {
      try {
        const oldCategory = (member as any).membershipCategory || 'associate';
        const newCategory = 'affiliate';
        const age = calculateAge(member.profile!.birthDate!);

        // 更新会员信息
        const memberRef = doc(db, MEMBERS_COLLECTION, member.id);
        batch.update(memberRef, {
          membershipCategory: newCategory,
          categoryReason: `年龄 ${age} 岁，自动升级为联合会员`,
          categoryAssignedBy: 'system',
          categoryAssignedDate: formatDate(new Date()),
          updatedAt: new Date().toISOString()
        });

        // 记录变更日志
        changeLogs.push({
          memberId: member.id,
          memberName: member.name,
          oldCategory,
          newCategory,
          ruleId: 'age_rule',
          ruleName: '年龄规则',
          reason: `年龄 ${age} 岁`,
          executedAt: new Date().toISOString(),
          executedBy: 'system'
        });

        result.successCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push(`更新会员 ${member.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 执行批量更新
    if (result.successCount > 0) {
      await batch.commit();

      // 记录变更日志
      for (const changeLog of changeLogs) {
        await addDoc(collection(db, RULE_CHANGE_LOGS_COLLECTION), changeLog);
      }
    }

  } catch (error) {
    result.errors.push(`执行年龄规则失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }

  return result;
};

// 规则0: 经理事团审核预检查（荣誉/拜访/正式）
export const applyCouncilPrecheckRules = async (): Promise<RuleExecutionResult> => {
  const result: RuleExecutionResult = {
    ruleId: 'council_precheck_rule',
    ruleName: '经理事团审核预检查规则',
    affectedMembers: 0,
    successCount: 0,
    failedCount: 0,
    errors: [],
    executedAt: new Date().toISOString()
  };

  try {
    // 拉取需要审核的数据：
    // - 荣誉会员：有 senatorId，且未标记为已审核通过
    // - 拜访会员：proposedMembershipCategory === 'visitor'，检查 nationality 存在
    // - 正式会员：proposedMembershipCategory === 'active'，检查入会>=6个月且 requiredTasksCompleted

    const q = query(collection(db, MEMBERS_COLLECTION));
    const snapshot = await getDocs(q);
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];

    const batch = writeBatch(db);
    let toProcess = 0;

    for (const member of members) {
      const profile = member.profile || {} as any;

      // 计算是否入会>=6个月
      let sixMonthsOk = false;
      if (member.joinDate) {
        const join = new Date(member.joinDate);
        const now = new Date();
        const monthDiff = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
        sixMonthsOk = monthDiff >= 6 || (monthDiff === 5 && now.getDate() >= join.getDate());
      }

      // 条件识别
      const wantsVisitor = profile.proposedMembershipCategory === 'visitor' && !!profile.nationality;
      const wantsOfficial = profile.proposedMembershipCategory === 'active' && sixMonthsOk && profile.requiredTasksCompleted === true;
      const wantsHonorary = !!profile.senatorId && (profile.membershipCategory as any) !== 'honorary' && profile.categoryReviewStatus !== 'approved';

      if (wantsVisitor || wantsOfficial || wantsHonorary) {
        toProcess++;
        const memberRef = doc(db, MEMBERS_COLLECTION, member.id);
        batch.update(memberRef, {
          'profile.categoryReviewStatus': 'pending',
          'profile.categoryReviewNotes': wantsHonorary
            ? `荣誉会员审核：检测到参议员编号 ${profile.senatorId}`
            : wantsVisitor
              ? `拜访会员审核：检测到国籍 ${profile.nationality}`
              : `正式会员审核：入会>=6个月且已完成指定任务`,
          updatedAt: new Date().toISOString()
        });
      }
    }

    result.affectedMembers = toProcess;
    if (toProcess > 0) {
      await batch.commit();
      result.successCount = toProcess;
    }

  } catch (error) {
    result.errors.push(`执行经理事团审核预检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }

  return result;
};

// 执行所有自动化规则
export const executeAllAutoRules = async (): Promise<RuleExecutionResult[]> => {
  const results: RuleExecutionResult[] = [];

  try {
    // 执行理事团审核预检查规则
    const councilPrecheckResult = await applyCouncilPrecheckRules();
    results.push(councilPrecheckResult);

    // 执行参议员规则
    const senatorResult = await applySenatorRule();
    results.push(senatorResult);

    // 执行年龄规则
    const ageResult = await applyAgeRule();
    results.push(ageResult);

  } catch (error) {
    console.error('执行自动化规则失败:', error);
  }

  return results;
};

// 获取规则变更日志
export const getRuleChangeLogs = async (limitCount: number = 50): Promise<RuleChangeLog[]> => {
  try {
    const q = query(
      collection(db, RULE_CHANGE_LOGS_COLLECTION),
      orderBy('executedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RuleChangeLog[];
  } catch (error) {
    console.error('获取规则变更日志失败:', error);
    throw error;
  }
};

// 获取规则统计信息
export const getRuleStats = async (): Promise<{
  totalRules: number;
  activeRules: number;
  totalChanges: number;
  recentChanges: number;
}> => {
  try {
    // 获取规则统计
    const rulesSnapshot = await getDocs(collection(db, AUTO_RULES_COLLECTION));
    const totalRules = rulesSnapshot.size;
    const activeRules = rulesSnapshot.docs.filter(doc => doc.data().isActive).length;

    // 获取变更日志统计
    const logsSnapshot = await getDocs(collection(db, RULE_CHANGE_LOGS_COLLECTION));
    const totalChanges = logsSnapshot.size;

    // 获取最近7天的变更
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = logsSnapshot.docs.filter(doc => {
      const executedAt = new Date(doc.data().executedAt);
      return executedAt >= sevenDaysAgo;
    });
    const recentChanges = recentLogs.length;

    return {
      totalRules,
      activeRules,
      totalChanges,
      recentChanges
    };
  } catch (error) {
    console.error('获取规则统计失败:', error);
    throw error;
  }
};

// 手动触发规则执行
export const triggerRuleExecution = async (ruleId: string): Promise<RuleExecutionResult> => {
  switch (ruleId) {
    case 'council_precheck_rule':
      return await applyCouncilPrecheckRules();
    case 'senator_rule':
      return await applySenatorRule();
    case 'age_rule':
      return await applyAgeRule();
    default:
      throw new Error(`未知的规则ID: ${ruleId}`);
  }
};

// 针对特定会员执行规则
export const executeRuleForMembers = async (ruleId: string, memberIds: string[]): Promise<RuleExecutionResult> => {
  const result: RuleExecutionResult = {
    ruleId,
    ruleName: getRuleName(ruleId),
    affectedMembers: memberIds.length,
    successCount: 0,
    failedCount: 0,
    errors: [],
    executedAt: new Date().toISOString()
  };

  try {
    // 获取指定的会员
    const members = await getMembersByIds(memberIds);
    
    if (members.length === 0) {
      result.errors.push('未找到指定的会员');
      return result;
    }

    // 根据规则类型筛选符合条件的会员
    let eligibleMembers: any[] = [];
    
    switch (ruleId) {
      case 'senator_rule':
        eligibleMembers = members.filter(member => 
          member.profile?.senatorId && 
          member.profile.senatorId !== '' && 
          member.membershipCategory !== 'honorary'
        );
        break;
      case 'age_rule':
        eligibleMembers = members.filter(member => {
          if (!member.profile?.birthDate) return false;
          const age = calculateAge(member.profile.birthDate);
          return age >= 40 && member.membershipCategory !== 'affiliate';
        });
        break;
      default:
        result.errors.push(`不支持的规则类型: ${ruleId}`);
        return result;
    }

    if (eligibleMembers.length === 0) {
      result.errors.push('没有符合条件的会员');
      return result;
    }

    // 批量更新
    const batch = writeBatch(db);
    const changeLogs: Omit<RuleChangeLog, 'id'>[] = [];

    for (const member of eligibleMembers) {
      try {
        const oldCategory = (member as any).membershipCategory || 'associate';
        const newCategory = getTargetCategory(ruleId);

        // 更新会员信息
        const memberRef = doc(db, MEMBERS_COLLECTION, member.id);
        batch.update(memberRef, {
          membershipCategory: newCategory,
          categoryReason: getCategoryReason(ruleId, member),
          categoryAssignedBy: 'system',
          categoryAssignedDate: formatDate(new Date()),
          updatedAt: new Date().toISOString()
        });

        // 记录变更日志
        changeLogs.push({
          memberId: member.id,
          memberName: member.name,
          oldCategory,
          newCategory,
          ruleId,
          ruleName: getRuleName(ruleId),
          reason: getCategoryReason(ruleId, member),
          executedAt: new Date().toISOString(),
          executedBy: 'system'
        });

        result.successCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push(`更新会员 ${member.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 执行批量更新
    if (result.successCount > 0) {
      await batch.commit();

      // 记录变更日志
      for (const changeLog of changeLogs) {
        await addDoc(collection(db, RULE_CHANGE_LOGS_COLLECTION), changeLog);
      }
    }

  } catch (error) {
    result.errors.push(`执行规则失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }

  return result;
};

// 获取规则名称
const getRuleName = (ruleId: string): string => {
  const ruleNames: Record<string, string> = {
    'council_precheck_rule': '经理事团审核预检查规则',
    'senator_rule': '参议员编号规则',
    'age_rule': '年龄规则'
  };
  return ruleNames[ruleId] || '未知规则';
};

// 获取目标分类
const getTargetCategory = (ruleId: string): string => {
  const categories: Record<string, string> = {
    'council_precheck_rule': 'associate',
    'senator_rule': 'honorary',
    'age_rule': 'affiliate'
  };
  return categories[ruleId] || 'associate';
};

// 获取分类原因
const getCategoryReason = (ruleId: string, member: any): string => {
  switch (ruleId) {
    case 'council_precheck_rule':
      return `经理事团审核预检查：已生成待审核记录`;
    case 'senator_rule':
      return `拥有参议员编号 ${member.profile?.senatorId}，自动升级为荣誉会员`;
    case 'age_rule':
      const age = calculateAge(member.profile?.birthDate);
      return `年龄 ${age} 岁，自动升级为联合会员`;
    default:
      return '系统自动分配';
  }
};

// 根据ID获取会员
const getMembersByIds = async (memberIds: string[]): Promise<any[]> => {
  const members: any[] = [];
  
  for (const id of memberIds) {
    try {
      const memberRef = doc(db, MEMBERS_COLLECTION, id);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        members.push({
          id: memberSnap.id,
          ...memberSnap.data()
        });
      }
    } catch (error) {
      console.error(`获取会员 ${id} 失败:`, error);
    }
  }
  
  return members;
};

// 初始化默认规则
export const initializeDefaultRules = async (): Promise<void> => {
  try {
    const defaultRules: Omit<AutoRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: '经理事团审核预检查规则',
        description: '根据条件识别需要经理事团审核的类别申请，生成待审核记录',
        condition: '荣誉/拜访/正式会员申请',
        action: '生成待审核记录，设置categoryReviewStatus=pending',
        isActive: true,
        priority: 1
      },
      {
        name: '新用户准会员规则',
        description: '所有新用户默认为准会员',
        condition: '新用户注册',
        action: '设置为准会员',
        isActive: true,
        priority: 2
      },
      {
        name: '参议员编号规则',
        description: '拥有参议员编号的用户自动成为荣誉会员',
        condition: 'profile.senatorId 不为空',
        action: '设置为荣誉会员',
        isActive: true,
        priority: 3
      },
      {
        name: '年龄规则',
        description: '40岁以上用户自动成为联合会员',
        condition: '年龄 >= 40岁',
        action: '设置为联合会员',
        isActive: true,
        priority: 4
      }
    ];

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const rule of defaultRules) {
      const docRef = doc(collection(db, AUTO_RULES_COLLECTION));
      batch.set(docRef, {
        ...rule,
        createdAt: now,
        updatedAt: now
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('初始化默认规则失败:', error);
    throw error;
  }
};
