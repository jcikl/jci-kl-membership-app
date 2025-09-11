// 数据迁移脚本：将 Member 和 MemberProfile 中的 accountType 数据迁移到 member_categories 集合
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
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
  console.log('开始迁移账户类型数据...');
  
  try {
    // 1. 获取所有会员数据
    const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
    const members = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LegacyMember[];

    console.log(`找到 ${members.length} 个会员记录`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const member of members) {
      try {
        // 检查是否已有分类记录
        const existingCategory = await categoryService.getMemberCategory(member.id);
        if (existingCategory) {
          console.log(`会员 ${member.id} 已有分类记录，跳过`);
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
            assignedBy: member.profile?.categoryAssignedBy || 'system',
            assignedDate: member.profile?.categoryAssignedDate || new Date().toISOString()
          }
        );

        console.log(`已迁移会员 ${member.id}: ${accountType}/${membershipCategory}`);
        migratedCount++;

      } catch (error) {
        console.error(`迁移会员 ${member.id} 失败:`, error);
        errorCount++;
      }
    }

    console.log('迁移完成:');
    console.log(`- 成功迁移: ${migratedCount}`);
    console.log(`- 跳过（已有记录）: ${skippedCount}`);
    console.log(`- 错误: ${errorCount}`);

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
  console.log('开始清理冗余字段...');
  
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
      console.log(`准备清理 ${cleanedCount} 个会员的冗余字段`);
      console.log('警告：此操作将删除冗余字段，请确保数据已正确迁移');
      // await Promise.all(batch);
      console.log('清理操作已注释，如需执行请手动取消注释');
    }

    return { cleaned: cleanedCount };

  } catch (error) {
    console.error('清理过程中发生错误:', error);
    throw error;
  }
};

// 验证迁移结果
export const validateMigration = async () => {
  console.log('验证迁移结果...');
  
  try {
    const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
    const categoriesSnapshot = await getDocs(collection(db, MEMBER_CATEGORIES_COLLECTION));

    const memberCount = membersSnapshot.size;
    const categoryCount = categoriesSnapshot.size;

    console.log(`会员总数: ${memberCount}`);
    console.log(`分类记录数: ${categoryCount}`);

    // 检查是否有会员没有分类记录
    const membersWithoutCategory = [];
    for (const docSnapshot of membersSnapshot.docs) {
      const memberId = docSnapshot.id;
      const category = await categoryService.getMemberCategory(memberId);
      if (!category) {
        membersWithoutCategory.push(memberId);
      }
    }

    if (membersWithoutCategory.length > 0) {
      console.log(`警告：${membersWithoutCategory.length} 个会员没有分类记录:`, membersWithoutCategory);
    } else {
      console.log('所有会员都有对应的分类记录');
    }

    return {
      memberCount,
      categoryCount,
      membersWithoutCategory: membersWithoutCategory.length
    };

  } catch (error) {
    console.error('验证过程中发生错误:', error);
    throw error;
  }
};
