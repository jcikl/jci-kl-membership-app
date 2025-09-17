import dayjs from 'dayjs';
import { StandardEditModalData, ValidationResult } from '@/types/pdfInterpretation';

/**
 * 数据验证服务
 * 负责验证StandardEditModal数据的完整性和正确性
 */
export class DataValidationService {
  private static instance: DataValidationService;
  
  public static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * 验证StandardEditModal数据
   */
  validateStandardFields(data: StandardEditModalData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 开始数据验证:', {
        title: data.title,
        awardType: data.awardType,
        confidence: data.confidence
      });

      // 基础字段验证
      this.validateBasicFields(data, errors, warnings);

      // 奖项类型特定验证
      this.validateAwardTypeSpecificFields(data, errors, warnings);

      // 分数规则验证
      this.validateScoreRules(data.scoreRules, errors, warnings);

      // 团队管理验证
      if (data.teamManagement) {
        this.validateTeamManagement(data.teamManagement, errors, warnings);
      }

      // 元数据验证
      this.validateMetadata(data, errors, warnings);

      console.log('✅ 数据验证完成:', {
        errorsCount: errors.length,
        warningsCount: warnings.length,
        isValid: errors.length === 0
      });

      return {
        errors,
        warnings,
        isValid: errors.length === 0
      };
    } catch (error) {
      console.error('❌ 数据验证失败:', error);
      return {
        errors: [`数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`],
        warnings: [],
        isValid: false
      };
    }
  }

  /**
   * 验证基础字段
   */
  private validateBasicFields(data: StandardEditModalData, errors: string[], warnings: string[]): void {
    // 标题验证
    if (!data.title || data.title.trim().length === 0) {
      errors.push('标题不能为空');
    } else if (data.title.trim().length < 2) {
      warnings.push('标题过短，建议提供更详细的标题');
    } else if (data.title.trim().length > 200) {
      warnings.push('标题过长，建议控制在200字符以内');
    }

    // 描述验证
    if (!data.description || data.description.trim().length === 0) {
      errors.push('描述不能为空');
    } else if (data.description.trim().length < 10) {
      warnings.push('描述过短，建议提供更详细的描述');
    } else if (data.description.trim().length > 2000) {
      warnings.push('描述过长，建议控制在2000字符以内');
    }

    // 截止日期验证
    if (!data.deadline) {
      errors.push('截止日期不能为空');
    } else {
      const deadlineDate = dayjs(data.deadline, 'YYYY-MM-DD', true);
      if (!deadlineDate.isValid()) {
        errors.push('截止日期格式不正确，应为YYYY-MM-DD格式');
      } else {
        const now = dayjs();
        if (deadlineDate.isBefore(now)) {
          warnings.push('截止日期已过，请检查日期是否正确');
        } else if (deadlineDate.isAfter(now.add(5, 'year'))) {
          warnings.push('截止日期过远，请检查日期是否正确');
        }
      }
    }

    // 外部链接验证
    if (data.externalLink) {
      if (!this.isValidURL(data.externalLink)) {
        warnings.push('外部链接格式可能不正确');
      }
    }
  }

  /**
   * 验证奖项类型特定字段
   */
  private validateAwardTypeSpecificFields(data: StandardEditModalData, errors: string[], warnings: string[]): void {
    switch (data.awardType) {
      case 'efficient_star':
        this.validateEfficientStarFields(data, errors, warnings);
        break;
      case 'star_point':
        this.validateStarPointFields(data, errors, warnings);
        break;
      case 'national_area_incentive':
        this.validateNationalAreaIncentiveFields(data, errors, warnings);
        break;
      default:
        warnings.push(`未知的奖项类型: ${data.awardType}`);
    }
  }

  /**
   * 验证Efficient Star字段
   */
  private validateEfficientStarFields(data: StandardEditModalData, errors: string[], warnings: string[]): void {
    if (data.no !== undefined && data.no !== null) {
      if (!Number.isInteger(data.no) || data.no <= 0) {
        errors.push('序号必须是正整数');
      }
    } else {
      warnings.push('Efficient Star类型建议包含序号');
    }

    if (data.guidelines && data.guidelines.trim().length > 1000) {
      warnings.push('指导原则过长，建议控制在1000字符以内');
    }
  }

  /**
   * 验证Star Point字段
   */
  private validateStarPointFields(data: StandardEditModalData, errors: string[], warnings: string[]): void {
    if (data.objective !== undefined && data.objective !== null) {
      if (!Number.isFinite(data.objective) || data.objective < 0) {
        errors.push('目标分数必须是非负数');
      } else if (data.objective > 10000) {
        warnings.push('目标分数过大，请检查是否正确');
      }
    } else {
      warnings.push('Star Point类型建议包含目标分数');
    }

    if (!data.category && !data.categoryId) {
      warnings.push('Star Point类型建议包含类别信息');
    }
  }

  /**
   * 验证National Area Incentive字段
   */
  private validateNationalAreaIncentiveFields(data: StandardEditModalData, errors: string[], warnings: string[]): void {
    if (!data.nationalAllocation || data.nationalAllocation.trim().length === 0) {
      warnings.push('National Area Incentive类型建议包含国家级分配信息');
    }

    if (!data.areaAllocation || data.areaAllocation.trim().length === 0) {
      warnings.push('National Area Incentive类型建议包含区域级分配信息');
    }

    if (data.status) {
      const validStatuses = ['open', 'closed', 'completed'];
      if (!validStatuses.includes(data.status)) {
        errors.push(`状态值无效，应为: ${validStatuses.join(', ')}`);
      }
    } else {
      warnings.push('National Area Incentive类型建议包含状态信息');
    }
  }

  /**
   * 验证分数规则
   */
  private validateScoreRules(scoreRules: any[], errors: string[], warnings: string[]): void {
    if (!Array.isArray(scoreRules)) {
      warnings.push('分数规则应为数组格式');
      return;
    }

    if (scoreRules.length === 0) {
      warnings.push('建议添加至少一个分数规则');
      return;
    }

    scoreRules.forEach((rule, index) => {
      const rulePrefix = `分数规则${index + 1}`;

      // 规则名称验证
      if (!rule.name || rule.name.trim().length === 0) {
        warnings.push(`${rulePrefix}: 建议提供规则名称`);
      }

      // 基础分数验证
      if (rule.baseScore !== undefined && rule.baseScore !== null) {
        if (!Number.isFinite(rule.baseScore) || rule.baseScore < 0) {
          errors.push(`${rulePrefix}: 基础分数必须是非负数`);
        }
      }

      // 条件验证
      if (!Array.isArray(rule.conditions)) {
        warnings.push(`${rulePrefix}: 条件应为数组格式`);
      } else if (rule.conditions.length === 0) {
        warnings.push(`${rulePrefix}: 建议添加至少一个条件`);
      } else {
        rule.conditions.forEach((condition: any, conditionIndex: number) => {
          this.validateScoreCondition(condition, `${rulePrefix}-条件${conditionIndex + 1}`, errors, warnings);
        });
      }
    });
  }

  /**
   * 验证分数条件
   */
  private validateScoreCondition(condition: any, prefix: string, errors: string[], _warnings: string[]): void {
    // 条件类型验证
    const validTypes = [
      'memberCount', 'nonMemberCount', 'totalCount', 'activityCount',
      'activityType', 'activityCategory', 'specificActivity', 'partnerCount'
    ];
    
    if (!condition.type || !validTypes.includes(condition.type)) {
      errors.push(`${prefix}: 条件类型无效，应为: ${validTypes.join(', ')}`);
    }

    // 积分验证
    if (condition.points !== undefined && condition.points !== null) {
      if (!Number.isFinite(condition.points) || condition.points < 0) {
        errors.push(`${prefix}: 积分必须是非负数`);
      }
    }

    // 数值类型条件验证
    const numericFields = ['memberCount', 'nonMemberCount', 'totalCount', 'activityCount', 'partnerCount'];
    numericFields.forEach(field => {
      if (condition[field] !== undefined && condition[field] !== null) {
        if (!Number.isInteger(condition[field]) || condition[field] < 0) {
          errors.push(`${prefix}: ${field}必须是非负整数`);
        }
      }
    });

    // 字符串类型条件验证
    const stringFields = ['activityType', 'activityCategory', 'specificActivity', 'partnerType'];
    stringFields.forEach(field => {
      if (condition[field] && typeof condition[field] !== 'string') {
        errors.push(`${prefix}: ${field}应为字符串类型`);
      }
    });
  }

  /**
   * 验证团队管理
   */
  private validateTeamManagement(teamManagement: any, errors: string[], warnings: string[]): void {
    if (!teamManagement.positions || !Array.isArray(teamManagement.positions)) {
      warnings.push('团队管理中的职位应为数组格式');
      return;
    }

    if (teamManagement.positions.length === 0) {
      warnings.push('建议添加至少一个团队职位');
      return;
    }

    teamManagement.positions.forEach((position: any, index: number) => {
      const positionPrefix = `职位${index + 1}`;

      if (!position.name || position.name.trim().length === 0) {
        errors.push(`${positionPrefix}: 职位名称不能为空`);
      }

      if (position.maxMembers !== undefined && position.maxMembers !== null) {
        if (!Number.isInteger(position.maxMembers) || position.maxMembers <= 0) {
          errors.push(`${positionPrefix}: 最大成员数必须是正整数`);
        }
      }

      if (typeof position.isRequired !== 'boolean') {
        warnings.push(`${positionPrefix}: isRequired应为布尔值`);
      }
    });
  }

  /**
   * 验证元数据
   */
  private validateMetadata(data: StandardEditModalData, _errors: string[], warnings: string[]): void {
    // 置信度验证
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      warnings.push('置信度应在0-1之间');
    } else if (data.confidence < 0.5) {
      warnings.push('解读置信度较低，建议手动检查和编辑数据');
    }

    // 关键词验证
    if (!Array.isArray(data.extractedKeywords)) {
      warnings.push('提取的关键词应为数组格式');
    } else if (data.extractedKeywords.length === 0) {
      warnings.push('未提取到关键词，可能影响解读质量');
    }

    // 原始内容验证
    if (!data.originalPDFContent || data.originalPDFContent.trim().length === 0) {
      warnings.push('原始PDF内容为空');
    }
  }

  /**
   * 验证URL格式
   */
  private isValidURL(url: string): boolean {
    try {
      // 支持有或没有协议前缀的URL
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      return urlPattern.test(url);
    } catch {
      return false;
    }
  }

  /**
   * 获取默认值
   */
  getDefaultValues(awardType: string): Partial<StandardEditModalData> {
    const defaults: { [key: string]: Partial<StandardEditModalData> } = {
      efficient_star: {
        no: 1,
        guidelines: '',
        status: 'open'
      },
      star_point: {
        objective: 100,
        status: 'open'
      },
      national_area_incentive: {
        nationalAllocation: '-',
        areaAllocation: '-',
        status: 'open'
      }
    };

    return defaults[awardType] || {
      status: 'open'
    };
  }

  /**
   * 修复常见的数据问题
   */
  fixCommonIssues(data: StandardEditModalData): StandardEditModalData {
    const fixedData = { ...data };

    try {
      console.log('🔧 开始修复常见数据问题');

      // 修复标题
      if (fixedData.title) {
        fixedData.title = fixedData.title.trim();
      }

      // 修复描述
      if (fixedData.description) {
        fixedData.description = fixedData.description.trim();
      }

      // 修复日期格式
      if (fixedData.deadline) {
        const parsedDate = dayjs(fixedData.deadline);
        if (parsedDate.isValid()) {
          fixedData.deadline = parsedDate.format('YYYY-MM-DD');
        }
      }

      // 修复数值字段
      if (fixedData.no !== undefined && fixedData.no !== null) {
        fixedData.no = Math.max(1, Math.floor(Number(fixedData.no)));
      }

      if (fixedData.objective !== undefined && fixedData.objective !== null) {
        fixedData.objective = Math.max(0, Number(fixedData.objective));
      }

      // 修复分数规则
      if (Array.isArray(fixedData.scoreRules)) {
        fixedData.scoreRules = fixedData.scoreRules.map(rule => ({
          ...rule,
          baseScore: Math.max(0, Number(rule.baseScore) || 0),
          conditions: Array.isArray(rule.conditions) ? rule.conditions.map(condition => ({
            ...condition,
            points: Math.max(0, Number(condition.points) || 0),
            memberCount: condition.memberCount ? Math.max(0, Math.floor(Number(condition.memberCount))) : undefined,
            nonMemberCount: condition.nonMemberCount ? Math.max(0, Math.floor(Number(condition.nonMemberCount))) : undefined,
            totalCount: condition.totalCount ? Math.max(0, Math.floor(Number(condition.totalCount))) : undefined,
            activityCount: condition.activityCount ? Math.max(0, Math.floor(Number(condition.activityCount))) : undefined,
            partnerCount: condition.partnerCount ? Math.max(0, Math.floor(Number(condition.partnerCount))) : undefined
          })) : []
        }));
      }

      console.log('✅ 数据修复完成');
      return fixedData;
    } catch (error) {
      console.warn('⚠️ 数据修复失败:', error);
      return data;
    }
  }
}

// 导出单例实例
export const dataValidationService = DataValidationService.getInstance();
