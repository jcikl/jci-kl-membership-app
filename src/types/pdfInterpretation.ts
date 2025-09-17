// PDF指标解读系统类型定义

export interface PDFUploadResult {
  file: File;
  text: string;
  pages: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
    fileSize: number;
  };
}

export interface ChatGPTResponse {
  awardType: 'efficient_star' | 'star_point' | 'national_area_incentive';
  basicFields: {
    title: string;
    description: string;
    deadline: string;
    externalLink?: string;
  };
  categoryFields: {
    categoryId?: string;
    category?: 'network_star' | 'experience_star' | 'social_star' | 'outreach_star';
  };
  specificFields: {
    // Efficient Star字段
    no?: number;
    guidelines?: string;
    
    // Star Point字段  
    objective?: number;
    
    // National Area Incentive字段
    nationalAllocation?: string;
    areaAllocation?: string;
    status?: 'open' | 'closed' | 'completed';
  };
  scoreRules: ScoreRule[];
  teamManagement?: {
    positions: TeamPosition[];
  };
  confidence: number;
  extractedKeywords: string[];
  notes: string;
}

export interface ScoreRule {
  id: string;
  name: string;
  baseScore: number;
  description: string;
  enabled: boolean;
  conditions: ScoreCondition[];
}

export interface ScoreCondition {
  id: string;
  type: 'memberCount' | 'nonMemberCount' | 'totalCount' | 'activityCount' | 'activityType' | 'activityCategory' | 'specificActivity' | 'partnerCount';
  memberCount?: number;
  nonMemberCount?: number;
  totalCount?: number;
  activityCount?: number;
  activityType?: string;
  activityCategory?: string;
  specificActivity?: string;
  partnerCount?: number;
  partnerType?: string;
  points: number;
  description: string;
}

export interface TeamPosition {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  maxMembers?: number;
}

export interface StandardEditModalData {
  // 基础字段
  title: string;
  description: string;
  deadline: string;
  externalLink?: string;
  
  // 类别字段
  categoryId?: string;
  category?: string;
  
  // 特定字段
  no?: number;
  guidelines?: string;
  objective?: number;
  nationalAllocation?: string;
  areaAllocation?: string;
  status?: string;
  
  // 分数规则
  scoreRules: ScoreRule[];
  
  // 团队管理
  teamManagement?: {
    positions: TeamPosition[];
  };
  
  // 元数据
  awardType: string;
  confidence: number;
  extractedKeywords: string[];
  notes: string;
  originalPDFContent: string;
  chatGPTResponse: ChatGPTResponse;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface SaveResult {
  success: boolean;
  standardId?: string;
  error?: string;
}

export interface InterpretationLog {
  id: string;
  pdfFilename: string;
  pdfContentHash: string;
  chatGPTResponse: ChatGPTResponse;
  confidence: number;
  extractedKeywords: string[];
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface ChatGPTConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface PDFInterpretationStep {
  title: string;
  description: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface PDFInterpretationState {
  currentStep: number;
  steps: PDFInterpretationStep[];
  uploadedFile: File | null;
  pdfContent: string;
  chatGPTResponse: ChatGPTResponse | null;
  standardData: StandardEditModalData | null;
  validationResult: ValidationResult | null;
  isProcessing: boolean;
  error: string | null;
}
