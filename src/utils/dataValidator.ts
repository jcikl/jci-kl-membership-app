import { 
  AwardIndicator, 
  Indicator, 
  AwardLevel, 
  AwardCategoryType,
  StarPointCategory,
  NationalAreaCategory,
  EAwardCategory
} from '@/types/awardIndicators';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataIntegrityReport {
  totalAwardIndicators: number;
  totalIndicators: number;
  issues: {
    missingData: string[];
    invalidData: string[];
    inconsistentData: string[];
  };
  recommendations: string[];
}

class DataValidator {
  /**
   * 验证奖励指标数据
   */
  validateAwardIndicator(awardIndicator: AwardIndicator): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段验证
    if (!awardIndicator.id) {
      errors.push('奖励指标ID不能为空');
    }

    if (!awardIndicator.level) {
      errors.push('奖励层级不能为空');
    } else if (!this.isValidAwardLevel(awardIndicator.level)) {
      errors.push(`无效的奖励层级: ${awardIndicator.level}`);
    }

    if (!awardIndicator.category) {
      errors.push('奖励类别不能为空');
    } else if (!this.isValidCategory(awardIndicator.level, awardIndicator.category)) {
      errors.push(`无效的奖励类别: ${awardIndicator.category}`);
    }

    if (!awardIndicator.title || awardIndicator.title.trim() === '') {
      errors.push('奖励指标标题不能为空');
    }

    if (!awardIndicator.year || awardIndicator.year < 2020 || awardIndicator.year > 2030) {
      errors.push('年份必须在2020-2030之间');
    }

    if (!awardIndicator.status) {
      errors.push('状态不能为空');
    } else if (!['active', 'inactive', 'draft'].includes(awardIndicator.status)) {
      errors.push(`无效的状态: ${awardIndicator.status}`);
    }

    // 元数据验证
    if (!awardIndicator.createdAt) {
      errors.push('创建时间不能为空');
    }

    if (!awardIndicator.updatedAt) {
      errors.push('更新时间不能为空');
    }

    if (!awardIndicator.createdBy) {
      errors.push('创建者不能为空');
    }

    // 警告检查
    if (awardIndicator.indicators.length === 0) {
      warnings.push('奖励指标没有关联的指标数据');
    }

    if (awardIndicator.description && awardIndicator.description.length > 500) {
      warnings.push('描述过长，建议控制在500字符以内');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证指标数据
   */
  validateIndicator(indicator: Indicator): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段验证
    if (!indicator.id) {
      errors.push('指标ID不能为空');
    }

    if (!indicator.no || indicator.no <= 0) {
      errors.push('指标序号必须大于0');
    }

    if (!indicator.title || indicator.title.trim() === '') {
      errors.push('指标标题不能为空');
    }

    if (!indicator.description || indicator.description.trim() === '') {
      errors.push('指标描述不能为空');
    }

    if (!indicator.deadline) {
      errors.push('截止日期不能为空');
    } else if (!this.isValidDate(indicator.deadline)) {
      errors.push('截止日期格式无效');
    }

    if (indicator.score === undefined || indicator.score < 0) {
      errors.push('分数不能为负数');
    }

    if (!indicator.status) {
      errors.push('状态不能为空');
    } else if (!['pending', 'completed', 'overdue'].includes(indicator.status)) {
      errors.push(`无效的状态: ${indicator.status}`);
    }

    // 元数据验证
    if (!indicator.createdAt) {
      errors.push('创建时间不能为空');
    }

    if (!indicator.updatedAt) {
      errors.push('更新时间不能为空');
    }

    if (!indicator.createdBy) {
      errors.push('创建者不能为空');
    }

    // 警告检查
    if (indicator.score > 1000) {
      warnings.push('分数过高，请确认是否正确');
    }

    if (indicator.myScore && indicator.myScore > indicator.score) {
      warnings.push('当前分数超过总分，请确认是否正确');
    }

    if (indicator.externalLink && !this.isValidUrl(indicator.externalLink)) {
      warnings.push('外部链接格式可能无效');
    }

    if (indicator.scoreSettings && indicator.scoreSettings.length > 20) {
      warnings.push('分数设置过多，可能影响性能');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity(awardIndicators: AwardIndicator[]): Promise<DataIntegrityReport> {
    const issues = {
      missingData: [] as string[],
      invalidData: [] as string[],
      inconsistentData: [] as string[]
    };
    const recommendations: string[] = [];

    let totalIndicators = 0;

    for (const awardIndicator of awardIndicators) {
      // 验证奖励指标
      const awardIndicatorValidation = this.validateAwardIndicator(awardIndicator);
      if (!awardIndicatorValidation.isValid) {
        issues.invalidData.push(`奖励指标 "${awardIndicator.title}": ${awardIndicatorValidation.errors.join(', ')}`);
      }

      // 验证关联的指标
      for (const indicator of awardIndicator.indicators) {
        totalIndicators++;
        const indicatorValidation = this.validateIndicator(indicator);
        if (!indicatorValidation.isValid) {
          issues.invalidData.push(`指标 "${indicator.title}": ${indicatorValidation.errors.join(', ')}`);
        }
      }

      // 检查序号连续性
      const numbers = awardIndicator.indicators.map(ind => ind.no).sort((a, b) => a - b);
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i - 1] + 1) {
          issues.inconsistentData.push(`奖励指标 "${awardIndicator.title}" 的序号不连续`);
          break;
        }
      }

      // 检查重复序号
      const duplicateNumbers = numbers.filter((num, index) => numbers.indexOf(num) !== index);
      if (duplicateNumbers.length > 0) {
        issues.inconsistentData.push(`奖励指标 "${awardIndicator.title}" 存在重复序号: ${duplicateNumbers.join(', ')}`);
      }
    }

    // 生成建议
    if (issues.missingData.length > 0) {
      recommendations.push('请补充缺失的数据字段');
    }

    if (issues.invalidData.length > 0) {
      recommendations.push('请修正无效的数据格式');
    }

    if (issues.inconsistentData.length > 0) {
      recommendations.push('请检查数据的一致性问题');
    }

    if (totalIndicators === 0) {
      recommendations.push('建议添加一些指标数据');
    }

    return {
      totalAwardIndicators: awardIndicators.length,
      totalIndicators,
      issues,
      recommendations
    };
  }

  /**
   * 验证奖励层级
   */
  private isValidAwardLevel(level: string): level is AwardLevel {
    return ['star_point', 'national_area_incentive', 'e_awards'].includes(level);
  }

  /**
   * 验证奖励类别
   */
  private isValidCategory(level: AwardLevel, category: string): category is AwardCategoryType {
    switch (level) {
      case 'star_point':
        return this.isValidStarPointCategory(category);
      case 'national_area_incentive':
        return this.isValidNationalAreaCategory(category);
      case 'e_awards':
        return this.isValidEAwardCategory(category);
      default:
        return false;
    }
  }

  /**
   * 验证 Star Point 类别
   */
  private isValidStarPointCategory(category: string): category is StarPointCategory {
    return ['efficient_star', 'network_star', 'experience_star', 'outreach_star', 'social_star'].includes(category);
  }

  /**
   * 验证 National & Area Incentive 类别
   */
  private isValidNationalAreaCategory(category: string): category is NationalAreaCategory {
    return ['individual_award', 'local_organisation_award', 'area_award', 'special_award', 'jci_junior', 'youth_awards'].includes(category);
  }

  /**
   * 验证 E-Award 类别
   */
  private isValidEAwardCategory(category: string): category is EAwardCategory {
    return ['multi_entry_award', 'best_of_the_best_award'].includes(category);
  }

  /**
   * 验证日期格式
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成数据质量报告
   */
  generateQualityReport(awardIndicators: AwardIndicator[]): {
    score: number;
    details: {
      completeness: number;
      consistency: number;
      validity: number;
    };
    summary: string;
  } {
    let totalChecks = 0;
    let passedChecks = 0;

    // 完整性检查
    const completenessChecks = awardIndicators.length * 5; // 5个必填字段
    let completenessPassed = 0;

    for (const awardIndicator of awardIndicators) {
      if (awardIndicator.id) completenessPassed++;
      if (awardIndicator.title) completenessPassed++;
      if (awardIndicator.description) completenessPassed++;
      if (awardIndicator.year) completenessPassed++;
      if (awardIndicator.status) completenessPassed++;
    }

    // 一致性检查
    const consistencyChecks = awardIndicators.length;
    let consistencyPassed = 0;

    for (const awardIndicator of awardIndicators) {
      const numbers = awardIndicator.indicators.map(ind => ind.no);
      const hasDuplicates = numbers.length !== new Set(numbers).size;
      if (!hasDuplicates) consistencyPassed++;
    }

    // 有效性检查
    const validityChecks = awardIndicators.length;
    let validityPassed = 0;

    for (const awardIndicator of awardIndicators) {
      const validation = this.validateAwardIndicator(awardIndicator);
      if (validation.isValid) validityPassed++;
    }

    totalChecks = completenessChecks + consistencyChecks + validityChecks;
    passedChecks = completenessPassed + consistencyPassed + validityPassed;

    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    return {
      score,
      details: {
        completeness: completenessChecks > 0 ? Math.round((completenessPassed / completenessChecks) * 100) : 0,
        consistency: consistencyChecks > 0 ? Math.round((consistencyPassed / consistencyChecks) * 100) : 0,
        validity: validityChecks > 0 ? Math.round((validityPassed / validityChecks) * 100) : 0
      },
      summary: score >= 90 ? '数据质量优秀' : 
               score >= 70 ? '数据质量良好' : 
               score >= 50 ? '数据质量一般' : '数据质量需要改进'
    };
  }
}

// 导出单例实例
export const dataValidator = new DataValidator();
