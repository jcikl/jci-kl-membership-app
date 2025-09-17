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
  Survey, 
  SurveyResponse, 
  SurveyAnalytics, 
  SurveyStatus,
  SurveyType,
  SurveyTargetAudience,
  PaginationParams,
  PaginatedResponse,
  ApiResponse
} from '@/types';

// 问卷服务
export const surveyService = {
  // 创建问卷
  async createSurvey(surveyData: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'totalResponses'>): Promise<ApiResponse<Survey>> {
    try {
      const now = new Date().toISOString();
      const survey: Omit<Survey, 'id'> = {
        ...surveyData,
        totalResponses: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, 'surveys'), {
        ...survey,
        createdAt: Timestamp.fromDate(new Date(now)),
        updatedAt: Timestamp.fromDate(new Date(now)),
      });

      return {
        success: true,
        data: { ...survey, id: docRef.id },
        message: '问卷创建成功'
      };
    } catch (error) {
      console.error('创建问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建问卷失败'
      };
    }
  },

  // 获取问卷详情
  async getSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    try {
      const docRef = doc(db, 'surveys', surveyId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: '问卷不存在'
        };
      }

      const data = docSnap.data();
      const survey: Survey = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
      } as Survey;

      return {
        success: true,
        data: survey
      };
    } catch (error) {
      console.error('获取问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问卷失败'
      };
    }
  },

  // 更新问卷
  async updateSurvey(surveyId: string, updates: Partial<Survey>): Promise<ApiResponse<Survey>> {
    try {
      const docRef = doc(db, 'surveys', surveyId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      // 获取更新后的数据
      const result = await this.getSurvey(surveyId);
      if (result.success) {
        return {
          success: true,
          data: result.data!,
          message: '问卷更新成功'
        };
      }

      return result;
    } catch (error) {
      console.error('更新问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新问卷失败'
      };
    }
  },

  // 删除问卷
  async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, 'surveys', surveyId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: '问卷删除成功'
      };
    } catch (error) {
      console.error('删除问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除问卷失败'
      };
    }
  },

  // 获取问卷列表
  async getSurveys(
    params: PaginationParams & {
      status?: SurveyStatus;
      type?: SurveyType;
      targetAudience?: SurveyTargetAudience;
      createdBy?: string;
      search?: string;
    } = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<Survey>>> {
    try {
      const { page = 1, limit: pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;
      
      let q = query(collection(db, 'surveys'));

      // 应用过滤器
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.targetAudience) {
        q = query(q, where('targetAudience', '==', filters.targetAudience));
      }
      if (filters.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      // 排序
      q = query(q, orderBy(sortBy, sortOrder));

      // 分页
      const startIndex = (page - 1) * pageSize;
      if (startIndex > 0) {
        // 这里需要实现游标分页，暂时使用简单分页
        q = query(q, limit(pageSize));
      } else {
        q = query(q, limit(pageSize));
      }

      const snapshot = await getDocs(q);
      const surveys: Survey[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const survey: Survey = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
        } as Survey;
        surveys.push(survey);
      });

      // 搜索过滤（客户端过滤，生产环境建议使用Algolia等搜索服务）
      let filteredSurveys = surveys;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredSurveys = surveys.filter(survey => 
          survey.title.toLowerCase().includes(searchTerm) ||
          survey.description?.toLowerCase().includes(searchTerm) ||
          survey.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      return {
        success: true,
        data: {
          data: filteredSurveys,
          total: filteredSurveys.length, // 实际应用中需要单独查询总数
          page,
          limit: pageSize,
          totalPages: Math.ceil(filteredSurveys.length / pageSize)
        }
      };
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问卷列表失败'
      };
    }
  },

  // 发布问卷
  async publishSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    try {
      const now = new Date().toISOString();
      const result = await this.updateSurvey(surveyId, {
        status: 'published',
        publishedAt: now
      });

      return result;
    } catch (error) {
      console.error('发布问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发布问卷失败'
      };
    }
  },

  // 关闭问卷
  async closeSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    try {
      const result = await this.updateSurvey(surveyId, {
        status: 'closed'
      });

      return result;
    } catch (error) {
      console.error('关闭问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '关闭问卷失败'
      };
    }
  },

  // 归档问卷
  async archiveSurvey(surveyId: string): Promise<ApiResponse<Survey>> {
    try {
      const result = await this.updateSurvey(surveyId, {
        status: 'archived'
      });

      return result;
    } catch (error) {
      console.error('归档问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '归档问卷失败'
      };
    }
  },

  // 复制问卷
  async duplicateSurvey(surveyId: string, newTitle: string, createdBy: string): Promise<ApiResponse<Survey>> {
    try {
      const originalResult = await this.getSurvey(surveyId);
      if (!originalResult.success || !originalResult.data) {
        return {
          success: false,
          error: '原问卷不存在'
        };
      }

      const original = originalResult.data;
      const now = new Date().toISOString();

      const duplicatedSurvey: Omit<Survey, 'id'> = {
        ...original,
        title: newTitle,
        status: 'draft',
        createdBy,
        totalResponses: 0,
        createdAt: now,
        updatedAt: now,
        publishedAt: undefined,
        // 重新生成问题ID
        questions: original.questions.map(q => ({
          ...q,
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      };

      return await this.createSurvey(duplicatedSurvey);
    } catch (error) {
      console.error('复制问卷失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '复制问卷失败'
      };
    }
  },

  // 获取用户的问卷
  async getUserSurveys(userId: string, params: PaginationParams = { page: 1, limit: 10 }): Promise<ApiResponse<PaginatedResponse<Survey>>> {
    return this.getSurveys({
      ...params,
      createdBy: userId
    });
  },

  // 获取公开的问卷（用于回答）
  async getPublicSurveys(params: PaginationParams = { page: 1, limit: 10 }): Promise<ApiResponse<PaginatedResponse<Survey>>> {
    return this.getSurveys({
      ...params,
      status: 'published'
    });
  }
};

// 问卷回答服务
export const surveyResponseService = {
  // 提交问卷回答
  async submitResponse(responseData: Omit<SurveyResponse, 'id' | 'startedAt' | 'completedAt' | 'timeSpent'>): Promise<ApiResponse<SurveyResponse>> {
    try {
      const now = new Date().toISOString();
      const response: Omit<SurveyResponse, 'id'> = {
        ...responseData,
        status: 'completed',
        startedAt: (responseData as any).startedAt || now,
        completedAt: now,
        timeSpent: (responseData as any).timeSpent || 0
      };

      const docRef = await addDoc(collection(db, 'survey_responses'), {
        ...response,
        startedAt: Timestamp.fromDate(new Date(response.startedAt)),
        completedAt: Timestamp.fromDate(new Date(response.completedAt || now)),
      });

      // 更新问卷的回答数量
      await surveyService.updateSurvey(responseData.surveyId, {
        totalResponses: (await surveyService.getSurvey(responseData.surveyId)).data?.totalResponses || 0 + 1
      });

      return {
        success: true,
        data: { ...response, id: docRef.id },
        message: '回答提交成功'
      };
    } catch (error) {
      console.error('提交回答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交回答失败'
      };
    }
  },

  // 获取问卷回答
  async getResponse(responseId: string): Promise<ApiResponse<SurveyResponse>> {
    try {
      const docRef = doc(db, 'survey_responses', responseId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: '回答不存在'
        };
      }

      const data = docSnap.data();
      const response: SurveyResponse = {
        id: docSnap.id,
        ...data,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
      } as SurveyResponse;

      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('获取回答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取回答失败'
      };
    }
  },

  // 获取问卷的所有回答
  async getSurveyResponses(
    surveyId: string, 
    params: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<SurveyResponse>>> {
    try {
      const { page = 1, limit: pageSize = 10 } = params;
      
      const q = query(
        collection(db, 'survey_responses'),
        where('surveyId', '==', surveyId),
        orderBy('completedAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const responses: SurveyResponse[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const response: SurveyResponse = {
          id: doc.id,
          ...data,
          startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
          completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
        } as SurveyResponse;
        responses.push(response);
      });

      return {
        success: true,
        data: {
          data: responses,
          total: responses.length,
          page,
          limit: pageSize,
          totalPages: Math.ceil(responses.length / pageSize)
        }
      };
    } catch (error) {
      console.error('获取问卷回答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问卷回答失败'
      };
    }
  },

  // 获取用户的回答
  async getUserResponses(
    userId: string, 
    params: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ApiResponse<PaginatedResponse<SurveyResponse>>> {
    try {
      const { page = 1, limit: pageSize = 10 } = params;
      
      const q = query(
        collection(db, 'survey_responses'),
        where('respondentId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const responses: SurveyResponse[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const response: SurveyResponse = {
          id: doc.id,
          ...data,
          startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
          completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
        } as SurveyResponse;
        responses.push(response);
      });

      return {
        success: true,
        data: {
          data: responses,
          total: responses.length,
          page,
          limit: pageSize,
          totalPages: Math.ceil(responses.length / pageSize)
        }
      };
    } catch (error) {
      console.error('获取用户回答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户回答失败'
      };
    }
  },

  // 删除回答
  async deleteResponse(responseId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, 'survey_responses', responseId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: '回答删除成功'
      };
    } catch (error) {
      console.error('删除回答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除回答失败'
      };
    }
  }
};

// 问卷分析服务
export const surveyAnalyticsService = {
  // 获取问卷分析数据
  async getSurveyAnalytics(surveyId: string): Promise<ApiResponse<SurveyAnalytics>> {
    try {
      // 获取问卷信息
      const surveyResult = await surveyService.getSurvey(surveyId);
      if (!surveyResult.success || !surveyResult.data) {
        return {
          success: false,
          error: '问卷不存在'
        };
      }

      // 获取回答数据
      const responsesResult = await surveyResponseService.getSurveyResponses(surveyId, { page: 1, limit: 1000 });
      if (!responsesResult.success || !responsesResult.data) {
        return {
          success: false,
          error: '获取回答数据失败'
        };
      }

      const responses = responsesResult.data.data;
      const survey = surveyResult.data;

      // 计算基础统计
      const totalResponses = responses.length;
      const completedResponses = responses.filter(r => r.status === 'completed').length;
      const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
      
      const totalTimeSpent = responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
      const averageTimeSpent = completedResponses > 0 ? totalTimeSpent / completedResponses : 0;

      // 计算问题分析
      const questionAnalytics = survey.questions.map(question => {
        const questionResponses = responses
          .filter(r => r.status === 'completed')
          .map(r => r.answers.find(a => a.questionId === question.id))
          .filter(Boolean);

        const totalAnswers = questionResponses.length;
        const completionRate = totalAnswers / totalResponses * 100;

        let analytics: any = {
          questionId: question.id,
          questionTitle: question.title,
          questionType: question.type,
          totalAnswers,
          completionRate
        };

        // 根据问题类型计算特定分析
        if (question.type === 'rating' || question.type === 'nps') {
          const ratings = questionResponses
            .map(r => r?.value as number)
            .filter(r => typeof r === 'number');
          
          if (ratings.length > 0) {
            analytics.averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          }
        } else if (question.type === 'single_choice' || question.type === 'multiple_choice') {
          const distribution: Record<string, number> = {};
          questionResponses.forEach(r => {
            if (r?.value) {
              const values = Array.isArray(r.value) ? r.value : [r.value];
              values.forEach(v => {
                const key = String(v);
                distribution[key] = (distribution[key] || 0) + 1;
              });
            }
          });
          analytics.distribution = distribution;
        } else if (question.type === 'text' || question.type === 'textarea') {
          analytics.textAnswers = questionResponses
            .map(r => r?.value as string)
            .filter(Boolean);
        }

        return analytics;
      });

      // 计算回答趋势（按日期分组）
      const responseTrends: Record<string, { responses: number; completions: number }> = {};
      responses.forEach(response => {
        const date = new Date(response.completedAt || response.startedAt).toISOString().split('T')[0];
        if (!responseTrends[date]) {
          responseTrends[date] = { responses: 0, completions: 0 };
        }
        responseTrends[date].responses++;
        if (response.status === 'completed') {
          responseTrends[date].completions++;
        }
      });

      const responseTrendsArray = Object.entries(responseTrends)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const analytics: SurveyAnalytics = {
        surveyId,
        totalResponses,
        completionRate,
        averageTimeSpent,
        questionAnalytics,
        responseTrends: responseTrendsArray,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('获取问卷分析失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问卷分析失败'
      };
    }
  }
};
