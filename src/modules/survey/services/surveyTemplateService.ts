import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  SurveyTemplate,
  TemplateCategory,
  PaginationParams,
  PaginatedResponse,
  ApiResponse
} from '@/types';

// 问卷模板服务
export const surveyTemplateService = {
  // 创建模板
  async createTemplate(templateData: Omit<SurveyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ApiResponse<SurveyTemplate>> {
    try {
      const now = new Date().toISOString();
      const template: Omit<SurveyTemplate, 'id'> = {
        ...templateData,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'survey_templates'), {
        ...template,
        createdAt: Timestamp.fromDate(new Date(now)),
        updatedAt: Timestamp.fromDate(new Date(now)),
      });

      return {
        success: true,
        data: { ...template, id: docRef.id },
        message: '模板创建成功'
      };
    } catch (error) {
      console.error('创建模板失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建模板失败'
      };
    }
  },

  // 获取模板详情
  async getTemplate(templateId: string): Promise<ApiResponse<SurveyTemplate>> {
    try {
      const docRef = doc(db, 'survey_templates', templateId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: '模板不存在'
        };
      }

      const data = docSnap.data();
      const template: SurveyTemplate = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as SurveyTemplate;

      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('获取模板失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取模板失败'
      };
    }
  },

  // 更新模板
  async updateTemplate(templateId: string, updates: Partial<SurveyTemplate>): Promise<ApiResponse<SurveyTemplate>> {
    try {
      const docRef = doc(db, 'survey_templates', templateId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // 获取更新后的数据
      const result = await this.getTemplate(templateId);
      if (result.success) {
        return {
          success: true,
          data: result.data!,
          message: '模板更新成功'
        };
      }

      return result;
    } catch (error) {
      console.error('更新模板失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新模板失败'
      };
    }
  },

  // 删除模板
  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, 'survey_templates', templateId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: '模板删除成功'
      };
    } catch (error) {
      console.error('删除模板失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除模板失败'
      };
    }
  },

  // 获取模板列表
  async getTemplates(
    params: PaginationParams & {
      category?: TemplateCategory;
      isPublic?: boolean;
      createdBy?: string;
      search?: string;
    } = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<SurveyTemplate>>> {
    try {
      const { page = 1, limit: pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;
      
      let q = query(collection(db, 'survey_templates'));

      // 应用过滤器
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.isPublic !== undefined) {
        q = query(q, where('isPublic', '==', filters.isPublic));
      }
      if (filters.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      // 排序
      q = query(q, orderBy(sortBy, sortOrder));
      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const templates: SurveyTemplate[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const template: SurveyTemplate = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as SurveyTemplate;
        templates.push(template);
      });

      // 搜索过滤
      let filteredTemplates = templates;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredTemplates = templates.filter(template => 
          template.name.toLowerCase().includes(searchTerm) ||
          template.description?.toLowerCase().includes(searchTerm)
        );
      }

      return {
        success: true,
        data: {
          data: filteredTemplates,
          total: filteredTemplates.length,
          page,
          limit: pageSize,
          totalPages: Math.ceil(filteredTemplates.length / pageSize)
        }
      };
    } catch (error) {
      console.error('获取模板列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取模板列表失败'
      };
    }
  },

  // 获取公开模板
  async getPublicTemplates(params: PaginationParams = { page: 1, limit: 10 }): Promise<ApiResponse<PaginatedResponse<SurveyTemplate>>> {
    return this.getTemplates({
      ...params,
      isPublic: true
    });
  },

  // 获取用户的模板
  async getUserTemplates(userId: string, params: PaginationParams = { page: 1, limit: 10 }): Promise<ApiResponse<PaginatedResponse<SurveyTemplate>>> {
    return this.getTemplates({
      ...params,
      createdBy: userId
    });
  },

  // 使用模板创建问卷
  async createSurveyFromTemplate(
    templateId: string, 
    templateSurveyData: {
      title: string;
      description?: string;
      targetAudience: string;
      createdBy: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const templateResult = await this.getTemplate(templateId);
      if (!templateResult.success || !templateResult.data) {
        return {
          success: false,
          error: '模板不存在'
        };
      }

      const template = templateResult.data;
      
      // 增加使用次数
      await this.updateTemplate(templateId, {
        usageCount: template.usageCount + 1
      });

      // 创建问卷数据
      const surveyData = {
        title: templateSurveyData.title,
        description: templateSurveyData.description,
        status: 'draft' as const,
        type: 'custom' as const,
        targetAudience: templateSurveyData.targetAudience as any,
        questions: template.questions.map(q => ({
          ...q,
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        settings: template.settings,
        createdBy: templateSurveyData.createdBy,
        isAnonymous: false,
        allowMultipleResponses: false,
        tags: []
      };

      // 导入问卷服务
      const { surveyService } = await import('./surveyService');
      return await surveyService.createSurvey(surveyData);
    } catch (error) {
      console.error('使用模板创建问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '使用模板创建问卷失败'
      };
    }
  },

  // 复制模板
  async duplicateTemplate(templateId: string, newName: string, createdBy: string): Promise<ApiResponse<SurveyTemplate>> {
    try {
      const originalResult = await this.getTemplate(templateId);
      if (!originalResult.success || !originalResult.data) {
        return {
          success: false,
          error: '原模板不存在'
        };
      }

      const original = originalResult.data;
      const now = new Date().toISOString();

      const duplicatedTemplate: Omit<SurveyTemplate, 'id'> = {
        ...original,
        name: newName,
        createdBy,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        // 重新生成问题ID
        questions: original.questions.map(q => ({
          ...q,
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      };

      return await this.createTemplate(duplicatedTemplate);
    } catch (error) {
      console.error('复制模板失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '复制模板失败'
      };
    }
  }
};

// 预定义模板数据 - 已清空
export const defaultTemplates: Omit<SurveyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [];
