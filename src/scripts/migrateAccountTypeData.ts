// 数据迁移脚本：将 Member 和 MemberProfile 中的 accountType 数据迁移到 member_categories 集合
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { categoryService } from '../services/categoryService';

const MEMBERS_COLLECTION = 'members';
const MEMBER_CATEGORIES_COLLECTION = 'member_categories';

interface LegacyMember {
  id: string;
  profile?: {
    accountType?: string;
    membershipCategory?: string;
    categoryReason?: string;
    categoryAssignedBy?: string;
    categoryAssignedDate?: string;
  };
}

export const migrateAccountTypeData = async () => {
  try {
    // 1. 获取所有会员数据
    const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
    const members = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LegacyMember[];

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const member of members) {
      try {
        // 检查是否已有分类记录
        const existingCategory = await categoryService.getMemberCategory(member.id);
        if (existingCategory) {
          skippedCount++;
          continue;
        }

        // 获取账户类型和会员类别
        const accountType = member.profile?.accountType || 'member';
        const membershipCategory = member.profile?.membershipCategory || 'associate';

        // 创建分类记录
        await categoryService.assignCategory(
          member.id,
          membershipCategory as any,
          accountType as any,
          {
            reason: member.profile?.categoryReason || '数据迁移',
            assignedBy: member.profile?.categoryAssignedBy || 'system'
          }
        );

        migratedCount++;

      } catch (error) {
        console.error(`迁移会员 ${member.id} 失败:`, error);
        errorCount++;
      }
    }

    return {
      migratedCount,
      skippedCount,
      errorCount
    };

    return {
      total: members.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount
    };

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    throw error;
  }
};

// 清理冗余字段（可选，谨慎使用）
export const cleanupRedundantFields = async () => {
  
  try {
    const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
    const batch = [];
    let cleanedCount = 0;

    for (const docSnapshot of membersSnapshot.docs) {
      const memberData = docSnapshot.data();
      
      // 检查是否有需要清理的字段
      if (memberData.profile?.accountType || memberData.profile?.membershipCategory) {
        const updates: any = {};
        
        if (memberData.profile?.accountType) {
          updates['profile.accountType'] = null;
        }
        if (memberData.profile?.membershipCategory) {
          updates['profile.membershipCategory'] = null;
        }
        if (memberData.profile?.categoryReason) {
          updates['profile.categoryReason'] = null;
        }
        if (memberData.profile?.categoryAssignedBy) {
          updates['profile.categoryAssignedBy'] = null;
        }
        if (memberData.profile?.categoryAssignedDate) {
          updates['profile.categoryAssignedDate'] = null;
        }

        batch.push(updateDoc(doc(db, MEMBERS_COLLECTION, docSnapshot.id), updates));
        cleanedCount++;
      }
    }

    if (batch.length > 0) {
      // 注意：这里需要根据实际情况决定是否执行清理
      // await Promise.all(batch);
      return cleanedCount;
    }

    return { cleaned: cleanedCount };

  } catch (error) {
    console.error('清理过程中发生错误:', error);
    throw error;
  }
};

// 验证迁移结果
export const validateMigration = async () => {
  
  try {
    const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
    const categoriesSnapshot = await getDocs(collection(db, MEMBER_CATEGORIES_COLLECTION));

    const memberCount = membersSnapshot.size;
    const categoryCount = categoriesSnapshot.size;

    // 检查是否有会员没有分类记录
    const membersWithoutCategory = [];
    for (const docSnapshot of membersSnapshot.docs) {
      const memberId = docSnapshot.id;
      const category = await categoryService.getMemberCategory(memberId);
      if (!category) {
        membersWithoutCategory.push(memberId);
      }
    }

    return {
      memberCount,
      categoryCount,
      membersWithoutCategory,
      hasMissingCategories: membersWithoutCategory.length > 0
    };

  } catch (error) {
    console.error('验证过程中发生错误:', error);
    throw error;
  }
};
