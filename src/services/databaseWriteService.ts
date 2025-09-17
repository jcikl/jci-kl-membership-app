import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { StandardEditModalData, SaveResult, InterpretationLog } from '@/types/pdfInterpretation';

/**
 * 数据库写入服务
 * 负责将解读后的数据保存到Firebase数据库
 */
export class DatabaseWriteService {
  private static instance: DatabaseWriteService;
  
  public static getInstance(): DatabaseWriteService {
    if (!DatabaseWriteService.instance) {
      DatabaseWriteService.instance = new DatabaseWriteService();
    }
    return DatabaseWriteService.instance;
  }

  /**
   * 保存StandardEditModal数据到数据库
   */
  async saveStandardData(data: StandardEditModalData, userId: string = 'system'): Promise<SaveResult> {
    try {
      console.log('💾 开始保存数据到数据库:', {
        title: data.title,
        awardType: data.awardType,
        confidence: data.confidence
      });

      // 1. 保存基础指标数据到standards集合
      const standardDoc = await this.saveStandard(data, userId);
      
      // 2. 保存分数规则数据
      if (data.scoreRules && data.scoreRules.length > 0) {
        await this.saveScoreRules(standardDoc.id, data.scoreRules, userId);
      }
      
      // 3. 保存团队管理数据
      if (data.teamManagement) {
        await this.saveTeamManagement(standardDoc.id, data.teamManagement, userId);
      }
      
      // 4. 记录解读日志
      await this.saveInterpretationLog({
        standardId: standardDoc.id,
        originalData: data,
        userId
      });
      
      console.log('✅ 数据保存完成:', {
        standardId: standardDoc.id,
        scoreRulesCount: data.scoreRules.length,
        hasTeamManagement: !!data.teamManagement
      });

      return { 
        success: true, 
        standardId: standardDoc.id 
      };
    } catch (error) {
      console.error('❌ 数据保存失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }

  /**
   * 保存基础指标数据
   */
  private async saveStandard(data: StandardEditModalData, userId: string): Promise<{ id: string }> {
    try {
      // 构建standard文档数据
      const standardData = {
        // 基础字段
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        externalLink: data.externalLink || null,
        
        // 类别字段
        categoryId: data.categoryId || null,
        category: data.category || null,
        
        // 特定字段
        no: data.no || null,
        guidelines: data.guidelines || null,
        objective: data.objective || null,
        nationalAllocation: data.nationalAllocation || null,
        areaAllocation: data.areaAllocation || null,
        status: data.status || 'open',
        
        // 奖项类型
        awardType: data.awardType,
        
        // 元数据
        year: new Date().getFullYear(),
        confidence: data.confidence,
        extractedKeywords: data.extractedKeywords || [],
        notes: data.notes || '',
        
        // 系统字段
        interpretationSource: 'chatgpt',
        originalPdfContent: data.originalPDFContent || '',
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // 移除undefined值
      const cleanData = this.removeUndefinedFields(standardData);

      // 保存到standards集合
      const docRef = await addDoc(collection(db, 'standards'), cleanData);
      
      return { id: docRef.id };
    } catch (error) {
      console.error('❌ 保存standard失败:', error);
      throw error;
    }
  }

  /**
   * 保存分数规则数据
   */
  private async saveScoreRules(standardId: string, scoreRules: any[], userId: string): Promise<void> {
    try {
      console.log('💾 保存分数规则:', scoreRules.length, '项');

      for (const rule of scoreRules) {
        const ruleData = {
          standardId,
          name: rule.name,
          baseScore: rule.baseScore,
          description: rule.description,
          enabled: rule.enabled,
          conditions: rule.conditions || [],
          createdBy: userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // 移除undefined值
        const cleanRuleData = this.removeUndefinedFields(ruleData);
        
        await addDoc(collection(db, 'score_rules'), cleanRuleData);
      }
    } catch (error) {
      console.error('❌ 保存分数规则失败:', error);
      throw error;
    }
  }

  /**
   * 保存团队管理数据
   */
  private async saveTeamManagement(standardId: string, teamManagement: any, userId: string): Promise<void> {
    try {
      console.log('💾 保存团队管理数据');

      const teamData = {
        standardId,
        awardType: teamManagement.awardType || 'efficient_star',
        positions: teamManagement.positions || [],
        members: teamManagement.members || [],
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // 移除undefined值
      const cleanTeamData = this.removeUndefinedFields(teamData);
      
      await addDoc(collection(db, 'team_management'), cleanTeamData);
    } catch (error) {
      console.error('❌ 保存团队管理失败:', error);
      throw error;
    }
  }

  /**
   * 保存解读日志
   */
  private async saveInterpretationLog(logData: {
    standardId: string;
    originalData: StandardEditModalData;
    userId: string;
  }): Promise<void> {
    try {
      console.log('💾 保存解读日志');

      const log: Omit<InterpretationLog, 'id'> = {
        pdfFilename: 'uploaded_file.pdf', // 从originalData中提取
        pdfContentHash: this.generateHash(logData.originalData.originalPDFContent || ''),
        chatGPTResponse: logData.originalData.chatGPTResponse,
        confidence: logData.originalData.confidence,
        extractedKeywords: logData.originalData.extractedKeywords,
        notes: logData.originalData.notes,
        createdAt: new Date().toISOString(),
        createdBy: logData.userId
      };

      // 移除undefined值
      const cleanLog = this.removeUndefinedFields(log);
      
      await addDoc(collection(db, 'interpretation_logs'), {
        ...cleanLog,
        standardId: logData.standardId,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ 保存解读日志失败:', error);
      // 不抛出错误，因为这不是关键操作
    }
  }

  /**
   * 更新现有standard数据
   */
  async updateStandardData(standardId: string, data: StandardEditModalData, userId: string = 'system'): Promise<SaveResult> {
    try {
      console.log('🔄 开始更新standard数据:', standardId);

      // 更新基础数据
      await this.updateStandard(standardId, data, userId);
      
      // 更新分数规则
      if (data.scoreRules && data.scoreRules.length > 0) {
        await this.updateScoreRules(standardId, data.scoreRules, userId);
      }
      
      // 更新团队管理
      if (data.teamManagement) {
        await this.updateTeamManagement(standardId, data.teamManagement, userId);
      }

      console.log('✅ standard数据更新完成');

      return { 
        success: true, 
        standardId 
      };
    } catch (error) {
      console.error('❌ 更新standard数据失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }

  /**
   * 更新基础standard数据
   */
  private async updateStandard(standardId: string, data: StandardEditModalData, userId: string): Promise<void> {
    try {
      const updateData = {
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        externalLink: data.externalLink || null,
        categoryId: data.categoryId || null,
        category: data.category || null,
        no: data.no || null,
        guidelines: data.guidelines || null,
        objective: data.objective || null,
        nationalAllocation: data.nationalAllocation || null,
        areaAllocation: data.areaAllocation || null,
        status: data.status || 'open',
        confidence: data.confidence,
        extractedKeywords: data.extractedKeywords || [],
        notes: data.notes || '',
        updatedBy: userId,
        updatedAt: Timestamp.now()
      };

      // 移除undefined值
      const cleanUpdateData = this.removeUndefinedFields(updateData);
      
      const docRef = doc(db, 'standards', standardId);
      await updateDoc(docRef, cleanUpdateData);
    } catch (error) {
      console.error('❌ 更新standard失败:', error);
      throw error;
    }
  }

  /**
   * 更新分数规则
   */
  private async updateScoreRules(standardId: string, scoreRules: any[], userId: string): Promise<void> {
    try {
      // 这里可以添加删除旧规则的逻辑
      // 然后重新保存新的规则
      await this.saveScoreRules(standardId, scoreRules, userId);
    } catch (error) {
      console.error('❌ 更新分数规则失败:', error);
      throw error;
    }
  }

  /**
   * 更新团队管理
   */
  private async updateTeamManagement(standardId: string, teamManagement: any, userId: string): Promise<void> {
    try {
      // 这里可以添加删除旧团队管理数据的逻辑
      // 然后重新保存新的数据
      await this.saveTeamManagement(standardId, teamManagement, userId);
    } catch (error) {
      console.error('❌ 更新团队管理失败:', error);
      throw error;
    }
  }

  /**
   * 移除对象中的undefined字段
   */
  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedFields(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * 生成内容哈希
   */
  private generateHash(content: string): string {
    // 简单的哈希函数，实际项目中可以使用crypto-js
    let hash = 0;
    if (content.length === 0) return hash.toString();
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取解读历史记录
   */
  async getInterpretationHistory(_userId?: string, _limit: number = 10): Promise<InterpretationLog[]> {
    try {
      console.log('📖 获取解读历史记录');

      // 这里应该实现查询逻辑
      // 由于Firebase查询的复杂性，这里返回空数组
      // 实际实现中应该添加适当的查询
      
      return [];
    } catch (error) {
      console.error('❌ 获取解读历史失败:', error);
      return [];
    }
  }

  /**
   * 删除解读记录
   */
  async deleteInterpretationLog(logId: string): Promise<boolean> {
    try {
      console.log('🗑️ 删除解读记录:', logId);

      // 这里应该实现删除逻辑
      // 实际实现中应该调用Firebase的deleteDoc
      
      return true;
    } catch (error) {
      console.error('❌ 删除解读记录失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const databaseWriteService = DatabaseWriteService.getInstance();
