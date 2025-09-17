import OpenAI from 'openai';
import { ChatGPTResponse } from '@/types/pdfInterpretation';

/**
 * ChatGPT解读服务
 * 负责调用ChatGPT API解读PDF内容并生成结构化数据
 */
export class ChatGPTService {
  private static instance: ChatGPTService;
  private openai: OpenAI | null = null;
  
  public static getInstance(): ChatGPTService {
    if (!ChatGPTService.instance) {
      ChatGPTService.instance = new ChatGPTService();
    }
    return ChatGPTService.instance;
  }

  /**
   * 初始化ChatGPT客户端
   */
  private initializeClient(): void {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API密钥未配置，请在环境变量中设置VITE_OPENAI_API_KEY');
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // 注意：在生产环境中应该通过后端API调用
    });
  }

  /**
   * 解读PDF内容并生成结构化数据
   */
  async interpretPDF(pdfContent: string, filename: string): Promise<ChatGPTResponse> {
    try {
      console.log('🤖 开始ChatGPT解读PDF内容:', filename);
      
      if (!this.openai) {
        this.initializeClient();
      }

      const prompt = this.buildPrompt(pdfContent, filename);
      
      // 尝试使用免费模型，如果失败则回退到默认响应
      let response;
      try {
        response = await this.openai!.chat.completions.create({
          model: 'gpt-3.5-turbo', // 使用免费模型
          messages: [
            {
              role: 'system',
              content: '你是一个专业的指标文件解读专家，专门分析JCI青年商会的奖励指标文件。请仔细分析PDF内容，提取所有相关信息，并以JSON格式返回结果。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000, // 减少token数量以适应免费额度
          temperature: 0.1, // 低温度确保输出一致性
        });
      } catch (apiError) {
        console.warn('⚠️ ChatGPT API调用失败，使用默认响应:', apiError);
        return this.getDefaultResponse();
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('ChatGPT返回空内容');
      }

      console.log('✅ ChatGPT解读完成，开始解析响应');
      
      // 解析JSON响应
      const chatGPTResponse = this.parseResponse(content);
      
      console.log('✅ ChatGPT响应解析完成:', {
        awardType: chatGPTResponse.awardType,
        confidence: chatGPTResponse.confidence,
        scoreRulesCount: chatGPTResponse.scoreRules.length,
        keywordsCount: chatGPTResponse.extractedKeywords.length
      });

      return chatGPTResponse;
    } catch (error) {
      console.error('❌ ChatGPT解读失败:', error);
      throw new Error(`ChatGPT解读失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构建ChatGPT提示词
   */
  private buildPrompt(pdfContent: string, filename: string): string {
    return `
你是一个专业的指标文件解读专家。请分析以下PDF指标文件内容，并提取出创建StandardEditModal所需的所有字段参数。

文件名：${filename}

PDF内容：
${pdfContent}

请按照以下JSON格式输出结果，确保包含所有相关字段：

{
  "awardType": "efficient_star|star_point|national_area_incentive",
  "basicFields": {
    "title": "指标标题",
    "description": "详细描述",
    "deadline": "YYYY-MM-DD格式的截止日期",
    "externalLink": "相关链接(如果有)"
  },
  "categoryFields": {
    "categoryId": "类别ID(如果是Star Point)",
    "category": "类别类型(如果是Star Point)"
  },
  "specificFields": {
    "no": "序号(如果是Efficient Star)",
    "guidelines": "指导原则",
    "objective": "目标分数(如果是Star Point)",
    "nationalAllocation": "国家级分配(如果是National Area Incentive)",
    "areaAllocation": "区域级分配(如果是National Area Incentive)",
    "status": "open|closed|completed(如果是National Area Incentive)"
  },
  "scoreRules": [
    {
      "name": "规则名称",
      "baseScore": 基础积分,
      "description": "规则描述",
      "enabled": true,
      "conditions": [
        {
          "type": "memberCount|nonMemberCount|totalCount|activityCount|activityType|activityCategory|specificActivity|partnerCount",
          "memberCount": 人数(如果适用),
          "nonMemberCount": 非会员人数(如果适用),
          "totalCount": 总人数(如果适用),
          "activityCount": 活动场数(如果适用),
          "activityType": "活动类型(如果适用)",
          "activityCategory": "活动类别(如果适用)",
          "specificActivity": "具体活动名称(如果适用)",
          "partnerCount": 合作伙伴数量(如果适用),
          "partnerType": "合作伙伴类型(如果适用)",
          "points": 达成积分,
          "description": "条件描述"
        }
      ]
    }
  ],
  "teamManagement": {
    "positions": [
      {
        "name": "职位名称",
        "description": "职位描述",
        "isRequired": true|false,
        "maxMembers": 最大成员数
      }
    ]
  },
  "confidence": 0.0-1.0,
  "extractedKeywords": ["关键词1", "关键词2"],
  "notes": "解读说明和注意事项"
}

解读要求：
1. 仔细分析PDF内容，识别奖项类型和相关指标
2. 提取所有可能的字段信息，缺失的字段设为null
3. 确保日期格式正确(YYYY-MM-DD)
4. 分数规则要详细分析条件类型和参数
5. 提供解读置信度和关键词
6. 如果某些字段无法确定，在notes中说明
7. 必须返回有效的JSON格式，不要包含任何额外的文本或解释

请直接返回JSON结果，不要包含任何其他内容。
`;
  }

  /**
   * 解析ChatGPT响应
   */
  private parseResponse(content: string): ChatGPTResponse {
    try {
      // 尝试提取JSON内容
      let jsonContent = content.trim();
      
      // 如果响应包含代码块标记，提取其中的JSON
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1];
      }
      
      // 如果响应包含JSON对象，提取第一个完整的JSON对象
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      console.log('🔍 解析ChatGPT响应:', jsonContent.substring(0, 200) + '...');
      
      const parsed = JSON.parse(jsonContent);
      
      // 验证和标准化响应格式
      return this.validateAndStandardizeResponse(parsed);
    } catch (error) {
      console.error('❌ 解析ChatGPT响应失败:', error);
      console.log('原始响应内容:', content);
      
      // 返回默认响应
      return this.getDefaultResponse();
    }
  }

  /**
   * 验证和标准化ChatGPT响应
   */
  private validateAndStandardizeResponse(response: any): ChatGPTResponse {
    const defaultResponse = this.getDefaultResponse();
    
    try {
      return {
        awardType: response.awardType || defaultResponse.awardType,
        basicFields: {
          title: response.basicFields?.title || '未命名指标',
          description: response.basicFields?.description || '暂无描述',
          deadline: response.basicFields?.deadline || '2025-12-31',
          externalLink: response.basicFields?.externalLink || null
        },
        categoryFields: {
          categoryId: response.categoryFields?.categoryId || null,
          category: response.categoryFields?.category || null
        },
        specificFields: {
          no: response.specificFields?.no || null,
          guidelines: response.specificFields?.guidelines || null,
          objective: response.specificFields?.objective || null,
          nationalAllocation: response.specificFields?.nationalAllocation || null,
          areaAllocation: response.specificFields?.areaAllocation || null,
          status: response.specificFields?.status || 'open'
        },
        scoreRules: Array.isArray(response.scoreRules) ? response.scoreRules.map((rule: any) => ({
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: rule.name || '未命名规则',
          baseScore: Number(rule.baseScore) || 0,
          description: rule.description || '',
          enabled: Boolean(rule.enabled),
          conditions: Array.isArray(rule.conditions) ? rule.conditions.map((condition: any) => ({
            id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: condition.type || 'memberCount',
            memberCount: condition.memberCount || null,
            nonMemberCount: condition.nonMemberCount || null,
            totalCount: condition.totalCount || null,
            activityCount: condition.activityCount || null,
            activityType: condition.activityType || null,
            activityCategory: condition.activityCategory || null,
            specificActivity: condition.specificActivity || null,
            partnerCount: condition.partnerCount || null,
            partnerType: condition.partnerType || null,
            points: Number(condition.points) || 0,
            description: condition.description || ''
          })) : []
        })) : [],
        teamManagement: response.teamManagement || null,
        confidence: Math.max(0, Math.min(1, Number(response.confidence) || 0.5)),
        extractedKeywords: Array.isArray(response.extractedKeywords) ? response.extractedKeywords : [],
        notes: response.notes || '解读完成'
      };
    } catch (error) {
      console.warn('⚠️ 响应标准化失败，使用默认响应:', error);
      return defaultResponse;
    }
  }

  /**
   * 获取默认响应
   */
  private getDefaultResponse(): ChatGPTResponse {
    return {
      awardType: 'efficient_star',
      basicFields: {
        title: 'PDF解读结果',
        description: 'PDF文件已成功解析，但AI解读功能需要有效的OpenAI API密钥。请手动填写相关字段。',
        deadline: '2025-12-31',
        externalLink: undefined
      },
      categoryFields: {
        categoryId: undefined,
        category: undefined
      },
      specificFields: {
        no: undefined,
        guidelines: undefined,
        objective: undefined,
        nationalAllocation: undefined,
        areaAllocation: undefined,
        status: 'open'
      },
      scoreRules: [],
      teamManagement: undefined,
      confidence: 0.1,
      extractedKeywords: [],
      notes: 'PDF解析成功，但AI解读功能需要OpenAI API密钥。请手动填写相关字段信息。如需使用AI解读功能，请配置有效的VITE_OPENAI_API_KEY环境变量。'
    };
  }

  /**
   * 检查API配置
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }
}

// 导出单例实例
export const chatGPTService = ChatGPTService.getInstance();
