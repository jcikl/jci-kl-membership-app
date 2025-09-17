// 财务管理系统类型定义

// 银行户口类型
export interface BankAccount {
  id: string;
  accountName: string; // 户口名称
  accountType: BankAccountType; // 户口类型
  initialAmount: number; // 银行户口开创金额
  currentBalance: number; // 当前余额
  bankName?: string; // 银行名称
  accountNumber?: string; // 账号
  description?: string; // 描述
  isActive: boolean; // 是否启用
  createdBy: string; // 创建者
  createdAt: string;
  updatedAt: string;
  
  // 累计余额优化字段
  yearEndBalances?: { [year: number]: number }; // 各年份年末余额缓存
  lastCalculatedYear?: number; // 最后计算的年份
  lastTransactionId?: string; // 最后一笔交易的ID
  lastTransactionDate?: string; // 最后一笔交易的日期
  balanceCalculationVersion?: number; // 余额计算版本号（用于数据迁移）
}

export type BankAccountType = 'savings' | 'current' | 'fixed_deposit' | 'investment' | 'other';

// 会员费匹配数据类型
export interface MembershipFeeData {
  matchedAccountIds: string[]; // 匹配的用户户口系统ID列表
  matchedAt: string;
  matchedBy: string;
  membershipType: 'renewal' | 'new' | 'mixed';
  renewalAccountIds?: string[]; // 续费用户户口系统ID列表
  newAccountIds?: string[]; // 新用户户口系统ID列表
}

// 交易记录类型
export interface Transaction {
  id: string;
  transactionNumber: string; // 交易记录序号 (TXN-YYYY-XXXX-XXXX)
  bankAccountId: string; // 关联银行户口
  transactionDate: string; // 交易日期
  mainDescription: string; // 主描述（必填）
  subDescription?: string; // 副描述
  expense: number; // 支出金额
  income: number; // 收入金额
  payerPayee?: string; // 付款人/收款人（合并字段，用于存储会员匹配信息）
  transactionType?: string; // 交易类型
  projectAccount?: string; // 业务分类ID（保持向后兼容）
  projectAccountId?: string; // 项目户口ID
  transactionPurpose?: string; // 交易用途
  accountType?: string; // 户口类型
  inputBy: string; // 输入人
  paymentDescription?: string; // 付款描述
  notes?: string; // 备注
  attachments?: string[]; // 附件URL
  membershipFeeData?: MembershipFeeData; // 会员费匹配数据
  // 地理和组织信息
  worldRegion?: string; // 世界区域
  country?: string; // 国家
  countryRegion?: string; // 国家区域
  chapter?: string; // 分会
  createdAt: string;
  updatedAt: string;
  
  // 兼容性属性 (为了支持现有组件)
  purposeId?: string; // 兼容 purposeId
  purposeName?: string; // 兼容 purposeName
  date?: string; // 兼容 date (映射到 transactionDate)
  amount?: number; // 兼容 amount (映射到 income - expense)
  description?: string; // 兼容 description (映射到 mainDescription)
  status?: string; // 兼容 status
  payer?: string; // 兼容 payer (映射到 payerPayee)
  payee?: string; // 兼容 payee (映射到 payerPayee)
}

// 交易用途类型
export interface TransactionPurpose {
  id: string;
  name: string; // 用途名称
  description?: string; // 描述
  category?: string; // 分类（交易用途ID，可选）
  parentId?: string; // 父目录ID
  level: number; // 层级 (0: 根目录, 1: 子目录, 2: 具体用途)
  isActive: boolean; // 是否启用
  createdBy: string; // 创建者
  createdAt: string;
  updatedAt: string;
}

// TransactionPurposeCategory 已移除，现在使用动态的分类系统
// 分类通过1级目录记录来管理，不再使用预定义的枚举

// 费用拆分类型
export interface ExpenseSplit {
  id: string;
  transactionId: string; // 关联交易
  purposeId: string; // 交易用途ID
  purposeName: string; // 交易用途名称
  amount: number; // 拆分金额
  description?: string; // 描述
  createdAt: string;
}

// 交易拆分记录类型
export interface TransactionSplit {
  id: string;
  transactionId: string; // 关联主交易记录
  transactionNumber: string; // 拆分记录序号（格式：主交易记录序号-01）
  splitIndex: number; // 拆分序号
  amount: number; // 拆分金额
  transactionDate: string; // 交易日期（从主交易记录复制）
  mainDescription: string; // 主描述（从主交易记录复制）
  subDescription?: string; // 副描述（从主交易记录复制）
  transactionPurpose?: string; // 交易用途ID
  projectAccount?: string; // 项目户口
  payerPayee?: string; // 付款人/收款人（从主交易记录复制）
  transactionType?: string; // 主要分类（从主交易记录复制）
  description?: string; // 拆分描述
  notes?: string; // 备注
  createdAt: string;
  updatedAt: string;
  
  // 兼容性属性
  status?: string; // 兼容 status
  payerName?: string; // 兼容 payerName
  payeeName?: string; // 兼容 payeeName
}

// JCI预算分类类型
export type BudgetMainCategory = 'income' | 'expense';
export type BudgetSubCategory = 
  // 收入子分类
  | 'membership_subscription' | 'external_funding' | 'project_surplus' | 'project_floating_funds' | 'other_income'
  // 支出子分类  
  | 'administrative_management' | 'projects' | 'convention_reception' | 'merchandise' | 'pre_purchase_tickets';

// 预算项目类型
export interface BudgetItem {
  id: string;
  itemName: string; // 具体项目名称
  itemCode: string; // 项目代码 (如 A.1, B.1, C.1 等)
  amount: number; // 项目金额
  note?: string; // 备注说明
  parentSubCategory: BudgetSubCategory; // 所属子分类
}

// 预算子分类类型
export interface BudgetSubCategoryData {
  id: string;
  subCategoryName: string; // 子分类名称
  subCategoryCode: string; // 子分类代码 (如 A, B, C, D, E)
  totalAmount: number; // 子分类总金额
  items: BudgetItem[]; // 具体项目列表
  parentMainCategory: BudgetMainCategory; // 所属主分类
}

// 预算主分类类型
export interface BudgetMainCategoryData {
  id: string;
  mainCategoryName: string; // 主分类名称 (收入/支出)
  mainCategoryCode: string; // 主分类代码 (I/II)
  totalAmount: number; // 主分类总金额
  subCategories: BudgetSubCategoryData[]; // 子分类列表
}

// 预算类型
export interface Budget {
  id: string;
  projectName: string; // 项目名称
  budgetYear: number; // 预算年份
  totalBudget: number; // 总预算
  allocatedAmount: number; // 已分配金额
  spentAmount: number; // 已支出金额
  remainingAmount: number; // 剩余金额
  status: BudgetStatus; // 预算状态
  description?: string; // 描述
  createdBy: string; // 创建者
  createdAt: string;
  updatedAt: string;
  // 新增的层次结构字段
  mainCategory?: BudgetMainCategory; // 主分类
  subCategory?: BudgetSubCategory; // 子分类
  itemCode?: string; // 项目代码
  note?: string; // 备注
}

export type BudgetStatus = 'draft' | 'approved' | 'active' | 'completed' | 'cancelled' | 'revoked';

// 预算分配类型
export interface BudgetAllocation {
  id: string;
  budgetId: string; // 关联预算
  purposeId: string; // 交易用途ID
  purposeName: string; // 交易用途名称
  allocatedAmount: number; // 分配金额
  spentAmount: number; // 已支出金额
  remainingAmount: number; // 剩余金额
  createdAt: string;
  updatedAt: string;
}

// 账单付款申请类型
export interface BillPaymentRequest {
  id: string;
  submitterId: string; // 提交人ID
  submitterName: string; // 提交人姓名
  submitterAccount: string; // 提交用户户口
  submitDate: string; // 提交日期
  projectYear: number; // 付款项目年份
  totalAmount: number; // 总账单金额
  currency: string; // 账单货币（默认马币）
  recipientBank: string; // 收款银行
  recipientName: string; // 收款人
  recipientAccount: string; // 收款账号
  paymentAccountId: string; // 支付户口ID
  paymentAccountName: string; // 支付户口名称
  billDetails: BillDetail[]; // 账单明细
  status: BillPaymentStatus; // 付款状态
  approvalNotes?: string; // 审批备注
  approvedBy?: string; // 审批人
  approvedAt?: string; // 审批时间
  paidAt?: string; // 支付时间
  approvalHistory?: ApprovalHistory[]; // 审批历史记录
  createdAt: string;
  updatedAt: string;
}

export type BillPaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';

// 审批历史记录类型
export interface ApprovalHistory {
  id: string;
  action: 'submit' | 'approve' | 'reject' | 'pay' | 'cancel';
  actorId: string;
  actorName: string;
  timestamp: string;
  notes?: string;
  previousStatus?: BillPaymentStatus;
  newStatus: BillPaymentStatus;
}

// 账单明细类型
export interface BillDetail {
  id: string;
  description: string; // 描述
  amount: number; // 金额
  receiptUrl?: string; // 单据上传URL
  notes?: string; // 备注
}

// 理事会议记录类型
export interface CouncilMeetingRecord {
  id: string;
  billPaymentRequestId: string; // 关联账单付款申请
  proposer: string; // 提案人
  seconder: string; // 复议人
  meetingDate: string; // 会议日期
  meetingNotes?: string; // 会议记录
  resolution?: string; // 决议
  createdAt: string;
}

// 财务报告类型
export interface FinancialReport {
  id: string;
  reportType: FinancialReportType; // 报告类型
  reportName: string; // 报告名称
  reportPeriod: string; // 报告期间
  generatedBy: string; // 生成者
  generatedAt: string; // 生成时间
  data: FinancialReportData; // 报告数据
  status: ReportStatus; // 报告状态
  createdAt: string;
  updatedAt: string;
}


export type FinancialReportType = 
  | 'statement_of_financial_position' // 财务状况表 (资产负债表)
  | 'income_statement' // 损益表
  | 'detailed_income_statement' // 详细损益表
  | 'notes_to_financial_statements' // 财务报表附注
  | 'cash_flow' // 现金流量表
  | 'bank_reconciliation' // 银行对账单
  | 'monthly_summary' // 月度收支报告
  | 'project_summary' // 项目收支报告
  | 'balance_sheet' // 资产负债表 (别名)
  | 'general_ledger'; // 总账

export type ReportStatus = 'generating' | 'completed' | 'failed';

// 财务报告数据类型
export interface FinancialReportData {
  reportType?: FinancialReportType; // 报告类型
  period?: { 
    startDate?: string;
    endDate?: string;
  }; // 报告期间
  
  // 基础数据
  totalIncome: number; // 总收入
  totalExpense: number; // 总支出
  netIncome: number; // 净收入
  bankBalances: BankBalance[]; // 银行余额
  transactions: Transaction[]; // 交易记录
  budgetComparison: BudgetComparison[]; // 预算对比
  projectSummary?: ProjectSummary[]; // 项目汇总
  
  // 汇总数据
  summary?: {
    netIncome: number;
    openingBalance: number;
    periodIncome: number;
    periodExpense: number;
    closingBalance: number;
  };
  
  // 详细数据
  details?: {
    income: Record<string, number>;
    expense: Record<string, number>;
    monthlyData: Record<string, { income: number; expense: number; netIncome: number }>;
  };
  
  // 标准财务报表数据
  statementOfFinancialPosition?: StatementOfFinancialPositionData; // 财务状况表数据
  incomeStatement?: IncomeStatementData; // 损益表数据
  detailedIncomeStatement?: DetailedIncomeStatementData; // 详细损益表数据
  notesToFinancialStatements?: NotesToFinancialStatementsData; // 财务报表附注数据
}

// 财务状况表 (资产负债表) 数据
export interface StatementOfFinancialPositionData {
  organizationName: string; // 组织名称
  reportDate: string; // 报告日期
  currentYear: number; // 当前年度
  previousYear: number; // 上一年度
  
  // 非流动资产
  nonCurrentAssets: {
    propertyPlantEquipment: {
      cost: number;
      accumulatedDepreciation: number;
      carryingAmount: number;
    };
  };
  
  // 流动资产
  currentAssets: {
    inventories: number;
    otherReceivablesDepositsPrepayment: number;
    depositsWithFinancialInstitution: number;
    bankBalances: number;
    subtotal: number;
  };
  
  // 流动负债
  currentLiabilities: {
    otherPayables: number;
  };
  
  // 净流动资产
  netCurrentAssets: number;
  
  // 总资产
  totalAssets: number;
  
  // 资金来源
  financedBy: {
    accumulatedFunds: number;
    currentYearSurplusDeficit: number;
    total: number;
  };
}

// 损益表数据
export interface IncomeStatementData {
  organizationName: string;
  reportPeriod: string;
  currentYear: number;
  previousYear: number;
  
  incomes: number;
  costOfGoodsSold: number;
  expenses: number;
  depreciation: number;
  subtotalExpenses: number;
  profitBeforeTaxation: number;
  taxExpenses: number;
  profitForTheYear: number;
  priorYearAdjustment: number;
  adjustedProfitForTheYear: number;
}

// 详细损益表数据
export interface DetailedIncomeStatementData {
  organizationName: string;
  reportPeriod: string;
  currentYear: number;
  previousYear: number;
  
  // 收入明细
  incomeDetails: IncomeDetail[];
  
  // 折旧
  depreciation: number;
  
  // 销售成本
  costOfGoodsSold: {
    openingInventory: number;
    costOfGoodsPurchased: number;
    closingInventory: number;
    total: number;
  };
  
  // 费用明细
  expenseDetails: ExpenseDetail[];
  
  // 利润计算
  profitCalculation: {
    profitBeforeTaxation: number;
    taxExpenses: number;
    profitForTheYear: number;
    priorYearAdjustment: number;
    adjustedProfitForTheYear: number;
  };
}

// 收入明细
export interface IncomeDetail {
  category: string; // 收入类别 (如: Membership, Project, Bank Interest等)
  subcategory: string; // 子类别
  description: string; // 描述
  currentYear: number;
  previousYear: number;
  note?: string; // 附注编号
  appendix?: string; // 附录编号
}

// 费用明细
export interface ExpenseDetail {
  category: string; // 费用类别 (如: Bank, JCIM, Office Expense等)
  subcategory: string; // 子类别
  description: string; // 描述
  currentYear: number;
  previousYear: number;
  note?: string; // 附注编号
  appendix?: string; // 附录编号
}

// 财务报表附注数据
export interface NotesToFinancialStatementsData {
  organizationName: string;
  reportPeriod: string;
  
  // 附注内容
  notes: FinancialNote[];
}

// 财务附注
export interface FinancialNote {
  noteNumber: string; // 附注编号
  title: string; // 附注标题
  content: string; // 附注内容
  details: FinancialNoteDetail[]; // 附注详情
}

// 附注详情
export interface FinancialNoteDetail {
  description: string;
  currentYear: number;
  previousYear: number;
  additionalInfo?: string; // 额外信息
}

// 银行余额类型
export interface BankBalance {
  accountId: string;
  accountName: string;
  balance: number;
  lastUpdated: string;
}

// 预算对比类型
export interface BudgetComparison {
  purposeId: string;
  purposeName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
}

// 项目汇总类型
export interface ProjectSummary {
  projectName: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  transactionCount: number;
}

// 财务导入数据类型
export interface FinancialImportData {
  transactionDate: string; // 日期 (必填)
  mainDescription: string; // 主描述 (必填)
  subDescription?: string; // 副描述
  expense: number; // 支出
  income: number; // 收入
  payer?: string; // 付款人/收款人
  payee?: string; // 收款人
  transactionPurpose?: string; // 交易用途
  projectAccount?: string; // 项目户口
  accountType?: string; // 户口类型
  inputBy?: string; // 输入人
  paymentDescription?: string; // 付款描述
  bankAccountId: string; // 银行户口ID
}

// 财务权限类型
export interface FinancePermission {
  userId: string;
  permissions: FinancePermissionType[];
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export type FinancePermissionType = 
  | 'view_accounts' // 查看银行户口
  | 'create_accounts' // 创建银行户口
  | 'edit_accounts' // 编辑银行户口
  | 'delete_accounts' // 删除银行户口
  | 'view_transactions' // 查看交易记录
  | 'create_transactions' // 创建交易记录
  | 'edit_transactions' // 编辑交易记录
  | 'delete_transactions' // 删除交易记录
  | 'import_transactions' // 导入交易记录
  | 'manage_purposes' // 管理交易用途
  | 'view_budgets' // 查看预算
  | 'create_budgets' // 创建预算
  | 'edit_budgets' // 编辑预算
  | 'approve_budgets' // 审批预算
  | 'view_bill_requests' // 查看账单申请
  | 'create_bill_requests' // 创建账单申请
  | 'approve_bill_requests' // 审批账单申请
  | 'view_reports' // 查看财务报告
  | 'generate_reports' // 生成财务报告
  | 'export_reports'; // 导出财务报告

// 财务设置类型
export interface FinanceSettings {
  id: string;
  defaultCurrency: string; // 默认货币
  defaultAuditYear: number; // 默认审计年份
  autoBackupEnabled: boolean; // 自动备份
  backupFrequency: 'daily' | 'weekly' | 'monthly'; // 备份频率
  reportRetentionDays: number; // 报告保留天数
  transactionRetentionDays: number; // 交易记录保留天数
  approvalWorkflow: ApprovalWorkflow; // 审批工作流
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalWorkflow {
  requireApprovalForAmount: number; // 需要审批的金额阈值
  approvers: string[]; // 审批人列表
  autoApprovalEnabled: boolean; // 自动审批
  notificationEnabled: boolean; // 通知启用
}
