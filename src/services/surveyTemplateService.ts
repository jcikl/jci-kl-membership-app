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
import { db } from './firebase';
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

// 预定义模板数据
export const defaultTemplates: Omit<SurveyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: '活动反馈问卷',
    description: '用于收集活动参与者的反馈意见',
    category: 'feedback',
    isPublic: true,
    createdBy: 'system',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        title: '您对本次活动的整体满意度如何？',
        required: true,
        order: 1,
        validation: { minValue: 1, maxValue: 5 }
      },
      {
        id: 'q2',
        type: 'single_choice',
        title: '您认为活动最吸引人的方面是？',
        required: true,
        order: 2,
        options: [
          { id: 'o1', label: '演讲内容', value: 'content', order: 1 },
          { id: 'o2', label: '互动环节', value: 'interaction', order: 2 },
          { id: 'o3', label: '场地环境', value: 'venue', order: 3 },
          { id: 'o4', label: '组织安排', value: 'organization', order: 4 }
        ]
      },
      {
        id: 'q3',
        type: 'textarea',
        title: '您有什么建议或意见？',
        required: false,
        order: 3,
        validation: { maxLength: 500 }
      }
    ],
    settings: {
      allowBackNavigation: true,
      showProgressBar: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      showQuestionNumbers: true,
      autoSave: true,
      thankYouMessage: '感谢您的反馈！'
    }
  },
  {
    name: '会员评估问卷',
    description: '用于评估会员的表现和贡献',
    category: 'evaluation',
    isPublic: true,
    createdBy: 'system',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        title: '该会员的参与度如何？',
        required: true,
        order: 1,
        validation: { minValue: 1, maxValue: 5 }
      },
      {
        id: 'q2',
        type: 'rating',
        title: '该会员的贡献度如何？',
        required: true,
        order: 2,
        validation: { minValue: 1, maxValue: 5 }
      },
      {
        id: 'q3',
        type: 'single_choice',
        title: '您认为该会员适合担任什么角色？',
        required: false,
        order: 3,
        options: [
          { id: 'o1', label: '领导角色', value: 'leadership', order: 1 },
          { id: 'o2', label: '执行角色', value: 'execution', order: 2 },
          { id: 'o3', label: '支持角色', value: 'support', order: 3 },
          { id: 'o4', label: '顾问角色', value: 'advisor', order: 4 }
        ]
      },
      {
        id: 'q4',
        type: 'textarea',
        title: '请提供具体的评价和建议',
        required: false,
        order: 4,
        validation: { maxLength: 1000 }
      }
    ],
    settings: {
      allowBackNavigation: true,
      showProgressBar: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      showQuestionNumbers: true,
      autoSave: true,
      thankYouMessage: '感谢您的评估！'
    }
  },
  {
    name: '活动报名表',
    description: '用于收集活动报名信息',
    category: 'registration',
    isPublic: true,
    createdBy: 'system',
    questions: [
      {
        id: 'q1',
        type: 'text',
        title: '姓名',
        required: true,
        order: 1,
        validation: { minLength: 2, maxLength: 50 }
      },
      {
        id: 'q2',
        type: 'email',
        title: '邮箱',
        required: true,
        order: 2
      },
      {
        id: 'q3',
        type: 'phone',
        title: '联系电话',
        required: true,
        order: 3
      },
      {
        id: 'q4',
        type: 'single_choice',
        title: '会员类型',
        required: true,
        order: 4,
        options: [
          { id: 'o1', label: '正式会员', value: 'official', order: 1 },
          { id: 'o2', label: '准会员', value: 'associate', order: 2 },
          { id: 'o3', label: '荣誉会员', value: 'honorary', order: 3 },
          { id: 'o4', label: '拜访会员', value: 'visitor', order: 4 }
        ]
      },
      {
        id: 'q5',
        type: 'textarea',
        title: '特殊需求或备注',
        required: false,
        order: 5,
        validation: { maxLength: 200 }
      }
    ],
    settings: {
      allowBackNavigation: true,
      showProgressBar: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      showQuestionNumbers: true,
      autoSave: true,
      thankYouMessage: '报名成功！我们会尽快与您联系。'
    }
  }
];
