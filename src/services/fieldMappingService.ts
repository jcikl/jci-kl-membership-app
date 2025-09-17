import dayjs from 'dayjs';
import { ChatGPTResponse, StandardEditModalData, ScoreRule, ScoreCondition, TeamPosition } from '@/types/pdfInterpretation';

/**
 * 字段映射服务
 * 负责将ChatGPT响应映射到StandardEditModal所需的数据格式
 */
export class FieldMappingService {
  private static instance: FieldMappingService;
  
  public static getInstance(): FieldMappingService {
    if (!FieldMappingService.instance) {
      FieldMappingService.instance = new FieldMappingService();
    }
    return FieldMappingService.instance;
  }

  /**
   * 将ChatGPT响应映射到StandardEditModal字段
   */
  mapToStandardFields(
    chatGPTResponse: ChatGPTResponse, 
    originalPDFContent: string
  ): StandardEditModalData {
    try {
      console.log('🔄 开始字段映射:', {
        awardType: chatGPTResponse.awardType,
        confidence: chatGPTResponse.confidence
      });

      const mappedData: StandardEditModalData = {
        // 基础字段映射
        title: this.sanitizeString(chatGPTResponse.basicFields.title),
        description: this.sanitizeString(chatGPTResponse.basicFields.description),
        deadline: this.parseDate(chatGPTResponse.basicFields.deadline),
        externalLink: chatGPTResponse.basicFields.externalLink ? this.sanitizeString(chatGPTResponse.basicFields.externalLink) : undefined,
        
        // 类别字段映射
        categoryId: chatGPTResponse.categoryFields.categoryId || undefined,
        category: chatGPTResponse.categoryFields.category || undefined,
        
        // 特定字段映射
        ...this.mapSpecificFields(chatGPTResponse),
        
        // 分数规则映射
        scoreRules: this.mapScoreRules(chatGPTResponse.scoreRules),
        
        // 团队管理映射
        teamManagement: chatGPTResponse.teamManagement ? {
          positions: this.mapTeamPositions(chatGPTResponse.teamManagement.positions)
        } : undefined,
        
        // 元数据
        awardType: chatGPTResponse.awardType,
        confidence: chatGPTResponse.confidence,
        extractedKeywords: chatGPTResponse.extractedKeywords,
        notes: chatGPTResponse.notes,
        originalPDFContent,
        chatGPTResponse
      };

      console.log('✅ 字段映射完成:', {
        title: mappedData.title,
        deadline: mappedData.deadline,
        scoreRulesCount: mappedData.scoreRules.length,
        hasTeamManagement: !!mappedData.teamManagement
      });

      return mappedData;
    } catch (error) {
      console.error('❌ 字段映射失败:', error);
      throw new Error(`字段映射失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 映射特定字段
   */
  private mapSpecificFields(chatGPTResponse: ChatGPTResponse): Partial<StandardEditModalData> {
    const specificFields: Partial<StandardEditModalData> = {};
    
    // Efficient Star字段
    if (chatGPTResponse.awardType === 'efficient_star') {
      if (chatGPTResponse.specificFields.no !== null && chatGPTResponse.specificFields.no !== undefined) {
        specificFields.no = Number(chatGPTResponse.specificFields.no);
      }
      if (chatGPTResponse.specificFields.guidelines) {
        specificFields.guidelines = this.sanitizeString(chatGPTResponse.specificFields.guidelines);
      }
    }
    
    // Star Point字段
    if (chatGPTResponse.awardType === 'star_point') {
      if (chatGPTResponse.specificFields.objective !== null && chatGPTResponse.specificFields.objective !== undefined) {
        specificFields.objective = Number(chatGPTResponse.specificFields.objective);
      }
    }
    
    // National Area Incentive字段
    if (chatGPTResponse.awardType === 'national_area_incentive') {
      if (chatGPTResponse.specificFields.nationalAllocation) {
        specificFields.nationalAllocation = this.sanitizeString(chatGPTResponse.specificFields.nationalAllocation);
      }
      if (chatGPTResponse.specificFields.areaAllocation) {
        specificFields.areaAllocation = this.sanitizeString(chatGPTResponse.specificFields.areaAllocation);
      }
      if (chatGPTResponse.specificFields.status) {
        specificFields.status = chatGPTResponse.specificFields.status;
      }
    }

    return specificFields;
  }

  /**
   * 映射分数规则
   */
  private mapScoreRules(scoreRules: any[]): ScoreRule[] {
    return scoreRules.map((rule, index) => ({
      id: rule.id || `score_rule_${Date.now()}_${index}`,
      name: this.sanitizeString(rule.name || `规则${index + 1}`),
      baseScore: Number(rule.baseScore) || 0,
      description: this.sanitizeString(rule.description || ''),
      enabled: Boolean(rule.enabled),
      conditions: this.mapScoreConditions(rule.conditions || [], index)
    }));
  }

  /**
   * 映射分数条件
   */
  private mapScoreConditions(conditions: any[], ruleIndex: number): ScoreCondition[] {
    return conditions.map((condition, index) => ({
      id: condition.id || `score_condition_${Date.now()}_${ruleIndex}_${index}`,
      type: condition.type || 'memberCount',
      memberCount: condition.memberCount ? Number(condition.memberCount) : undefined,
      nonMemberCount: condition.nonMemberCount ? Number(condition.nonMemberCount) : undefined,
      totalCount: condition.totalCount ? Number(condition.totalCount) : undefined,
      activityCount: condition.activityCount ? Number(condition.activityCount) : undefined,
      activityType: condition.activityType ? this.sanitizeString(condition.activityType) : undefined,
      activityCategory: condition.activityCategory ? this.sanitizeString(condition.activityCategory) : undefined,
      specificActivity: condition.specificActivity ? this.sanitizeString(condition.specificActivity) : undefined,
      partnerCount: condition.partnerCount ? Number(condition.partnerCount) : undefined,
      partnerType: condition.partnerType ? this.sanitizeString(condition.partnerType) : undefined,
      points: Number(condition.points) || 0,
      description: this.sanitizeString(condition.description || '')
    }));
  }

  /**
   * 映射团队职位
   */
  private mapTeamPositions(positions: any[]): TeamPosition[] {
    return positions.map((position, index) => ({
      id: position.id || `position_${Date.now()}_${index}`,
      name: this.sanitizeString(position.name || `职位${index + 1}`),
      description: this.sanitizeString(position.description || ''),
      isRequired: Boolean(position.isRequired),
      maxMembers: position.maxMembers ? Number(position.maxMembers) : undefined
    }));
  }

  /**
   * 解析日期字符串
   */
  private parseDate(dateString: string): string {
    if (!dateString) {
      return dayjs().add(1, 'year').format('YYYY-MM-DD'); // 默认一年后
    }

    try {
      // 尝试多种日期格式
      const formats = [
        'YYYY-MM-DD',
        'YYYY/MM/DD',
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'YYYY年MM月DD日',
        'DD-MM-YYYY',
        'MM-DD-YYYY'
      ];

      for (const format of formats) {
        const parsed = dayjs(dateString, format, true);
        if (parsed.isValid()) {
          return parsed.format('YYYY-MM-DD');
        }
      }

      // 如果所有格式都失败，尝试自动解析
      const autoParsed = dayjs(dateString);
      if (autoParsed.isValid()) {
        return autoParsed.format('YYYY-MM-DD');
      }

      console.warn('⚠️ 无法解析日期:', dateString, '使用默认日期');
      return dayjs().add(1, 'year').format('YYYY-MM-DD');
    } catch (error) {
      console.warn('⚠️ 日期解析错误:', error, '使用默认日期');
      return dayjs().add(1, 'year').format('YYYY-MM-DD');
    }
  }

  /**
   * 清理字符串
   */
  private sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }

    return str
      .trim()
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[\r\n]+/g, ' ') // 替换换行符
      .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, '') // 保留基本ASCII和中文字符
      .trim();
  }

  /**
   * 验证映射后的数据
   */
  validateMappedData(data: StandardEditModalData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段验证
    if (!data.title || data.title.trim().length === 0) {
      errors.push('标题不能为空');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('描述不能为空');
    }

    if (!data.deadline) {
      errors.push('截止日期不能为空');
    }

    // 日期格式验证
    if (data.deadline && !dayjs(data.deadline, 'YYYY-MM-DD', true).isValid()) {
      errors.push('截止日期格式不正确');
    }

    // URL格式验证
    if (data.externalLink && !this.isValidURL(data.externalLink)) {
      warnings.push('外部链接格式可能不正确');
    }

    // 奖项类型特定验证
    if (data.awardType === 'efficient_star') {
      if (!data.no || data.no <= 0) {
        warnings.push('Efficient Star类型建议包含有效的序号');
      }
    }

    if (data.awardType === 'star_point') {
      if (!data.objective || data.objective <= 0) {
        warnings.push('Star Point类型建议包含有效的目标分数');
      }
    }

    if (data.awardType === 'national_area_incentive') {
      if (!data.nationalAllocation) {
        warnings.push('National Area Incentive类型建议包含国家级分配信息');
      }
      if (!data.areaAllocation) {
        warnings.push('National Area Incentive类型建议包含区域级分配信息');
      }
    }

    // 置信度检查
    if (data.confidence < 0.5) {
      warnings.push('解读置信度较低，建议手动检查和编辑数据');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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
}

// 导出单例实例
export const fieldMappingService = FieldMappingService.getInstance();
