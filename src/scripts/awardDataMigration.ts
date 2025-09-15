import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  CreateAwardIndicatorInput,
  CreateIndicatorInput,
  StarPointCategory,
  NationalAreaCategory,
  EAwardCategory
} from '@/types/awardIndicators';
import { awardIndicatorService } from '@/services/awardIndicatorService';
import { 
  EfficientStarAward, 
  StarPointAward, 
  NationalAreaIncentiveAward,
  EAward,
} from '@/types/awards';

interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  errors: string[];
}

interface MigrationStats {
  efficientStar: {
    migrated: number;
    errors: string[];
  };
  starPoint: {
    migrated: number;
    errors: string[];
  };
  nationalAreaIncentive: {
    migrated: number;
    errors: string[];
  };
  eAwards: {
    migrated: number;
    errors: string[];
  };
}

class AwardDataMigration {
  private readonly OLD_COLLECTIONS = {
    AWARDS: 'awards',
    STANDARDS: 'standards',
    E_AWARDS: 'e_awards'
  };


  /**
   * 执行完整的数据迁移
   */
  async migrateAllData(sourceYear: number, targetYear: number): Promise<MigrationResult> {
    const stats: MigrationStats = {
      efficientStar: { migrated: 0, errors: [] },
      starPoint: { migrated: 0, errors: [] },
      nationalAreaIncentive: { migrated: 0, errors: [] },
      eAwards: { migrated: 0, errors: [] }
    };

    try {
      console.log(`开始迁移 ${sourceYear} 年到 ${targetYear} 年的奖励数据...`);

      // 1. 迁移 Efficient Star 数据
      const efficientStarResult = await this.migrateEfficientStarData(sourceYear, targetYear);
      stats.efficientStar = efficientStarResult;

      // 2. 迁移 Star Point 数据
      const starPointResult = await this.migrateStarPointData(sourceYear, targetYear);
      stats.starPoint = starPointResult;

      // 3. 迁移 National & Area Incentive 数据
      const nationalAreaResult = await this.migrateNationalAreaData(sourceYear, targetYear);
      stats.nationalAreaIncentive = nationalAreaResult;

      // 4. 迁移 E-Awards 数据
      const eAwardsResult = await this.migrateEAwardsData(sourceYear, targetYear);
      stats.eAwards = eAwardsResult;

      // 计算总迁移数量
      const totalMigrated = stats.efficientStar.migrated + 
                           stats.starPoint.migrated + 
                           stats.nationalAreaIncentive.migrated + 
                           stats.eAwards.migrated;

      // 收集所有错误
      const allErrors = [
        ...stats.efficientStar.errors,
        ...stats.starPoint.errors,
        ...stats.nationalAreaIncentive.errors,
        ...stats.eAwards.errors
      ];

      return {
        success: allErrors.length === 0,
        message: `迁移完成！共迁移 ${totalMigrated} 个奖励指标`,
        migratedCount: totalMigrated,
        errors: allErrors
      };

    } catch (error) {
      console.error('数据迁移失败:', error);
      return {
        success: false,
        message: '数据迁移失败',
        migratedCount: 0,
        errors: [error instanceof Error ? error.message : '未知错误']
      };
    }
  }

  /**
   * 迁移 Efficient Star 数据
   */
  private async migrateEfficientStarData(sourceYear: number, targetYear: number): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // 获取现有的 Efficient Star 数据
      const q = query(
        collection(db, this.OLD_COLLECTIONS.AWARDS),
        where('category', '==', 'efficient_star'),
        where('year', '==', sourceYear)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('未找到 Efficient Star 数据');
        return { migrated: 0, errors: [] };
      }

      for (const docSnap of querySnapshot.docs) {
        try {
          const efficientStarData = docSnap.data() as EfficientStarAward;
          
          // 创建新的奖励指标
          const awardIndicatorInput: CreateAwardIndicatorInput = {
            level: 'star_point',
            category: 'efficient_star',
            title: efficientStarData.title,
            description: efficientStarData.description,
            year: targetYear,
            createdBy: 'migration'
          };

          const awardIndicatorId = await awardIndicatorService.saveAwardIndicator(awardIndicatorInput);

          // 迁移 standards 数据
          if (efficientStarData.standards && efficientStarData.standards.length > 0) {
            for (const standard of efficientStarData.standards) {
              const indicatorInput: CreateIndicatorInput = {
                awardIndicatorId,
                no: standard.no,
                title: standard.title,
                description: standard.description,
                deadline: standard.deadline,
                externalLink: standard.externalLink,
                score: standard.score,
                myScore: standard.myScore || 0,
                status: standard.status,
                guidelines: standard.guidelines,
                responsiblePerson: standard.responsiblePerson,
                team: standard.team,
                teamManagement: standard.teamManagement,
                scoreSettings: standard.scoreSettings,
                createdBy: 'migration'
              };

              await awardIndicatorService.saveIndicator(indicatorInput);
            }
          }

          migrated++;
          console.log(`迁移 Efficient Star: ${efficientStarData.title}`);

        } catch (error) {
          const errorMsg = `迁移 Efficient Star 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `获取 Efficient Star 数据失败: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }

    return { migrated, errors };
  }

  /**
   * 迁移 Star Point 数据
   */
  private async migrateStarPointData(sourceYear: number, targetYear: number): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // 获取现有的 Star Point 数据
      const q = query(
        collection(db, this.OLD_COLLECTIONS.AWARDS),
        where('category', 'in', ['network_star', 'experience_star', 'social_star', 'outreach_star']),
        where('year', '==', sourceYear)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('未找到 Star Point 数据');
        return { migrated: 0, errors: [] };
      }

      for (const docSnap of querySnapshot.docs) {
        try {
          const starPointData = docSnap.data() as StarPointAward;
          
          // 确定 Star Point 类别
          const category = this.mapStarPointCategory(starPointData.category);
          if (!category) {
            errors.push(`未知的 Star Point 类别: ${starPointData.category}`);
            continue;
          }

          // 创建新的奖励指标
          const awardIndicatorInput: CreateAwardIndicatorInput = {
            level: 'star_point',
            category,
            title: starPointData.title,
            description: starPointData.description,
            year: targetYear,
            createdBy: 'migration'
          };

          const awardIndicatorId = await awardIndicatorService.saveAwardIndicator(awardIndicatorInput);

          // 迁移 standards 数据
          if (starPointData.standards && starPointData.standards.length > 0) {
            for (const standard of starPointData.standards) {
              const indicatorInput: CreateIndicatorInput = {
                awardIndicatorId,
                no: standard.no,
                title: standard.title,
                description: standard.description,
                deadline: standard.deadline,
                externalLink: standard.externalLink,
                score: standard.score,
                myScore: standard.myScore || 0,
                status: standard.status,
                guidelines: standard.guidelines,
                responsiblePerson: standard.responsiblePerson,
                team: standard.team,
                teamManagement: standard.teamManagement,
                scoreSettings: standard.scoreSettings,
                // Star Point 特有字段
                objective: standard.objective,
                note: standard.note,
                points: standard.points,
                createdBy: 'migration'
              };

              await awardIndicatorService.saveIndicator(indicatorInput);
            }
          }

          migrated++;
          console.log(`迁移 Star Point: ${starPointData.title} (${category})`);

        } catch (error) {
          const errorMsg = `迁移 Star Point 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `获取 Star Point 数据失败: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }

    return { migrated, errors };
  }

  /**
   * 迁移 National & Area Incentive 数据
   */
  private async migrateNationalAreaData(sourceYear: number, targetYear: number): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // 获取现有的 National & Area Incentive 数据
      const q = query(
        collection(db, this.OLD_COLLECTIONS.AWARDS),
        where('category', '==', 'national_area_incentive'),
        where('year', '==', sourceYear)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('未找到 National & Area Incentive 数据');
        return { migrated: 0, errors: [] };
      }

      for (const docSnap of querySnapshot.docs) {
        try {
          const nationalAreaData = docSnap.data() as NationalAreaIncentiveAward;
          
          // 为每个 award category 创建独立的奖励指标
          if (nationalAreaData.awardCategories && nationalAreaData.awardCategories.length > 0) {
            for (const awardCategory of nationalAreaData.awardCategories) {
              const category = this.mapNationalAreaCategory(awardCategory.category);
              if (!category) {
                errors.push(`未知的 National & Area Incentive 类别: ${awardCategory.category}`);
                continue;
              }

              // 创建新的奖励指标
              const awardIndicatorInput: CreateAwardIndicatorInput = {
                level: 'national_area_incentive',
                category,
                title: `${nationalAreaData.title} - ${awardCategory.category}`,
                description: nationalAreaData.description,
                year: targetYear,
                createdBy: 'migration'
              };

              const awardIndicatorId = await awardIndicatorService.saveAwardIndicator(awardIndicatorInput);

              // 迁移 awards 数据
              if (awardCategory.awards && awardCategory.awards.length > 0) {
                for (const award of awardCategory.awards) {
                  const indicatorInput: CreateIndicatorInput = {
                    awardIndicatorId,
                    no: parseInt(award.no.replace(/\D/g, '')) || 1, // 提取数字
                    title: award.title,
                    description: award.description || '',
                    deadline: award.deadline || '',
                    externalLink: award.externalLink,
                    score: 0, // National & Area Incentive 通常没有分数
                    status: (award.status === 'open' ? 'pending' : 'completed') as 'pending' | 'completed' | 'overdue',
                    guidelines: award.guidelines,
                    responsiblePerson: award.responsiblePerson,
                    team: award.team,
                    teamManagement: award.teamManagement,
                    scoreSettings: award.scoreSettings,
                    // National & Area Incentive 特有字段
                    nationalAllocation: award.nationalAllocation,
                    areaAllocation: award.areaAllocation,
                    createdBy: 'migration'
                  };

                  await awardIndicatorService.saveIndicator(indicatorInput);
                }
              }

              migrated++;
              console.log(`迁移 National & Area Incentive: ${awardCategory.category}`);
            }
          }

        } catch (error) {
          const errorMsg = `迁移 National & Area Incentive 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `获取 National & Area Incentive 数据失败: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }

    return { migrated, errors };
  }

  /**
   * 迁移 E-Awards 数据
   */
  private async migrateEAwardsData(sourceYear: number, targetYear: number): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // 获取现有的 E-Awards 数据
      const q = query(
        collection(db, this.OLD_COLLECTIONS.E_AWARDS),
        where('year', '==', sourceYear)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('未找到 E-Awards 数据');
        return { migrated: 0, errors: [] };
      }

      for (const docSnap of querySnapshot.docs) {
        try {
          const eAwardData = docSnap.data() as EAward;
          
          // 确定 E-Award 类别
          const category = this.mapEAwardCategory(eAwardData.title);
          if (!category) {
            errors.push(`未知的 E-Award 类别: ${eAwardData.title}`);
            continue;
          }

          // 创建新的奖励指标
          const awardIndicatorInput: CreateAwardIndicatorInput = {
            level: 'e_awards',
            category,
            title: eAwardData.title,
            description: eAwardData.description,
            year: targetYear,
            createdBy: 'migration'
          };

          const awardIndicatorId = await awardIndicatorService.saveAwardIndicator(awardIndicatorInput);

          // 创建基础指标
          const indicatorInput: CreateIndicatorInput = {
            awardIndicatorId,
            no: 1,
            title: eAwardData.title,
            description: eAwardData.description,
            deadline: eAwardData.deadline || '',
            score: eAwardData.maxScore || 0,
            status: (eAwardData.status === 'open' ? 'pending' : 'completed') as 'pending' | 'completed' | 'overdue',
            guidelines: eAwardData.instructions,
            // E-Awards 特有字段
            submissionPeriod: eAwardData.submissionPeriod,
            requirements: eAwardData.requirements,
            createdBy: 'migration'
          };

          await awardIndicatorService.saveIndicator(indicatorInput);

          migrated++;
          console.log(`迁移 E-Award: ${eAwardData.title}`);

        } catch (error) {
          const errorMsg = `迁移 E-Award 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `获取 E-Awards 数据失败: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }

    return { migrated, errors };
  }

  /**
   * 映射 Star Point 类别
   */
  private mapStarPointCategory(oldCategory: string): StarPointCategory | null {
    const mapping: { [key: string]: StarPointCategory } = {
      'network_star': 'network_star',
      'experience_star': 'experience_star',
      'social_star': 'social_star',
      'outreach_star': 'outreach_star'
    };
    return mapping[oldCategory] || null;
  }

  /**
   * 映射 National & Area Incentive 类别
   */
  private mapNationalAreaCategory(oldCategory: string): NationalAreaCategory | null {
    const mapping: { [key: string]: NationalAreaCategory } = {
      'A. Individual Awards': 'individual_award',
      'B. Local Organisation Awards': 'local_organisation_award',
      'C. Area Awards': 'area_award',
      'D. Special Awards': 'special_award',
      'E. JCI Junior': 'jci_junior',
      'F. Youth Awards': 'youth_awards'
    };
    return mapping[oldCategory] || null;
  }

  /**
   * 映射 E-Award 类别
   */
  private mapEAwardCategory(title: string): EAwardCategory | null {
    if (title.toLowerCase().includes('multi entry')) {
      return 'multi_entry_award';
    } else if (title.toLowerCase().includes('best of the best')) {
      return 'best_of_the_best_award';
    }
    return null;
  }

  /**
   * 验证迁移结果
   */
  async validateMigration(targetYear: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // 检查新系统中的数据
      const newAwardIndicators = await awardIndicatorService.getAllAwardIndicators(targetYear);
      
      if (newAwardIndicators.length === 0) {
        issues.push('新系统中没有找到任何奖励指标数据');
        return { valid: false, issues };
      }

      // 检查每个奖励指标是否有指标数据
      for (const awardIndicator of newAwardIndicators) {
        if (awardIndicator.indicators.length === 0) {
          issues.push(`奖励指标 "${awardIndicator.title}" 没有关联的指标数据`);
        }
      }

      // 检查数据完整性
      const stats = await awardIndicatorService.getAwardIndicatorStats(targetYear);
      if (stats.totalIndicators === 0) {
        issues.push('统计显示总指标数为0');
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      issues.push(`验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return { valid: false, issues };
    }
  }

  /**
   * 清理迁移数据（回滚）
   */
  async rollbackMigration(targetYear: number): Promise<{ success: boolean; message: string }> {
    try {
      const awardIndicators = await awardIndicatorService.getAllAwardIndicators(targetYear);
      
      for (const awardIndicator of awardIndicators) {
        await awardIndicatorService.deleteAwardIndicator(awardIndicator.id);
      }

      return {
        success: true,
        message: `成功回滚 ${targetYear} 年的迁移数据`
      };

    } catch (error) {
      return {
        success: false,
        message: `回滚失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

// 导出单例实例
export const awardDataMigration = new AwardDataMigration();
